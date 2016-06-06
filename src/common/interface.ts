/**
 * An interface for getting values from dependency injection.
 */
export interface UIRInjector {
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
}