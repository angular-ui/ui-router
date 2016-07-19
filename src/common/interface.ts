/** @module common */ /** */

// Need to import or export at least one concrete something
import {noop} from "./common";

/**
 * An interface for getting values from dependency injection.
 */
export interface UIInjector {
  /**
   * Gets a value from the injector
   *
   * @example
   * ```js
   *
   * // ng1
   * injector.get('$state').go('home');
   * ```
   *
   * @example
   * ```js
   *
   * // ng2
   * import {StateService} from "ui-router-ng2";
   * injector.get(StateService).go('home');
   * ```
   *
   * Note:
   * The code that implements this interface may be Angular 1 `$injector`, Angular 2 `Injector`,
   * a [[ResolveContext]], or a `ResolveContext` that delegates to the ng1/ng2 injector if keys are missing.
   *
   * @param key the key for the value to get.  May be a string or arbitrary object.
   * @return the Dependency Injection value that matches the key
   */
  get(key: any): any;

  /**
   * Asynchronously gets a value from the injector
   *
   * Returns a promise for a value from the injector.
   * Returns resolve values and/or values from the native injector (ng1/ng2).
   *
   * @example
   * ```js
   *
   * return injector.getAsync('myResolve').then(value => {
   *   if (value === 'declined') return false;
   * });
   * ```
   *
   * @param key the key for the value to get.  May be a string or arbitrary object.
   * @return a Promise for the Dependency Injection value that matches the key
   */
  getAsync(key: any): any;
}
