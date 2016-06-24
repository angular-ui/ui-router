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
 * - Create a [[UiRouterConfig]], and register your states in the [[UIRouterConfig.configure]] function.
 *
 * ```js
 * import {UiRouter} from "ui-router-ng2";
 * import {INITIAL_STATES} from "./app.states";
 * @ Injectable()
 * export class MyUiRouterConfig {
 *   configure(uiRouter: UiRouter) {
 *     INITIAL_STATES.forEach(function(state) {
 *       uiRouter.stateRegistry.register(state));
 *     });
 *   }
 * }
 * ```
 *
 * - When bootstrapping: include the [[UIROUTER_PROVIDERS]] and define a provider for your [[UiRouterConfig]]
 *
 * ```js
 * import {provide} from "@angular/core";
 * import {bootstrap} from 'angular2/platform/browser';
 * import {UiRouterConfig, UiView, UIROUTER_PROVIDERS} from "ui-router-ng2";
 * import {MyUiRouterConfig} from "./router.config";
 *
 * bootstrap(UiView, [
 *     ...UIROUTER_PROVIDERS,
 *     provide(UiRouterConfig, { useClass: MyUiRouterConfig })
 * ]);
 * ```
 *
 * @preferred @module ng2
 */ /** */
import {Injector} from "@angular/core";
import {UiRouter} from "../router";
import {PathNode} from "../path/node";
import {StateRegistry} from "../state/stateRegistry";
import {StateService} from "../state/stateService";
import {TransitionService} from "../transition/transitionService";
import {UrlMatcherFactory} from "../url/urlMatcherFactory";
import {UrlRouter} from "../url/urlRouter";
import {ViewService} from "../view/view";
import {UiView} from "./directives/uiView";
import {ng2ViewsBuilder, Ng2ViewConfig} from "./statebuilders/views";
import {Ng2ViewDeclaration} from "./interface";
import {UiRouterConfig} from "./uiRouterConfig";
import {Globals} from "../globals";
import {UiRouterLocation} from "./location";
import {services} from "../common/coreservices";
import {ProviderLike} from "../state/interface";

let uiRouterFactory = (routerConfig: UiRouterConfig, location: UiRouterLocation, injector: Injector) => {
  services.$injector.get = injector.get.bind(injector);
  let router = new UiRouter();

  location.init();

  router.viewService.viewConfigFactory("ng2", (path: PathNode[], config: Ng2ViewDeclaration) => new Ng2ViewConfig(path, config));
  router.stateRegistry.decorator('views', ng2ViewsBuilder);

  router.stateRegistry.stateQueue.autoFlush(router.stateService);

  setTimeout(() => {
    routerConfig.configure(router);

    if (!router.urlRouterProvider.interceptDeferred) {
      router.urlRouter.listen();
      router.urlRouter.sync();
    }
  });

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
 *     provide(UiRouterConfig, { useClass: MyUiRouterConfig })
 * ]);
 * ```
 */

export const UIROUTER_PROVIDERS: ProviderLike[] = [
  { provide: UiRouter, useFactory: uiRouterFactory, deps: [UiRouterConfig, UiRouterLocation, Injector] },

  { provide: UiRouterLocation, useClass: UiRouterLocation },

  { provide: StateService, useFactory: (r: UiRouter) => { return r.stateService; }, deps: [UiRouter]},

  { provide: TransitionService, useFactory: (r: UiRouter) => { return r.transitionService; }, deps: [UiRouter]},

  { provide: UrlMatcherFactory, useFactory: (r: UiRouter) => { return r.urlMatcherFactory; }, deps: [UiRouter]},

  { provide: UrlRouter, useFactory: (r: UiRouter) => { return r.urlRouter; }, deps: [UiRouter]},

  { provide: ViewService, useFactory: (r: UiRouter) => { return r.viewService; }, deps: [UiRouter]},

  { provide: StateRegistry, useFactory: (r: UiRouter) => { return r.stateRegistry; }, deps: [UiRouter]},

  { provide: Globals, useFactory: (r: UiRouter) => { return r.globals; }, deps: [UiRouter]},

  { provide: UiView.PARENT_INJECT, useFactory: (r: StateRegistry) => { return { fqn: null, context: r.root() } }, deps: [StateRegistry]}
];