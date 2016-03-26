/** @module state */ /** for typedoc */
import {map, noop, extend, inherit, pick, omit, values, applyPairs, forEach} from "../common/common";
import {isDefined, isFunction, isString} from "../common/predicates";
import {prop} from "../common/hof";
import {StateDeclaration} from "./interface";

import {State, StateMatcher} from "./module";
import {Param} from "../params/module";
import {UrlMatcherFactory} from "../url/urlMatcherFactory";
import {UrlMatcher} from "../url/urlMatcher";

const parseUrl = (url: string): any => {
  if (!isString(url)) return false;
  let root = url.charAt(0) === '^';
  return { val: root ? url.substring(1) : url, root };
};

export type BuilderFunction = (state: State, parent?) => any;

interface Builders {
  [key: string]: BuilderFunction[];

  parent: BuilderFunction[];
  data: BuilderFunction[];
  url: BuilderFunction[];
  navigable: BuilderFunction[];
  params: BuilderFunction[];
  views: BuilderFunction[];
  path: BuilderFunction[];
  includes: BuilderFunction[];
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

    const isRoot = (state) => state.name === "";
    const root = () => matcher.find("");

    this.builders = {
      self: [function (state: State) {
        state.self.$$state = () => state;
        return state.self;
      }],

      parent: [function (state: State) {
        if (isRoot(state)) return null;
        return matcher.find(self.parentName(state)) || root();
      }],

      data: [function (state: State) {
        if (state.parent && state.parent.data) {
          state.data = state.self.data = inherit(state.parent.data, state.data);
        }
        return state.data;
      }],

      // Build a URLMatcher if necessary, either via a relative or absolute URL
      url: [function (state: State) {
        let stateDec: StateDeclaration = <any> state;
        const parsed = parseUrl(stateDec.url), parent = state.parent;
        const url = !parsed ? stateDec.url : $urlMatcherFactoryProvider.compile(parsed.val, {
          params: state.params || {},
          paramMap: function (paramConfig, isSearch) {
            if (stateDec.reloadOnSearch === false && isSearch) paramConfig = extend(paramConfig || {}, {dynamic: true});
            return paramConfig;
          }
        });

        if (!url) return null;
        if (!$urlMatcherFactoryProvider.isMatcher(url)) throw new Error(`Invalid url '${url}' in state '${state}'`);
        return (parsed && parsed.root) ? url : ((parent && parent.navigable) || root()).url.append(<UrlMatcher> url);
      }],

      // Keep track of the closest ancestor state that has a URL (i.e. is navigable)
      navigable: [function (state: State) {
        return !isRoot(state) && state.url ? state : (state.parent ? state.parent.navigable : null);
      }],

      params: [function (state: State): { [key: string]: Param } {
        const makeConfigParam = (config: any, id: string) => Param.fromConfig(id, null, config);
        let urlParams: Param[] = (state.url && state.url.parameters({inherit: false})) || [];
        let nonUrlParams: Param[] = values(map(omit(state.params || {}, urlParams.map(prop('id'))), makeConfigParam));
        return urlParams.concat(nonUrlParams).map(p => [p.id, p]).reduce(applyPairs, {});
      }],

      // Each framework-specific ui-router implementation should define its own `views` builder
      // e.g., src/ng1/viewsBuilder.ts
      views: [],

      // Keep a full path from the root down to this state as this is needed for state activation.
      path: [function (state: State) {
        return state.parent ? state.parent.path.concat(state) : /*root*/ [state];
      }],

      // Speed up $state.includes() as it's used a lot
      includes: [function (state: State) {
        let includes = state.parent ? extend({}, state.parent.includes) : {};
        includes[state.name] = true;
        return includes;
      }]
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
  builder(name: string, fn: BuilderFunction) {
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
      let chain = builders[key].reduce((parentFn, step: BuilderFunction) => (_state) => step(_state, parentFn), noop);
      state[key] = chain(state);
    }
    return state;
  }

  parentName(state) {
    let name = state.name || "";
    if (name.indexOf('.') !== -1) return name.substring(0, name.lastIndexOf('.'));
    if (!state.parent) return "";
    return isString(state.parent) ? state.parent : state.parent.name;
  }

  name(state) {
    let name = state.name;
    if (name.indexOf('.') !== -1 || !state.parent) return name;

    let parentName = isString(state.parent) ? state.parent : state.parent.name;
    return parentName ? parentName + "." + name : name;
  }
}
