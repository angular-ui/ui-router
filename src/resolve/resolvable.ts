/** @module resolve */ /** for typedoc */
import {pick, map, extend} from "../common/common";

import {services} from "../common/coreservices";
import {trace} from "../common/trace";
import {Resolvables, IOptions1} from "./interface";

import {ResolveContext} from "./resolveContext";
import {stringify} from "../common/strings";

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
  token: any;
  resolveFn: Function;
  deps: string[];

  promise: Promise<any> = undefined;
  resolved: boolean = false;
  data: any;

  /**
   * This constructor creates a Resolvable copy
   */
  constructor(resolvable: Resolvable)

  /** 
   * This constructor creates a new `Resolvable`
   *
   * @param token The new resolvable's injection token, such as `"userList"` (a string) or `UserService` (a class).
   *              When this token is used during injection, the resolved value will be injected.
   * @param resolveFn The function that returns the resolved value, or a promise for the resolved value
   * @param deps An array of dependencies, which will be injected into the `resolveFn`
   * @param data Pre-resolved data. If the resolve value is already known, it may be provided here.
   */
  constructor(token: any, resolveFn: Function, deps?: any[], data?: any)
  constructor(token, resolveFn?: Function, deps?: any[], data?: any) {
    if (token instanceof Resolvable) {
      extend(this, token);
    } else {
      this.token = token;
      this.resolveFn = resolveFn;
      this.deps = deps;
      this.data = data;
      this.resolved = data !== undefined;
    }
  }

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
    let {deps, resolveFn} = this;
    
    trace.traceResolveResolvable(this, options);
    // First, set up an overall deferred/promise for this Resolvable
    let deferred = services.$q.defer();
    this.promise = deferred.promise;
    // Load a map of all resolvables for this state from the context path
    // Omit the current Resolvable from the result, so we don't try to inject this into this
    let ancestorsByName: Resolvables = resolveContext.getResolvables(null, {  omitOwnLocals: [ this.token ] });

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
    return `Resolvable(token: ${stringify(this.token)}, requires: [${this.deps.map(stringify)}])`;
  }

  clone(): Resolvable {
    return new Resolvable(this);
  }
}
