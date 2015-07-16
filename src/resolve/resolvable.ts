/// <reference path='../../typings/angularjs/angular.d.ts' />

import {pick, map}  from "../common/common";
import {trace}  from "../common/trace";
import {IPromise} from "angular";
import {IPublicState} from "../state/state";
import {runtime} from "../common/angular1"

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
class Resolvable {
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
      return resolvable.get(pathContext, options);
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
      if (options.trace) trace.traceResolvableResolved(this, options);
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

export default Resolvable;