/** @module resolve */ /** for typedoc */
import {extend, pick, map, filter} from "../common/common";
import {not} from "../common/hof";
import {isInjectable} from "../common/predicates";

import {services} from "../common/coreservices";
import {trace} from "../common/trace";
import {Resolvables, IOptions1} from "./interface";

import {ResolveContext} from "./resolveContext";

/**
 * The basic building block for the resolve system.
 *
 * Resolvables encapsulate a state's resolve's resolveFn, the resolveFn's declared dependencies, the wrapped (.promise),
 * and the unwrapped-when-complete (.data) result of the resolveFn.
 *
 * Resolvable.get() either retrieves the Resolvable's existing promise, or else invokes resolve() (which invokes the
 * resolveFn) and returns the resulting promise.
 *
 * Resolvable.get() and Resolvable.resolve() both execute within a context path, which is passed as the first
 * parameter to those fns.
 */
export class Resolvable {
  constructor(name: string, resolveFn: Function, preResolvedData?: any) {
    extend(this, {
     name, 
     resolveFn, 
     deps: services.$injector.annotate(resolveFn, services.$injector.strictDi), 
     data: preResolvedData 
   });
  }

  name: string;
  resolveFn: Function;
  deps: string[];

  promise: Promise<any> = undefined;
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
  resolveResolvable(resolveContext: ResolveContext, options: IOptions1 = {}) {
    let {name, deps, resolveFn} = this;
    
    trace.traceResolveResolvable(this, options);
    // First, set up an overall deferred/promise for this Resolvable
    let deferred = services.$q.defer();
    this.promise = deferred.promise;
    // Load a map of all resolvables for this state from the context path
    // Omit the current Resolvable from the result, so we don't try to inject this into this
    let ancestorsByName: Resolvables = resolveContext.getResolvables(null, {  omitOwnLocals: [ name ] });

    // Limit the ancestors Resolvables map to only those that the current Resolvable fn's annotations depends on
    let depResolvables: Resolvables = <any> pick(ancestorsByName, deps);

    // Get promises (or synchronously invoke resolveFn) for deps
    let depPromises: any = map(depResolvables, (resolvable: Resolvable) => resolvable.get(resolveContext, options));

    // Return a promise chain that waits for all the deps to resolve, then invokes the resolveFn passing in the
    // dependencies as locals, then unwraps the resulting promise's data.
    return services.$q.all(depPromises).then(locals => {
      try {
        let result = services.$injector.invoke(resolveFn, null, locals);
        deferred.resolve(result);
      } catch (error) {
        deferred.reject(error);
      }
      return this.promise;
    }).then(data => {
      this.data = data;
      trace.traceResolvableResolved(this, options);
      return this.promise;
    });
  }

  get(resolveContext: ResolveContext, options?: IOptions1): Promise<any> {
    return this.promise || this.resolveResolvable(resolveContext, options);
  }

  toString() {
    return `Resolvable(name: ${this.name}, requires: [${this.deps}])`;
  }

  /**
   * Validates the result map as a "resolve:" style object, then transforms the resolves into Resolvables
   */
  static makeResolvables(resolves: { [key: string]: Function; }): Resolvables {
    // If a hook result is an object, it should be a map of strings to functions.
    let invalid = filter(resolves, not(isInjectable)), keys = Object.keys(invalid);
    if (keys.length)
      throw new Error(`Invalid resolve key/value: ${keys[0]}/${invalid[keys[0]]}`);
    return map(resolves, (fn, name: string) => new Resolvable(name, fn));
  }
}
