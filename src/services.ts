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
import {
    IRootScopeService, IQService, ILocationService, ILocationProvider, IHttpService, ITemplateCacheService
} from "angular";
import {
    services, bindFunctions, removeFrom, applyPairs, prop, isObject, isString, trace,
    UIRouter, IInjectable, StateParams, TransitionService, StateService, UrlRouterProvider,
    UrlRouter, UrlMatcherFactory, ResolveContext, TypedMap
} from "ui-router-core";
import { ng1ViewsBuilder, ng1ViewConfigFactory } from "./statebuilders/views";
import { TemplateFactory } from "./templateFactory";
import { StateProvider } from "./stateProvider";
import { getStateHookBuilder } from "./statebuilders/onEnterExitRetain";
import IInjectorService = angular.auto.IInjectorService;
// has or is using

/** @hidden */
let app = angular.module("ui.router.angular1", []);

angular.module('ui.router.util', ['ng', 'ui.router.init']);
angular.module('ui.router.router', ['ui.router.util']);
angular.module('ui.router.state', ['ui.router.router', 'ui.router.util', 'ui.router.angular1']);
angular.module('ui.router', ['ui.router.init', 'ui.router.state', 'ui.router.angular1']);
angular.module('ui.router.compat', ['ui.router']);

declare module 'ui-router-core/lib/router' {
  interface UIRouter {
    /** @hidden */
    stateProvider: StateProvider;
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
  router.stateRegistry.decorator("views", ng1ViewsBuilder);
  router.stateRegistry.decorator("onExit", getStateHookBuilder("onExit"));
  router.stateRegistry.decorator("onRetain", getStateHookBuilder("onRetain"));
  router.stateRegistry.decorator("onEnter", getStateHookBuilder("onEnter"));

  router.viewService._pluginapi._viewConfigFactory('ng1', ng1ViewConfigFactory);

  // Bind LocationConfig.hashPrefix to $locationProvider.hashPrefix
  bindFunctions($locationProvider, services.location, $locationProvider, ['hashPrefix']);

  // Create a LocationService.onChange registry
  let urlListeners: Function[] = [];
  services.location.onChange = (callback) => {
    urlListeners.push(callback);
    return () => removeFrom(urlListeners)(callback);
  };

  router['router'] = router;
  router['$get'] = $get;
  $get.$inject = ['$location', '$browser', '$sniffer', '$rootScope', '$http', '$templateCache'];
  function $get($location: ILocationService, $browser: any, $sniffer: any, $rootScope: ng.IScope, $http: IHttpService, $templateCache: ITemplateCacheService) {
    delete router['router'];
    delete router['$get'];

    // Bind $locationChangeSuccess to the listeners registered in LocationService.onChange
    $rootScope.$on("$locationChangeSuccess", evt => urlListeners.forEach(fn => fn(evt)));

    // Bind LocationConfig.html5Mode to $locationProvider.html5Mode and $sniffer.history
    services.location.html5Mode = function() {
      let html5Mode: any = $locationProvider.html5Mode();
      html5Mode = isObject(html5Mode) ? html5Mode.enabled : html5Mode;
      return html5Mode && $sniffer.history;
    };

    services.location.setUrl = (newUrl: string, replace = false) =>  {
      $location.url(newUrl);
      if (replace) $location.replace();
    };

    services.template.get = (url: string) =>
        $http.get(url, { cache: $templateCache, headers: { Accept: 'text/html' }}).then(prop("data")) as any;

    // Bind these LocationService functions to $location
    bindFunctions($location, services.location, $location, ["replace", "url", "path", "search", "hash"]);
    // Bind these LocationConfig functions to $location
    bindFunctions($location, services.locationConfig, $location, ['port', 'protocol', 'host']);
    // Bind these LocationConfig functions to $browser
    bindFunctions($browser, services.locationConfig, $browser, ['baseHref']);

    return router;
  }
  return router;
}

const getProviderFor = (serviceName) => [ '$uiRouterProvider', ($urp) => {
  let service = $urp.router[serviceName];
  service["$get"] = () => service;
  return service;
}];

// The 'ui.router' ng1 module depends on 'ui.router.init' module.
angular.module('ui.router.init', []).provider("$uiRouter", <any> $uiRouter);

runBlock.$inject = ['$injector', '$q'];
function runBlock($injector: IInjectorService, $q: IQService) {
  services.$injector = $injector;
  services.$q = <any> $q;
}

angular.module('ui.router.init').run(runBlock);

// This effectively calls $get() to init when we enter runtime
angular.module('ui.router.init').run(['$uiRouter', function($uiRouter: UIRouter) { }]);

// $urlMatcherFactory service and $urlMatcherFactoryProvider
angular.module('ui.router.util').provider('$urlMatcherFactory', ['$uiRouterProvider', () => router.urlMatcherFactory]);
angular.module('ui.router.util').run(['$urlMatcherFactory', function($urlMatcherFactory: UrlMatcherFactory) { }]);

// $urlRouter service and $urlRouterProvider
function getUrlRouterProvider() {
  router.urlRouterProvider["$get"] = function() {
    router.urlRouter.update(true);
    if (!this.interceptDeferred) router.urlRouter.listen();
    return router.urlRouter;
  };
  return router.urlRouterProvider;
}
angular.module('ui.router.router').provider('$urlRouter', ['$uiRouterProvider', getUrlRouterProvider]);
angular.module('ui.router.router').run(['$urlRouter', function($urlRouter: UrlRouter) { }]);

// $state service and $stateProvider
// $urlRouter service and $urlRouterProvider
function getStateProvider() {
  router.stateProvider["$get"] = function() {
    // Autoflush once we are in runtime
    router.stateRegistry.stateQueue.autoFlush(router.stateService);
    return router.stateService;
  };
  return router.stateProvider;
}
angular.module('ui.router.state').provider('$state', ['$uiRouterProvider', getStateProvider]);
angular.module('ui.router.state').run(['$state', function($state: StateService) { }]);

// $stateRegistry and $stateRegistryProvider
angular.module('ui.router.state').provider('$stateRegistry', getProviderFor('stateRegistry'));

// $uiRouterGlobals and $uiRouterGlobalsProvider
angular.module('ui.router.state').provider('$uiRouterGlobals', getProviderFor('globals'));

// $stateParams service
angular.module('ui.router.state').factory('$stateParams', ['$uiRouter', ($uiRouter: UIRouter) =>
    $uiRouter.globals.params]);

// $transitions and $transitionsProvider
angular.module('ui.router.state').provider('$transitions', getProviderFor('transitionService'));

// $templateFactory
angular.module('ui.router.util').factory('$templateFactory', ['$uiRouter', () => new TemplateFactory()]);

// The $view service
angular.module('ui.router').factory('$view', () => router.viewService);

// $trace service
angular.module("ui.router").service("$trace", () => trace);
watchDigests.$inject = ['$rootScope'];
export function watchDigests($rootScope: IRootScopeService) {
  $rootScope.$watch(function() { trace.approximateDigests++; });
}
angular.module("ui.router").run(watchDigests);

export const getLocals = (ctx: ResolveContext) => {
  let tokens = ctx.getTokens().filter(isString);
  let tuples = tokens.map(key => [ key, ctx.getResolvable(key).data ]);
  return tuples.reduce(applyPairs, {});
};

