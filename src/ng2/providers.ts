/**
 * # UI-Router for Angular 2
 *
 * For the quick start repository, please see http://github.com/ui-router/quickstart-ng2
 * 
 * Getting started:
 * 
 * - Use npm. Add a dependency on latest `ui-router-ng2`
 * - Import UI-Router classes directly from `"ui-router-ng2"`
 *
 * ```js
 * import {StateRegistry} from "ui-router-ng2";
 * ```
 *
 * - When defining a component, add the [[UIROUTER_DIRECTIVES]] to `directives:` array.
 * - Either bootstrap a [[UiView]] component, or add a `<ui-view></ui-view>` viewport to your root component.
 * - Create application states (as defined by [[Ng2StateDeclaration]]) which will fill in the viewports.
 * - Create a [[UIRouterConfig]], and register your states in the [[UIRouterConfig.configure]] function.
 *
 * ```js
 * import {UIRouter} from "ui-router-ng2";
 * import {INITIAL_STATES} from "./app.states";
 * @ Injectable()
 * export class MyUIRouterConfig {
 *   configure(uiRouter: UIRouter) {
 *     INITIAL_STATES.forEach(function(state) {
 *       uiRouter.stateRegistry.register(state));
 *     });
 *   }
 * }
 * ```
 *
 * - When bootstrapping: include the [[UIROUTER_PROVIDERS]] and define a provider for your [[UIRouterConfig]]
 *
 * ```js
 * import {provide} from "angular2/core";
 * import {bootstrap} from 'angular2/platform/browser';
 * import {UIRouterConfig, UiView, UIROUTER_PROVIDERS} from "ui-router-ng2";
 * import {MyUIRouterConfig} from "./router.config";
 *
 * bootstrap(UiView, [
 *     ...UIROUTER_PROVIDERS,
 *     provide(UIRouterConfig, { useClass: MyUIRouterConfig })
 * ]);
 * ```
 *
 * @preferred @module ng2
 */ /** */
import {Provider, provide} from "angular2/core";
import {UIRouter} from "../router";
import {Node} from "../path/node";
import {StateRegistry} from "../state/stateRegistry";
import {StateService} from "../state/stateService";
import {TransitionService} from "../transition/transitionService";
import {UrlMatcherFactory} from "../url/urlMatcherFactory";
import {UrlRouter} from "../url/urlRouter";
import {ViewService} from "../view/view";
import {UiView} from "./uiView";
import {ng2ViewsBuilder, Ng2ViewConfig} from "./viewsBuilder";
import {Ng2ViewDeclaration} from "./interface";
import {UIRouterConfig} from "./uiRouterConfig";
import {UIRouterGlobals} from "../globals";

let uiRouterFactory = (routerConfig: UIRouterConfig) => {
  let router = new UIRouter();

  router.viewService.viewConfigFactory("ng2", (node: Node, config: Ng2ViewDeclaration) => new Ng2ViewConfig(node, config));
  router.stateRegistry.decorator('views', ng2ViewsBuilder);

  router.stateRegistry.stateQueue.autoFlush(router.stateService);

  routerConfig.configure(router);

  if (!router.urlRouterProvider.interceptDeferred) {
    router.urlRouter.listen();
    router.urlRouter.sync();
  }

  return router;
};

/**
 * The UI-Router providers, for use in your application bootstrap
 *
 * @example
 * ```js
 *
 * bootstrap(UiView, [
 *     ...UIROUTER_PROVIDERS,
 *     ...HTTP_PROVIDERS,
 *     provide(UIRouterConfig, { useClass: MyUIRouterConfig })
 * ]);
 * ```
 */
export const UIROUTER_PROVIDERS: Provider[] = [

  provide(UIRouter, { useFactory: uiRouterFactory, deps: [UIRouterConfig] }),

  provide(StateService, { useFactory: (r: UIRouter) => { return r.stateService; }, deps: [UIRouter]}),

  provide(TransitionService, { useFactory: (r: UIRouter) => { return r.transitionService; }, deps: [UIRouter]}),

  provide(UrlMatcherFactory, { useFactory: (r: UIRouter) => { return r.urlMatcherFactory; }, deps: [UIRouter]}),

  provide(UrlRouter, { useFactory: (r: UIRouter) => { return r.urlRouter; }, deps: [UIRouter]}),

  provide(ViewService, { useFactory: (r: UIRouter) => { return r.viewService; }, deps: [UIRouter]}),

  provide(StateRegistry, { useFactory: (r: UIRouter) => { return r.stateRegistry; }, deps: [UIRouter]}),

  provide(UIRouterGlobals, { useFactory: (r: UIRouter) => { return r.globals; }, deps: [UIRouter]}),

  provide(UiView.PARENT_INJECT, { useFactory: (r: StateRegistry) => { return { fqn: null, context: r.root() } }, deps: [StateRegistry]} )

];

