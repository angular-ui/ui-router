/**
 * Angular 1 plugin:
 *
 * - Provides an implementation for the [[CoreServices]] API, based on angular 1 services.
 * - Also registers some services with the angular 1 injector.
 * - Creates and bootstraps a new [[Router]] object, usiong the angular 1 lifecycle
 *
 * @module ng1
 * @preferred
 */

/** for typedoc */
/// <reference path='../../typings/angularjs/angular.d.ts' />
import {IQService} from "angular";
import {Router} from "../router";
import {services} from "../common/coreservices";
import {forEach, isObject} from "../common/common";
import {RawParams} from "../params/interface";
import {Node} from "../path/module";
import {Resolvables} from "../resolve/interface";
import {Resolvable, ResolveContext} from "../resolve/module";
import {State} from "../state/module";
import {trace} from "../common/trace";
import {map} from "../common/common";
import {prop} from "../common/common";
import {bindFunctions} from "../common/common";
import {removeFrom} from "../common/common";

let app = angular.module("ui.router.angular1", []);

/**
 * Annotates a controller expression (may be a controller function(), a "controllername",
 * or "controllername as name")
 *
 * - Temporarily decorates $injector.instantiate.
 * - Invokes $controller() service
 *   - Calls $injector.instantiate with controller constructor
 * - Annotate constructor
 * - Undecorate $injector
 *
 * returns an array of strings, which are the arguments of the controller expression
 */

export function annotateController(controllerExpression): string[] {
  let $injector = services.$injector;
  let $controller = $injector.get("$controller");
  let oldInstantiate = $injector.instantiate;
  try {
    let deps;

    $injector.instantiate = function fakeInstantiate(constructorFunction) {
      $injector.instantiate = oldInstantiate; // Un-decorate ASAP
      deps = $injector.annotate(constructorFunction);
    };

    $controller(controllerExpression, { $scope: {} });

    return deps;
  } finally {
    $injector.instantiate = oldInstantiate;
  }
}

runBlock.$inject = ['$injector', '$q'];
function runBlock($injector, $q) {
  services.$injector = $injector;
  services.$q = $q;
}

app.run(runBlock);

let router: Router = null;

ng1UIRouter.$inject = ['$locationProvider'];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
function ng1UIRouter($locationProvider) {

  // Create a new instance of the Router when the ng1UIRouterProvider is initialized
  router = new Router();

  // Bind LocationConfig.hashPrefix to $locationProvider.hashPrefix
  bindFunctions($locationProvider, services.locationConfig, $locationProvider, ['hashPrefix']);

  // Create a LocationService.onChange registry
  let urlListeners: Function[] = [];
  services.location.onChange = (callback) => {
    urlListeners.push(callback);
    return () => removeFrom(urlListeners)(callback);
  };

  this.$get = $get;
  $get.$inject = ['$location', '$browser', '$sniffer', '$rootScope', '$http', '$templateCache'];
  function $get($location, $browser, $sniffer, $rootScope, $http, $templateCache) {

    // Bind $locationChangeSuccess to the listeners registered in LocationService.onChange
    $rootScope.$on("$locationChangeSuccess", evt => urlListeners.forEach(fn => fn(evt)));

    // Bind LocationConfig.html5Mode to $locationProvider.html5Mode and $sniffer.history
    services.locationConfig.html5Mode = function() {
      var html5Mode = $locationProvider.html5Mode();
      html5Mode = isObject(html5Mode) ? html5Mode.enabled : html5Mode;
      return html5Mode && $sniffer.history;
    };

    services.template.get = (url: string) =>
        $http.get(url, { cache: $templateCache, headers: { Accept: 'text/html' }}).then(prop("data"));

    // Bind these LocationService functions to $location
    bindFunctions($location, services.location, $location, ["replace", "url", "path", "search", "hash"]);
    // Bind these LocationConfig functions to $location
    bindFunctions($location, services.locationConfig, $location, ['port', 'protocol', 'host']);
    // Bind these LocationConfig functions to $browser
    bindFunctions($browser, services.locationConfig, $browser, ['baseHref']);

    return router;
  }
}

const resolveFactory = () => ({
  /**
   * This emulates most of the behavior of the ui-router 0.2.x $resolve.resolve() service API.
   * @param invocables an object, with keys as resolve names and values as injectable functions
   * @param locals key/value pre-resolved data (locals)
   * @param parent a promise for a "parent resolve"
   */
  resolve: (invocables, locals = {}, parent?) => {
    let parentNode = new Node(new State({ params: {} }));
    let node = new Node(new State({ params: {} }));
    let context = new ResolveContext([parentNode, node]);

    context.addResolvables(Resolvable.makeResolvables(invocables), node.state);

    const resolveData = (parentLocals) => {
      const rewrap = locals => Resolvable.makeResolvables(<any> map(locals, local => () => local));
      context.addResolvables(rewrap(parentLocals), parentNode.state);
      context.addResolvables(rewrap(locals), node.state);
      return context.resolvePath();
    };

    return parent ? parent.then(resolveData) : resolveData({});
  }
});

function $stateParamsFactory(ng1UIRouter, $rootScope) {
  $rootScope.$watch(function() {
    router.stateParams.$digest();
  });

  return router.stateParams;
}

// The 'ui.router' ng1 module depends on 'ui.router.init' module.
angular.module('ui.router.init', []).provider("ng1UIRouter", <any> ng1UIRouter);
// This effectively calls $get() to init when we enter runtime
angular.module('ui.router.init').run(['ng1UIRouter', function(ng1UIRouter) { }]);

// $urlMatcherFactory service and $urlMatcherFactoryProvider
angular.module('ui.router.util').provider('$urlMatcherFactory', ['ng1UIRouterProvider', () => router.urlMatcherFactory]);
angular.module('ui.router.util').run(['$urlMatcherFactory', function($urlMatcherFactory) { }]);

// $urlRouter service and $urlRouterProvider
function getUrlRouterProvider() {
  router.urlRouterProvider["$get"] = function() {
    router.urlRouter.update(true);
    if (!this.interceptDeferred) router.urlRouter.listen();
    return router.urlRouter;
  };
  return router.urlRouterProvider;
}
angular.module('ui.router.router').provider('$urlRouter', ['ng1UIRouterProvider', getUrlRouterProvider]);

// $state service and $stateProvider
angular.module('ui.router.state').provider('$state', ['ng1UIRouterProvider', () => router.stateProvider]);

/* This effectively calls $get() to init when we enter runtime */
angular.module('ui.router.init').run(['ng1UIRouter', function(ng1UIRouter) { }]);
angular.module('ui.router.state').run(['$state', function($state) { }]);

// $stateParams service
angular.module('ui.router.state').factory('$stateParams', ['ng1UIRouter', '$rootScope', $stateParamsFactory]);

// $transitions service and $transitionsProvider
function getTransitionsProvider() {
  router.transitionService["$get"] = () => router.transitionService;
  return router.transitionService;
}
angular.module('ui.router.state').provider('$transitions', ['ng1UIRouterProvider', getTransitionsProvider]);

// $templateFactory service
angular.module('ui.router.util').factory('$templateFactory', ['ng1UIRouter', () => router.templateFactory]);

// The $view service
angular.module('ui.router').factory('$view', () => router.viewService);

// The old $resolve service
angular.module('ui.router').factory('$resolve', <any> resolveFactory);

// $trace service
angular.module("ui.router").service("$trace", () => trace);
watchDigests.$inject = ['$rootScope'];
export function watchDigests($rootScope) {
  $rootScope.$watch(function() { trace.approximateDigests++; });
}
angular.module("ui.router").run(watchDigests);
