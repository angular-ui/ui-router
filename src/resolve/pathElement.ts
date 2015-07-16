/// <reference path='../../typings/angularjs/angular.d.ts' />

import {isObject, isString, extend, forEach, noop, pick, map, filter, parse} from "../common/common";
import {trace}  from "../common/trace";
import {IPromise} from "angular";
import {IPublicState} from "../state/state";
import Path from "./path";
import Resolvable from "./resolvable";
import {runtime} from "../common/angular1"


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
export default class PathElement {
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
    var policyOrdinal = resolvePolicies[options && options.resolvePolicy || defaultResolvePolicy];

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

    var matchingResolves = filter(resolvables, matchesPolicy);
    if (options.trace) trace.traceResolvePathElement(this, matchingResolves, options);
    var resolvablePromises = map(matchingResolves, getResolvePromise);
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

    var promises: any = map(resolvables, function(resolvable) { return resolvable.get(pathContext, options); });
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
  invokeNow(fn: Function, locals: any, pathContext: Path, options: any = {}) {
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