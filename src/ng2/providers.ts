/**
 * # UI-Router for Angular 2
 *
 * - [ui-router-ng2 home page](https://ui-router.github.io/ng2)
 * - [tutorials](https://ui-router.github.io/tutorial/ng2/helloworld)
 * - [quick start repository](http://github.com/ui-router/quickstart-ng2)
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
 * - Create application states (as defined by [[Ng2StateDeclaration]]).
 *
 * ```js
 * export let state1: Ng2StateDeclaration = {
 *   name: 'state1',
 *   component: State1Component,
 *   url: '/one'
 * }
 *
 * export let state2: Ng2StateDeclaration = {
 *   name: 'state2',
 *   component: State2Component,
 *   url: '/two'
 * }
 * ```
 *
 * - Import a [[UIRouterModule.forChild]] module into your feature `NgModule`s.
 *
 * ```js
 * @ NgModule({
 *   imports: [
 *     SharedModule,
 *     UIRouterModule.forChild({ states: [state1, state2 ] })
 *   ],
 *   declarations: [
 *     State1Component,
 *     State2Component,
 *   ]
 * })
 * export class MyFeatureModule {}
 * ```
 *
 * - Import a [[UIRouterModule.forRoot]] module into your application root `NgModule`
 * - Either bootstrap a [[UIView]] component, or add a `<ui-view></ui-view>` viewport to your root component.
 *
 * ```js
 * @ NgModule({
 *   imports: [
 *     BrowserModule,
 *     UIRouterModule.forRoot({ states: [ homeState ] }),
 *     MyFeatureModule,
 *   ],
 *   declarations: [
 *     HomeComponent
 *   ]
 *   bootstrap: [ UIView ]
 * })
 * class RootAppModule {}
 *
 * browserPlatformDynamic.bootstrapModule(RootAppModule);
 * ```
 *
 * - Optionally specify a configuration class [[ChildModule.configClass]] for any module
 * to perform any router configuration during bootstrap or lazyload.
 * Pass the class to [[UIRouterModule.forRoot]] or [[UIRouterModule.forChild]].
 *
 * ```js
 * import {UIRouter} from "ui-router-ng2";
 *
 * @ Injectable()
 * export class MyUIRouterConfig {
 *   // Constructor is injectable
 *   constructor(uiRouter: UIRouter) {
 *     uiRouter.urlMatcherFactory.type('datetime', myDateTimeParamType);
 *   }
 * }
 * ```
 *
 * @preferred @module ng2
 */ /** */
import {Injector, Provider} from "@angular/core";
import {UIRouter} from "ui-router-core";
import {PathNode} from "ui-router-core";
import {StateRegistry} from "ui-router-core";
import {StateService} from "ui-router-core";
import {TransitionService} from "ui-router-core";
import {UrlMatcherFactory} from "ui-router-core";
import {UrlRouter} from "ui-router-core";
import {ViewService} from "ui-router-core";
import {UIView, ParentUIViewInject} from "./directives/uiView";
import {ng2ViewsBuilder, Ng2ViewConfig} from "./statebuilders/views";
import {Ng2ViewDeclaration} from "./interface";
import {applyRootModuleConfig, applyModuleConfig} from "./uiRouterConfig";
import {Globals} from "ui-router-core";
import {UIRouterLocation} from "./location";
import {services} from "ui-router-core";
import {Resolvable} from "ui-router-core";
import {RootModule, StatesModule, UIROUTER_ROOT_MODULE, UIROUTER_MODULE_TOKEN} from "./uiRouterNgModule";
import {UIRouterRx} from "./rx";
import {NATIVE_INJECTOR_TOKEN} from "ui-router-core";

/**
 * This is a factory function for a UIRouter instance
 *
 * Creates a UIRouter instance and configures it for Angular 2, then invokes router bootstrap.
 * This function is used as an Angular 2 `useFactory` Provider.
 */
let uiRouterFactory = (
    location: UIRouterLocation,
    injector: Injector) => {

  let rootModules: RootModule[] = injector.get(UIROUTER_ROOT_MODULE);
  let modules: StatesModule[] = injector.get(UIROUTER_MODULE_TOKEN);

  if (rootModules.length !== 1) {
    throw new Error("Exactly one UIRouterModule.forRoot() should be in the bootstrapped app module's imports: []");
  }

  // ----------------- Monkey Patches ----------------
  // Monkey patch the services.$injector to the ng2 Injector
  services.$injector.get = injector.get.bind(injector);

  // Monkey patch the services.$location with ng2 Location implementation
  location.init();


  // ----------------- Create router -----------------
  // Create a new ng2 UIRouter and configure it for ng2
  let router = new UIRouter();
  new UIRouterRx(router);
  let registry = router.stateRegistry;

  // ----------------- Configure for ng2 -------------
  // Apply ng2 ui-view handling code
  router.viewService.viewConfigFactory("ng2", (path: PathNode[], config: Ng2ViewDeclaration) => new Ng2ViewConfig(path, config));
  registry.decorator('views', ng2ViewsBuilder);

  // Apply statebuilder decorator for ng2 NgModule registration
  registry.stateQueue.flush(router.stateService);

  // Prep the tree of NgModule by placing the root NgModule's Injector on the root state.
  let ng2InjectorResolvable = Resolvable.fromData(NATIVE_INJECTOR_TOKEN, injector);
  registry.root().resolvables.push(ng2InjectorResolvable);


  // ----------------- Initialize router -------------
  // Allow states to be registered
  registry.stateQueue.autoFlush(router.stateService);

  setTimeout(() => {
    rootModules.forEach(moduleConfig => applyRootModuleConfig(router, injector, moduleConfig));
    modules.forEach(moduleConfig => applyModuleConfig(router, injector, moduleConfig));

    // Start monitoring the URL
    if (!router.urlRouterProvider.interceptDeferred) {
      router.urlRouter.listen();
      router.urlRouter.sync();
    }
  });

  return router;
};

export const _UIROUTER_INSTANCE_PROVIDERS: Provider[] =  [
  { provide: UIRouter, useFactory: uiRouterFactory, deps: [UIRouterLocation, Injector] },
  { provide: UIRouterLocation, useClass: UIRouterLocation },
  { provide: UIView.PARENT_INJECT, useFactory: (r: StateRegistry) => { return { fqn: null, context: r.root() } as ParentUIViewInject }, deps: [StateRegistry]},
];

export const _UIROUTER_SERVICE_PROVIDERS: Provider[] = [
  { provide: StateService,      useFactory: (r: UIRouter) => r.stateService     , deps: [UIRouter]},
  { provide: TransitionService, useFactory: (r: UIRouter) => r.transitionService, deps: [UIRouter]},
  { provide: UrlMatcherFactory, useFactory: (r: UIRouter) => r.urlMatcherFactory, deps: [UIRouter]},
  { provide: UrlRouter,         useFactory: (r: UIRouter) => r.urlRouter        , deps: [UIRouter]},
  { provide: ViewService,       useFactory: (r: UIRouter) => r.viewService      , deps: [UIRouter]},
  { provide: StateRegistry,     useFactory: (r: UIRouter) => r.stateRegistry    , deps: [UIRouter]},
  { provide: Globals,           useFactory: (r: UIRouter) => r.globals          , deps: [UIRouter]},
];

/**
 * The UI-Router providers, for use in your application bootstrap
 *
 * @deprecated use [[UIRouterModule.forRoot]]
 */
export const UIROUTER_PROVIDERS: Provider[] = _UIROUTER_INSTANCE_PROVIDERS.concat(_UIROUTER_SERVICE_PROVIDERS);

