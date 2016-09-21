/** @module common */ /** */

// Need to import or export at least one concrete something
import {noop} from "./common";

/**
 * An interface for getting values from dependency injection.
 *
 * This injector primarily returns resolve values (using a [[ResolveContext]]) that match the given token.
 * If no resolve is found for a token, then it will delegate to the native injector.
 * The native injector may be Angular 1 `$injector`, Angular 2 `Injector`, or a naive polyfill.
 *
 * In Angular 2, the native injector might be the root Injector,
 * or it might be a lazy loaded `NgModule` injector scoped to a lazy load state tree.
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
   * @param token the key for the value to get.  May be a string or arbitrary object.
   * @return the Dependency Injection value that matches the token
   */
  get(token: any): any;

  /**
   * Asynchronously gets a value from the injector
   *
   * If the [[ResolveContext]] has a [[Resolvable]] matching the token, it will be
   * asynchronously resolved.
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
   * @param token the key for the value to get.  May be a string or arbitrary object.
   * @return a Promise for the Dependency Injection value that matches the token
   */
  getAsync(token: any): Promise<any>;

  /**
   * Gets a value from the native injector
   *
   * Returns a value from the native injector, bypassing anything in the [[ResolveContext]].
   *
   * Example:
   * ```js
   * let someThing = injector.getNative(SomeToken);
   * ```
   *
   * @param token the key for the value to get.  May be a string or arbitrary object.
   * @return the Dependency Injection value that matches the token
   */
  getNative(token: any): any;
}
