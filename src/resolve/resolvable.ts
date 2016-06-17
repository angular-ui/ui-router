/** @module resolve */ /** for typedoc */
import {pick, map, extend} from "../common/common";

import {services} from "../common/coreservices";
import {trace} from "../common/trace";
import {Resolvables, IOptions1} from "./interface";

import {ResolveContext} from "./resolveContext";
import {stringify} from "../common/strings";
import {isFunction} from "../common/predicates";

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
      if (token == null || token == undefined) throw new Error("new Resolvable(): token argument is required");
      if (!isFunction(resolveFn)) throw new Error("new Resolvable(): resolveFn argument must be a function");

      this.token = token;
      this.resolveFn = resolveFn;
      this.deps = deps || [];
      this.data = data;
      this.resolved = data !== undefined;
      this.promise = this.resolved ? services.$q.when(this.data) : undefined;
    }
  }

  /**
   * Asynchronously resolve this Resolvable's data
   *
   * Given a ResolveContext that this Resolvable is found in:
   * Wait for this Resolvable's dependencies, then invoke this Resolvable's function
   * and update the Resolvable's state
   */
  resolve(resolveContext: ResolveContext, options: IOptions1 = {}) {
    let $q = services.$q;
    return this.promise = $q.when()
        // Get all dependencies from ResolveContext and wait for them to be resolved
        .then(() =>
            $q.all(resolveContext.getDependencies(this).map(r =>
                r.get(resolveContext, options))))
        // Invoke the resolve function passing the resolved dependencies
        .then(resolvedDeps =>
            this.resolveFn.apply(null, resolvedDeps))
        // Wait for returned promise to resolve then update the Resolvable state
        .then(resolvedValue => {
          this.data = resolvedValue;
          this.resolved = true;
          trace.traceResolvableResolved(this, options);
          return this.data;
        });
  }

  /**
   * Gets a promise for this Resolvable's data.
   *
   * Fetches the data and returns a promise.
   * Returns the existing promise if it has already been fetched once.
   */
  get(resolveContext: ResolveContext, options?: IOptions1): Promise<any> {
    return this.promise || this.resolve(resolveContext, options);
  }

  toString() {
    return `Resolvable(token: ${stringify(this.token)}, requires: [${this.deps.map(stringify)}])`;
  }

  clone(): Resolvable {
    return new Resolvable(this);
  }
}
