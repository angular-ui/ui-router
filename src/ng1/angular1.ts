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
import {isObject} from "../common/common";

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

const bindFunctions = (fnNames: string[], from, to) =>
    fnNames.forEach(name => to[name] = from[name].bind(from));

let router = null;

ng1UIRouter.$inject = ['$locationProvider'];
function ng1UIRouter($locationProvider) {
  router = new Router();
  bindFunctions(['hashPrefix'], $locationProvider, services.locationConfig);

  this.$get = $get;
  $get.$inject = ['$location', '$browser', '$sniffer'];
  function $get($location, $browser, $sniffer) {

    services.locationConfig.html5Mode = function() {
      var html5Mode = $locationProvider.html5Mode();
      html5Mode = isObject(html5Mode) ? html5Mode.enabled : html5Mode;
      return html5Mode && $sniffer.history;
    };

    bindFunctions(["replace", "url", "path", "search", "hash"], $location, services.location);
    bindFunctions([ 'port', 'protocol', 'host'], $location, services.locationConfig);
    bindFunctions(['baseHref'], $browser, services.locationConfig);

    return router;
  }
}

angular.module('ui.router.init', []).provider("ng1UIRouter", <any> ng1UIRouter);
// Register as a provider so it's available to other providers
angular.module('ui.router.util').provider('$urlMatcherFactory', ['ng1UIRouterProvider', () => router.urlMatcherFactory]);
angular.module('ui.router.router').provider('$urlRouter', ['ng1UIRouterProvider', () => router.urlRouterProvider]);
angular.module('ui.router.state').provider('$state', ['ng1UIRouterProvider', () => router.stateProvider]);

/* This effectively calls $get() to init when we enter runtime */
angular.module('ui.router.init').run(['ng1UIRouter', function(ng1UIRouter) { }]);
angular.module('ui.router.state').run(['$state', function($state) { }]);
angular.module('ui.router.util').run(['$urlMatcherFactory', function($urlMatcherFactory) { }]);

