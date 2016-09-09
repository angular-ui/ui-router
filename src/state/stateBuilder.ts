/** @module state */ /** for typedoc */
import {Obj, omit, noop, extend, inherit, values, applyPairs, tail, mapObj, identity} from "../common/common";
import {isDefined, isFunction, isString, isArray} from "../common/predicates";
import {stringify} from "../common/strings";
import {prop, pattern, is, pipe, val} from "../common/hof";
import {StateDeclaration} from "./interface";

import {State} from "./stateObject";
import {StateMatcher} from "./stateMatcher";
import {Param} from "../params/param";
import {UrlMatcherFactory} from "../url/urlMatcherFactory";
import {UrlMatcher} from "../url/urlMatcher";
import {Resolvable} from "../resolve/resolvable";
import {services} from "../common/coreservices";
import {ResolvePolicy} from "../resolve/interface";
import {ParamTypes} from "../params/paramTypes";

const parseUrl = (url: string): any => {
  if (!isString(url)) return false;
  let root = url.charAt(0) === '^';
  return { val: root ? url.substring(1) : url, root };
};

export type BuilderFunction = (state: State, parent?: BuilderFunction) => any;

interface Builders {
  [key: string]: BuilderFunction[];

  name: BuilderFunction[];
  parent: BuilderFunction[];
  data: BuilderFunction[];
  url: BuilderFunction[];
  navigable: BuilderFunction[];
  params: BuilderFunction[];
  views: BuilderFunction[];
  path: BuilderFunction[];
  includes: BuilderFunction[];
  resolvables: BuilderFunction[];
}


function nameBuilder(state: State) {
  if (state.lazyLoad)
    state.name = state.self.name + ".**";
  return state.name;
}

function selfBuilder(state: State) {
  state.self.$$state = () => state;
  return state.self;
}

function dataBuilder(state: State) {
  if (state.parent && state.parent.data) {
    state.data = state.self.data = inherit(state.parent.data, state.data);
  }
  return state.data;
}

const getUrlBuilder = ($urlMatcherFactoryProvider: UrlMatcherFactory, root: () => State) =>
function urlBuilder(state: State) {
  let stateDec: StateDeclaration = <any> state;

  if (stateDec && stateDec.url && stateDec.lazyLoad) {
    stateDec.url += "{remainder:any}"; // match any path (.*)
  }

  const parsed = parseUrl(stateDec.url), parent = state.parent;
  const url = !parsed ? stateDec.url : $urlMatcherFactoryProvider.compile(parsed.val, {
    params: state.params || {},
    paramMap: function (paramConfig: any, isSearch: boolean) {
      if (stateDec.reloadOnSearch === false && isSearch) paramConfig = extend(paramConfig || {}, {dynamic: true});
      return paramConfig;
    }
  });

  if (!url) return null;
  if (!$urlMatcherFactoryProvider.isMatcher(url)) throw new Error(`Invalid url '${url}' in state '${state}'`);
  return (parsed && parsed.root) ? url : ((parent && parent.navigable) || root()).url.append(<UrlMatcher> url);
};

const getNavigableBuilder = (isRoot: (state: State) => boolean) =>
function navigableBuilder(state: State) {
  return !isRoot(state) && state.url ? state : (state.parent ? state.parent.navigable : null);
};

const getParamsBuilder = (paramTypes: ParamTypes) => 
function paramsBuilder(state: State): { [key: string]: Param } {
  const makeConfigParam = (config: any, id: string) => Param.fromConfig(id, null, config, paramTypes);
  let urlParams: Param[] = (state.url && state.url.parameters({inherit: false})) || [];
  let nonUrlParams: Param[] = values(mapObj(omit(state.params || {}, urlParams.map(prop('id'))), makeConfigParam));
  return urlParams.concat(nonUrlParams).map(p => [p.id, p]).reduce(applyPairs, {});
};

function pathBuilder(state: State) {
  return state.parent ? state.parent.path.concat(state) : /*root*/ [state];
}

function includesBuilder(state: State) {
  let includes = state.parent ? extend({}, state.parent.includes) : {};
  includes[state.name] = true;
  return includes;
}

/**
 * This is a [[StateBuilder.builder]] function for the `resolve:` block on a [[StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * validates the `resolve` property and converts it to a [[Resolvable]] array.
 *
 * resolve: input value can be:
 *
 * {
 *   // analyzed but not injected
 *   myFooResolve: function() { return "myFooData"; },
 *
 *   // function.toString() parsed, "DependencyName" dep as string (not min-safe)
 *   myBarResolve: function(DependencyName) { return DependencyName.fetchSomethingAsPromise() },
 *
 *   // Array split; "DependencyName" dep as string
 *   myBazResolve: [ "DependencyName", function(dep) { return dep.fetchSomethingAsPromise() },
 *
 *   // Array split; DependencyType dep as token (compared using ===)
 *   myQuxResolve: [ DependencyType, function(dep) { return dep.fetchSometingAsPromise() },
 *
 *   // val.$inject used as deps
 *   // where:
 *   //     corgeResolve.$inject = ["DependencyName"];
 *   //     function corgeResolve(dep) { dep.fetchSometingAsPromise() }
 *   // then "DependencyName" dep as string
 *   myCorgeResolve: corgeResolve,
 *
 *  // inject service by name
 *  // When a string is found, desugar creating a resolve that injects the named service
 *   myGraultResolve: "SomeService"
 * }
 *
 * or:
 *
 * [
 *   new Resolvable("myFooResolve", function() { return "myFooData" }),
 *   new Resolvable("myBarResolve", function(dep) { return dep.fetchSomethingAsPromise() }, [ "DependencyName" ]),
 *   { provide: "myBazResolve", useFactory: function(dep) { dep.fetchSomethingAsPromise() }, deps: [ "DependencyName" ] }
 * ]
 */
export function resolvablesBuilder(state: State): Resolvable[] {
  interface Tuple { token: any, val: any, deps: any[], policy: ResolvePolicy }
  
  /** convert resolve: {} and resolvePolicy: {} objects to an array of tuples */
  const objects2Tuples    = (resolveObj: Obj, resolvePolicies: { [key: string]: ResolvePolicy }) =>
      Object.keys(resolveObj || {}).map(token => ({token, val: resolveObj[token], deps: undefined, policy: resolvePolicies[token]}));

  /** fetch DI annotations from a function or ng1-style array */
  const annotate          = (fn: Function)  =>
      fn['$inject'] || services.$injector.annotate(fn, services.$injector.strictDi);

  /** true if the object has both `token` and `resolveFn`, and is probably a [[ResolveLiteral]] */
  const isResolveLiteral  = (obj: any) => !!(obj.token && obj.resolveFn);

  /** true if the object looks like a provide literal, or a ng2 Provider */
  const isLikeNg2Provider = (obj: any) => !!((obj.provide || obj.token) && (obj.useValue || obj.useFactory || obj.useExisting || obj.useClass));

  /** true if the object looks like a tuple from obj2Tuples */
  const isTupleFromObj    = (obj: any) => !!(obj && obj.val && (isString(obj.val) || isArray(obj.val)  || isFunction(obj.val)));

  /** extracts the token from a Provider or provide literal */
  const token             = (p: any) => p.provide || p.token;

  /** Given a literal resolve or provider object, returns a Resolvable */
  const literal2Resolvable = pattern([
    [prop('resolveFn'),   p => new Resolvable(token(p), p.resolveFn, p.deps, p.policy)],
    [prop('useFactory'),  p => new Resolvable(token(p), p.useFactory, (p.deps || p.dependencies), p.policy)],
    [prop('useClass'),    p => new Resolvable(token(p), () => new (<any>p.useClass)(), [], p.policy)],
    [prop('useValue'),    p => new Resolvable(token(p), () => p.useValue, [], p.policy, p.useValue)],
    [prop('useExisting'), p => new Resolvable(token(p), identity, [p.useExisting], p.policy)],
  ]);

  const tuple2Resolvable = pattern([
    [pipe(prop("val"), isString),   (tuple: Tuple) => new Resolvable(tuple.token, identity, [ tuple.val ], tuple.policy)],
    [pipe(prop("val"), isArray),    (tuple: Tuple) => new Resolvable(tuple.token, tail(<any[]> tuple.val), tuple.val.slice(0, -1), tuple.policy)],
    [pipe(prop("val"), isFunction), (tuple: Tuple) => new Resolvable(tuple.token, tuple.val, annotate(tuple.val), tuple.policy)],
  ]);

  const item2Resolvable = <(obj: any) => Resolvable> pattern([
    [is(Resolvable),                (r: Resolvable) => r],
    [isResolveLiteral,              literal2Resolvable],
    [isLikeNg2Provider,             literal2Resolvable],
    [isTupleFromObj,                tuple2Resolvable],
    [val(true),                     (obj: any) => { throw new Error("Invalid resolve value: " + stringify(obj)) }]
  ]);

  // If resolveBlock is already an array, use it as-is.
  // Otherwise, assume it's an object and convert to an Array of tuples
  let decl = state.resolve;
  let items: any[] = isArray(decl) ? decl : objects2Tuples(decl, state.resolvePolicy || {});
  return items.map(item2Resolvable);
}

/**
 * @internalapi A internal global service
 *
 * StateBuilder is a factory for the internal [[State]] objects.
 *
 * When you register a state with the [[StateRegistry]], you register a plain old javascript object which
 * conforms to the [[StateDeclaration]] interface.  This factory takes that object and builds the corresponding
 * [[State]] object, which has an API and is used internally.
 *
 * Custom properties or API may be added to the internal [[State]] object by registering a decorator function
 * using the [[builder]] method.
 */
export class StateBuilder {
  /** An object that contains all the BuilderFunctions registered, key'd by the name of the State property they build */
  private builders: Builders;

  constructor(private matcher: StateMatcher, $urlMatcherFactoryProvider: UrlMatcherFactory) {
    let self = this;

    const root = () => matcher.find("");
    const isRoot = (state: State) => state.name === "";

    function parentBuilder(state: State) {
      if (isRoot(state)) return null;
      return matcher.find(self.parentName(state)) || root();
    }

    this.builders = {
      name: [ nameBuilder ],
      self: [ selfBuilder ],
      parent: [ parentBuilder ],
      data: [ dataBuilder ],
      // Build a URLMatcher if necessary, either via a relative or absolute URL
      url: [ getUrlBuilder($urlMatcherFactoryProvider, root) ],
      // Keep track of the closest ancestor state that has a URL (i.e. is navigable)
      navigable: [ getNavigableBuilder(isRoot) ],
      params: [ getParamsBuilder($urlMatcherFactoryProvider.paramTypes) ],
      // Each framework-specific ui-router implementation should define its own `views` builder
      // e.g., src/ng1/statebuilders/views.ts
      views: [],
      // Keep a full path from the root down to this state as this is needed for state activation.
      path: [ pathBuilder ],
      // Speed up $state.includes() as it's used a lot
      includes: [ includesBuilder ],
      resolvables: [ resolvablesBuilder ]
    };
  }

  /**
   * Registers a [[BuilderFunction]] for a specific [[State]] property (e.g., `parent`, `url`, or `path`).
   * More than one BuilderFunction can be registered for a given property.
   *
   * The BuilderFunction(s) will be used to define the property on any subsequently built [[State]] objects.
   *
   * @param name The name of the State property being registered for.
   * @param fn The BuilderFunction which will be used to build the State property
   * @returns a function which deregisters the BuilderFunction
   */
  builder(name: string, fn: BuilderFunction): (BuilderFunction|BuilderFunction[]|Function) {
    let builders = this.builders;
    let array = builders[name] || [];
    // Backwards compat: if only one builder exists, return it, else return whole arary.
    if (isString(name) && !isDefined(fn)) return array.length > 1 ? array : array[0];
    if (!isString(name) || !isFunction(fn)) return;

    builders[name] = array;
    builders[name].push(fn);
    return () => builders[name].splice(builders[name].indexOf(fn, 1)) && null;
  }

  /**
   * Builds all of the properties on an essentially blank State object, returning a State object which has all its
   * properties and API built.
   *
   * @param state an uninitialized State object
   * @returns the built State object
   */
  build(state: State): State {
    let {matcher, builders} = this;
    let parent = this.parentName(state);
    if (parent && !matcher.find(parent)) return null;

    for (let key in builders) {
      if (!builders.hasOwnProperty(key)) continue;
      let chain = builders[key].reduce((parentFn: BuilderFunction, step: BuilderFunction) => (_state) => step(_state, parentFn), noop);
      state[key] = chain(state);
    }
    return state;
  }

  parentName(state: State) {
    let name = state.name || "";
    if (name.indexOf('.') !== -1) return name.substring(0, name.lastIndexOf('.'));
    if (!state.parent) return "";
    return isString(state.parent) ? state.parent : state.parent.name;
  }

  name(state: State) {
    let name = state.name;
    if (name.indexOf('.') !== -1 || !state.parent) return name;

    let parentName = isString(state.parent) ? state.parent : state.parent.name;
    return parentName ? parentName + "." + name : name;
  }
}
