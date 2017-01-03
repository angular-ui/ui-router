/**
 * # UI-Router for Angular 1
 *
 * - Provides an implementation for the [[CoreServices]] API, based on angular 1 services.
 * - Also registers some services with the angular 1 injector.
 * - Creates and bootstraps a new [[UIRouter]] object.  Ties it to the the angular 1 lifecycle.
 *
 * @module ng1
 * @preferred
 */
/** for typedoc */
import { ng as angular } from "./angular";
import { TypedMap } from "ui-router-core"; // has or is using
import {
  IRootScopeService, IQService, ILocationService, ILocationProvider, IHttpService, ITemplateCacheService
} from "angular";
import {
  services, applyPairs, isString, trace, extend, UIRouter, StateService, UrlRouter, UrlMatcherFactory, ResolveContext
} from "ui-router-core";
import { ng1ViewsBuilder, getNg1ViewConfigFactory } from "./statebuilders/views";
import { TemplateFactory } from "./templateFactory";
import { StateProvider } from "./stateProvider";
import { getStateHookBuilder } from "./statebuilders/onEnterExitRetain";
import { Ng1LocationServices } from "./locationServices";
import { UrlRouterProvider } from "./urlRouterProvider";
import IInjectorService = angular.auto.IInjectorService;

angular.module("ui.router.angular1", []);
let mod_init  = angular.module('ui.router.init',   []);
let mod_util  = angular.module('ui.router.util',   ['ng', 'ui.router.init']);
let mod_rtr   = angular.module('ui.router.router', ['ui.router.util']);
let mod_state = angular.module('ui.router.state',  ['ui.router.router', 'ui.router.util', 'ui.router.angular1']);
let mod_main  = angular.module('ui.router',        ['ui.router.init', 'ui.router.state', 'ui.router.angular1']);
let mod_cmpt  = angular.module('ui.router.compat', ['ui.router']);

declare module 'ui-router-core/lib/router' {
  interface UIRouter {
    /** @hidden */
    stateProvider: StateProvider;
    /** @hidden */
    urlRouterProvider: UrlRouterProvider;
  }
}

let router: UIRouter = null;

$uiRouter.$inject = ['$locationProvider'];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
function $uiRouter($locationProvider: ILocationProvider) {

  // Create a new instance of the Router when the $uiRouterProvider is initialized
  router = this.router = new UIRouter();
  router.stateProvider = new StateProvider(router.stateRegistry, router.stateService);

  // Apply ng1 specific StateBuilder code for `views`, `resolve`, and `onExit/Retain/Enter` properties
  router.stateRegistry.decorator("views",    ng1ViewsBuilder);
  router.stateRegistry.decorator("onExit",   getStateHookBuilder("onExit"));
  router.stateRegistry.decorator("onRetain", getStateHookBuilder("onRetain"));
  router.stateRegistry.decorator("onEnter",  getStateHookBuilder("onEnter"));

  router.viewService._pluginapi._viewConfigFactory('ng1', getNg1ViewConfigFactory());

  let ng1LocationService = router.locationService = router.locationConfig = new Ng1LocationServices($locationProvider);

  Ng1LocationServices.monkeyPatchPathParameterType(router);

  // backwards compat: also expose router instance as $uiRouterProvider.router
  router['router'] = router;
  router['$get'] = $get;
  $get.$inject = ['$location', '$browser', '$sniffer', '$rootScope', '$http', '$templateCache'];
  function $get($location: ILocationService, $browser: any, $sniffer: any, $rootScope: ng.IScope, $http: IHttpService, $templateCache: ITemplateCacheService) {
    ng1LocationService._runtimeServices($rootScope, $location, $sniffer, $browser);
    delete router['router'];
    delete router['$get'];
    return router;
  }
  return router;
}

const getProviderFor = (serviceName) => [ '$uiRouterProvider', ($urp) => {
  let service = $urp.router[serviceName];
  service["$get"] = () => service;
  return service;
}];

// This effectively calls $get() on `$uiRouterProvider` to trigger init (when ng enters runtime)
runBlock.$inject = ['$injector', '$q', '$uiRouter'];
function runBlock($injector: IInjectorService, $q: IQService, $uiRouter: UIRouter) {
  services.$injector = $injector;
  services.$q = <any> $q;
}

// $urlRouter service and $urlRouterProvider
const getUrlRouterProvider = (router: UIRouter) =>
  router.urlRouterProvider = new UrlRouterProvider(router);

// $state service and $stateProvider
// $urlRouter service and $urlRouterProvider
const getStateProvider = () =>
    extend(router.stateProvider, { $get: () => router.stateService });

watchDigests.$inject = ['$rootScope'];
export function watchDigests($rootScope: IRootScopeService) {
  $rootScope.$watch(function() { trace.approximateDigests++; });
}

mod_init .provider("$uiRouter",          <any> $uiRouter);
mod_rtr  .provider('$urlRouter',         ['$uiRouterProvider', getUrlRouterProvider]);
mod_util .provider('$urlMatcherFactory', ['$uiRouterProvider', () => router.urlMatcherFactory]);
mod_util .provider('$templateFactory',   () => new TemplateFactory());
mod_state.provider('$stateRegistry',     getProviderFor('stateRegistry'));
mod_state.provider('$uiRouterGlobals',   getProviderFor('globals'));
mod_state.provider('$transitions',       getProviderFor('transitionService'));
mod_state.provider('$state',             ['$uiRouterProvider', getStateProvider]);

mod_state.factory ('$stateParams',       ['$uiRouter', ($uiRouter: UIRouter) => $uiRouter.globals.params]);
mod_main .factory ('$view',              () => router.viewService);
mod_main .service ("$trace",             () => trace);

mod_main .run     (watchDigests);
mod_util .run     (['$urlMatcherFactory', function ($urlMatcherFactory: UrlMatcherFactory) { }]);
mod_state.run     (['$state', function ($state: StateService) { }]);
mod_rtr  .run     (['$urlRouter', function ($urlRouter: UrlRouter) { }]);
mod_init .run     (runBlock);

/** @hidden TODO: find a place to move this */
export const getLocals = (ctx: ResolveContext) => {
  let tokens = ctx.getTokens().filter(isString);
  let tuples = tokens.map(key => [ key, ctx.getResolvable(key).data ]);
  return tuples.reduce(applyPairs, {});
};

