/// <reference path='../bower_components/DefinitelyTyped/angularjs/angular.d.ts' />

import {isDefined, isObject, isString, extend, forEach, isArray, identity, noop} from "./common";
import {defaults, pick, map, merge, filter, omit, parse, pluck, find, pipe, prop, eq}  from "./common";
import {trace}  from "./trace";
import {IPromise, IQService} from "angular";
import {IPublicState} from "./state";
import {runtime} from "./angular1"

/**
 * The basic building block for the resolve system.
 *
 * Resolvables encapsulate a state's resolve's resolveFn, the resolveFn's declared dependencies, the wrapped (.promise),
 * and the unwrapped-when-complete (.data) result of the resolveFn.
 *
 * Resolvable.get() either retrieves the Resolvable's existing promise, or else invokes resolve() (which invokes the
 * resolveFn) and returns the resulting promise.
 *
 * Resolvable.get() and Resolvable.resolve() both execute within a context Path, which is passed as the first
 * parameter to those fns.
 */
export class Resolvable {
  constructor(name: string, resolveFn: Function, state: IPublicState) {
    this.name = name;
    this.resolveFn = resolveFn;
    this.state = state;
    this.deps = runtime.$injector.annotate(resolveFn);
  }

  name: String;
  resolveFn: Function;
  state: IPublicState;
  deps: string[];

  promise: IPromise<any> = undefined;
  data: any;

  // synchronous part:
  // - sets up the Resolvable's promise
  // - retrieves dependencies' promises
  // - returns promise for async part

  // asynchronous part:
  // - wait for dependencies promises to resolve
  // - invoke the resolveFn
  // - wait for resolveFn promise to resolve
  // - store unwrapped data
  // - resolve the Resolvable's promise
  resolveResolvable(pathContext, options) {
    options = options || {};
    if (options.trace) trace.traceResolveResolvable(this, options);
    // First, set up an overall deferred/promise for this Resolvable
    var deferred = runtime.$q.defer();
    this.promise = deferred.promise;

    // Load a map of all resolvables for this state from the context path
    // Omit the current Resolvable from the result, so we don't try to inject this into this
    var ancestorsByName = pathContext.getResolvables({  omitOwnLocals: [ this.name ] });

    // Limit the ancestors Resolvables map to only those that the current Resolvable fn's annotations depends on
    var depResolvables = pick(ancestorsByName, this.deps);

    // Get promises (or synchronously invoke resolveFn) for deps
    var depPromises: any = map(depResolvables, function(resolvable) {
      return resolvable.get(pathContext);
    });

    // Return a promise chain that waits for all the deps to resolve, then invokes the resolveFn passing in the
    // dependencies as locals, then unwraps the resulting promise's data.
    return runtime.$q.all(depPromises).then(locals => {
      try {
        var result = runtime.$injector.invoke(this.resolveFn, this.state, locals);
        deferred.resolve(result);
      } catch (error) {
        deferred.reject(error);
      }
      return this.promise;
    }).then(data => {
      this.data = data;
      return this.promise;
    });
  }

  get(pathContext, options): IPromise<any> {
    return this.promise || this.resolveResolvable(pathContext, options);
  }

  // TODO: nuke this in favor of resolveResolvable
  resolve(pathContext, options) { return this.resolveResolvable(pathContext, options); }

  toString() {
    return `Resolvable(name: ${this.name}, state: ${this.state.name}, requires: [${this.deps}])`;
  }
}


// Eager resolves are resolved before the transition starts.
// Lazy resolves are resolved before their state is entered.
// JIT resolves are resolved just-in-time, right before an injected function that depends on them is invoked.
var resolvePolicies = { eager: 3, lazy: 2, jit: 1 };
var defaultResolvePolicy = "jit"; // TODO: make this configurable

/**
 * An element in the path which represents a state and that state's Resolvables and their resolve statuses.
 * When the resolved data is ready, it is stored in each Resolvable object within the PathElement
 *
 * Should be passed a state object.  I think maybe state could even be the public state, so users can add resolves
 * on the fly.
 */
export class PathElement {
  constructor(state: IPublicState) {
    this.state = state;
    // Convert state's resolvable assoc-array into an assoc-array of empty Resolvable(s)
    this._resolvables = map(state.resolve || {}, function(resolveFn, resolveName) {
      return new Resolvable(resolveName, resolveFn, state);
    });
  }

  state: IPublicState;
  private _resolvables: Object;

  getResolvables(): Object {
    return this._resolvables;
  }

  addResolvables(resolvablesByName): Object {
    return extend(this._resolvables, resolvablesByName);
  }

  // returns a promise for all resolvables on this PathElement
  // options.policy: only return promises for those Resolvables which are at the specified policy strictness, or above.
  resolvePathElement(pathContext, options): IPromise<any> {
    options = options || {};
    var policyOrdinal = resolvePolicies[options && options.policy || defaultResolvePolicy];

    var policyConf = {
      $$state: isString(this.state.resolvePolicy) ? this.state.resolvePolicy : defaultResolvePolicy,
      $$resolves: isObject(this.state.resolvePolicy) ? this.state.resolvePolicy : defaultResolvePolicy
    };

    // Isolate only this element's resolvables
    var elements: PathElement[] = [this];
    var resolvables = <any> (new Path(elements).getResolvables());
    forEach(resolvables, function(resolvable) {
      var policyString = policyConf.$$resolves[resolvable.name] || policyConf.$$state;
      policyConf[resolvable.name] = resolvePolicies[policyString];
    });

    const matchesPolicy = (resolvable) => policyConf[resolvable.name] >= policyOrdinal;
    const getResolvePromise = (resolvable) => resolvable.get(pathContext, options);

    if (options.trace) trace.traceResolvePathElement(this, filter(resolvables, matchesPolicy), options);
    var resolvablePromises = map(filter(resolvables, matchesPolicy), getResolvePromise);
    return runtime.$q.all(resolvablePromises).then(noop);
  }

  // Injects a function at this PathElement level with available Resolvables
  // First it resolves all resolvables.  When they are done resolving, invokes the function.
  // Returns a promise for the return value of the function.
  // public function
  // fn is the function to inject (onEnter, onExit, controller)
  // locals are the regular-style locals to inject
  // pathContext is a Path which is used to retrieve dependent Resolvables for injecting
  invokeLater(fn, locals, pathContext, options): IPromise<any> {
    options = options || {};
    var deps = runtime.$injector.annotate(fn);
    var resolvables = pick(pathContext.pathFromRoot(this).getResolvables(), deps);
    if (options.trace) trace.tracePathElementInvoke(this, fn, deps, extend({ when: "Later"}, options));

    var promises: any = map(resolvables, function(resolvable) { return resolvable.get(pathContext); });
    return runtime.$q.all(promises).then(() => {
      try {
        return this.invokeNow(fn, locals, pathContext, options);
      } catch (error) {
        return runtime.$q.reject(error);
      }
    });
  }

  // private function? Maybe needs to be public-to-$transition to allow onEnter/onExit to be invoked synchronously
  // and in the correct order, but only after we've manually ensured all the deps are resolved.

  // Injects a function at this PathElement level with available Resolvables
  // Does not wait until all Resolvables have been resolved; you must call PathElement.resolve() (or manually resolve each dep) first
  invokeNow(fn, locals, pathContext, options) {
    options = options || {};
    var deps = runtime.$injector.annotate(fn);
    var resolvables = pick(pathContext.pathFromRoot(this).getResolvables(), deps);
    if (options.trace) trace.tracePathElementInvoke(this, fn, runtime.$injector.annotate(fn), extend({ when: "Now  "}, options));

    var moreLocals = map(resolvables, function(resolvable) { return resolvable.data; });
    var combinedLocals = extend({}, locals, moreLocals);
    return runtime.$injector.invoke(fn, this.state, combinedLocals);
  }

  toString(): string {
    var state = parse("state.name")(this) || "(root)";
    return `PathElement(${state})`;
  }
}


/**
 *  A Path Object holds an ordered list of PathElements.
 *
 *  This object is used to store resolve status for an entire path of states. It has concat and slice
 *  helper methods to return new Paths, based on the current Path.
 *
 *
 *  Path becomes the replacement data structure for $state.$current.locals.
 *  The Path is used in the three resolve() functions (Path.resolvePath, PathElement.resolvePathElement,
 *  and Resolvable.resolveResolvable) and provides context for injectable dependencies (Resolvables)
 *
 *  @param statesOrPathElements [array]: an array of either state(s) or PathElement(s)
 */

export class Path {
  constructor(statesOrPathElements: (IPublicState[] | PathElement[])) {
    if (!isArray(statesOrPathElements))
      throw new Error("states must be an array of state(s) or PathElement(s): ${statesOrPathElements}");

    var isPathElementArray = (statesOrPathElements.length && (statesOrPathElements[0] instanceof PathElement));
    var toPathElement = isPathElementArray ? identity : function (state) { return new PathElement(state); };
    this.elements = <PathElement[]> map(statesOrPathElements, toPathElement);
  }

  elements: PathElement[];

  // Returns a promise for an array of resolved Path Element promises
  resolvePath(options: any): IPromise<any> {
    options = options || {};
    if (options.trace) trace.traceResolvePath(this, options);
    const elementPromises = (element => element.resolvePathElement(this, options));
    return runtime.$q.all(<any> map(this.elements, elementPromises)).then(noop);
  }
  // TODO nuke this in favor of resolvePath()
  resolve(options: any) { return this.resolvePath(options); }

  /**
   *  Gets the available Resolvables for the last element of this path.
   *
   * @param options
   *
   * options.omitOwnLocals: array of property names
   *   Omits those Resolvables which are found on the last element of the path.
   *
   *   This will hide a deepest-level resolvable (by name), potentially exposing a parent resolvable of
   *   the same name further up the state tree.
   *
   *   This is used by Resolvable.resolve() in order to provide the Resolvable access to all the other
   *   Resolvables at its own PathElement level, yet disallow that Resolvable access to its own injectable Resolvable.
   *
   *   This is also used to allow a state to override a parent state's resolve while also injecting
   *   that parent state's resolve:
   *
   *   state({ name: 'G', resolve: { _G: function() { return "G"; } } });
   *   state({ name: 'G.G2', resolve: { _G: function(_G) { return _G + "G2"; } } });
   *   where injecting _G into a controller will yield "GG2"
   */
  getResolvables(options?: any): { [key:string]:Resolvable; } {
    options = defaults(options, { omitOwnLocals: [] });
    var last = this.last();
    return this.elements.reduce(function(memo, elem) {
      var omitProps = (elem === last) ? options.omitOwnLocals : [];
      var elemResolvables = omit.apply(null, [elem.getResolvables()].concat(omitProps));
      return extend(memo, elemResolvables);
    }, {});
  }

  clone(): Path {
    throw new Error("Clone not yet implemented");
  }

  // returns a subpath of this path from the root path element up to and including the toPathElement parameter
  pathFromRoot(toPathElement): Path {
    var elementIdx = this.elements.indexOf(toPathElement);
    if (elementIdx == -1) throw new Error("This Path does not contain the toPathElement");
    return this.slice(0, elementIdx + 1);
  }

  concat(path): Path {
    return new Path(this.elements.concat(path.elements));
  }

  slice(start: number, end?: number): Path {
    return new Path(this.elements.slice(start, end));
  }

  reverse(): Path {
    this.elements.reverse(); // TODO: return new Path()
    return this;
  }

  states(): IPublicState[] {
    return pluck(this.elements, "state");
  }

  elementForState(state: IPublicState) {
    return find(this.elements, pipe(prop('state'), eq(state)));
  }

  last(): PathElement {
    return this.elements.length ? this.elements[this.elements.length - 1] : null;
  }

  toString() {
    var elements = this.elements.map(e => e.state.name).join(", ");
    return `Path([${elements}])`;
  }
}
