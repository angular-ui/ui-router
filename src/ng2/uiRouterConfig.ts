/** @module ng2 */ /** */
import {UIRouter} from "../router";
/**
 * Provides states configuration to UI-Router during application bootstrap.
 * 
 * An instance of this class should be `provide()`d to the application `bootstrap()`.
 *
 * @example
 * ```js
 * import {UIROUTER_PROVIDERS, UiView} from "ui-router-ng2";
 * import {MyConfig} from "./app/myConfig";
 *
 * bootstrap(UiView, [
 *   ...UIROUTER_PROVIDERS,
 *   provide(UIRouterConfig, { useClass: MyConfig }
 * ]);
 * ```
 *
 * The application's initial states should be registered with the [[UIRouter.stateRegistry]].
 * Any global configuration (transition hooks, parameter types, etc) should be done here.
 *
 * @example
 * ```js
 *
 * // myconfig.ts
 * import {STATES} from "./states";
 * import {registerAuthHook} from "./hooks";
 * import {registerSlugType} from "./paramtypes";
 *
 * export class MyConfig {
 *   configure(uiRouter: UIRouter) {
 *     STATES.forEach(state => uiRouter.stateRegistry.register(state));
 *     registerAuthHook(uiRouter.transitionService);
 *     registerSlugType(uiRouter.urlMatcherFactory);
 *   }
 * }
 *
 * // states.ts
 * import {FooComponent} from "./foo.component";
 * import {BarComponent} from "./bar.component";
 * import BAZ_MODULE_STATES from "./baz/states";
 *
 * export let STATES = [
 *   { name: 'foo', url: '/url', component: FooComponent},
 *   { name: 'bar', url: '/bar', component: BarComponent}
 * ].concat(BAZ_MODULE_STATES);
 *
 * // hooks.ts
 * export function registerAuthHook(transitionService: TransitionService) {
 *   let requireAuthentication = ($state, AuthService) {
 *     if (!AuthService.isAuthenticated()) {
 *       return $state.target('login');
 *     }
 *   }
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