/** @module ng2 */ /** */
import {UIRouter} from "../router";
/**
 * Configures UI-Router during application bootstrap.
 * 
 * UI-Router ng2 users should implement this class, and pass it to [[provideUIRouter]] in the root app `NgModule`.
 *
 * @example
 * ```js
 * import {MyUIRouterConfig} from "./app/router.config";
 * import {UIView} from "ui-router-ng2";
 *
 * @ UIRouterModule({
 *   providers: [provideUIRouter({ configClass: MyUIRouterConfig)]
 *   states: [state1, state2],
 *   bootstrap: [UIView]
 * }) class RootAppModule {}
 * ```
 *
 * Any global configuration (transition hooks, parameter types, etc) should be done here.
 *
 * @example
 * ```js
 *
 * // router.config.ts
 * import {registerAuthHook} from "./hooks";
 * import {registerSlugType} from "./paramtypes";
 *
 * export class MyUIRouterConfig {
 *   configure(uiRouter: UIRouter) {
 *     registerAuthHook(uiRouter.transitionService);
 *     registerSlugType(uiRouter.urlMatcherFactory);
 *   }
 * }
 *
 * // hooks.ts
 * export function registerAuthHook(transitionService: TransitionService) {
 *   const requireAuthentication = (transition: Transition) => {
 *     let injector = transition.injector();
 *     if (!injector.get(AuthService).isAuthenticated()) {
 *       return injector.get(StateService).target('login');
 *     }
 *   }
 *
 *   transitionService.onBefore({ to: (state) => state.requiresAuth }, requireAuthentication);
 * }
 *
 *
 * // paramtypes.ts
 * export function registerSlugType(urlMatcherFactory: UrlMatcherFactory) {
 *   let builtInStringType = urlMatcherFactory.type('string');
 *   let slugType = Object.assign({}, builtInStringType, { encode: (str) => str, decode: (str) => str });
 *   urlMatcherFactory.type('slug', slugType);
 * }
 * ```
 *
 * Your configuration class can be injected, if necessary.
 * Decorate with `@Injectable` and add dependencies to the class constructor.
 *
 * ```js
 * @ Injectable()
 * export class MyConfig {
 *   myService: MyService;
 *
 *   constructor(myService: MyService) {
 *     this.myService = myService;
 *   }
 *
 *   configure(router: UIRouter) {
 *     // ... use this.myService
 *   }
 * }
 * ```
 *
 *
 */
export class UIRouterConfig {
  /**
   * Configures UI-Router before bootstrap
   *
   * An app should perform UI-Router configuration here, such as registering the initial set of states,
   * parameter types, defining global hooks, etc.
   *
   * @param uiRouter the uiRouter instance being configured
   */
  public configure(uiRouter: UIRouter) {

  }
}