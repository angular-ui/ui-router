/** @module common */ /** for typedoc */

/**
 * Provides the implementation for services defined in [[coreservices]], and registers some
 * with the angular 1 injector.
 */

/// <reference path='../../typings/angularjs/angular.d.ts' />
import {IQService} from "angular";
import {Router} from "../router";
import {services} from "./coreservices";
import {isObject} from "./common";

let app = angular.module("ui.router.angular1", []);

interface IRuntime {
  setRuntimeInjector($injector: ng.auto.IInjectorService);
  $injector: ng.auto.IInjectorService;
  $q: IQService;
}

export let runtime: IRuntime = {
  setRuntimeInjector: function($injector: ng.auto.IInjectorService) {
    runtime.$injector = $injector;
    runtime.$q = $injector.get("$q");
  },
  $injector: undefined,
  $q: undefined
};

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
  let $injector = runtime.$injector;
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

runBlock.$inject = ["$injector"];
function runBlock($injector) {
  runtime.setRuntimeInjector($injector);
}

app.run(runBlock);

const bindFunctions = (fnNames: string[], from, to) =>
    fnNames.forEach(name => to[name] = from[name].bind(from));

let router = null;

ng1UIRouter.$inject = ['$locationProvider'];
function ng1UIRouter($locationProvider) {
  router = new Router();
  bindFunctions(['hashPrefix'], $locationProvider, services.location);

  this.$get = $get;
  $get.$inject = ['$location', '$browser', '$sniffer'];
  function $get($location, $browser, $sniffer) {

    services.location.html5Mode = function() {
      var html5Mode = $locationProvider.html5Mode();
      html5Mode = isObject(html5Mode) ? html5Mode.enabled : html5Mode;
      return html5Mode && $sniffer.history;
    };

    var $locationFnNames = ['hash', 'path', 'replace', 'search', 'url', 'port', 'protocol', 'host'];
    bindFunctions($locationFnNames, $location, services.location);
    bindFunctions(['baseHref'], $browser, services.location);

    return router;
  }
}

angular.module('ui.router.init', ['ng']).provider("ng1UIRouter", <any> ng1UIRouter);
// Register as a provider so it's available to other providers
angular.module('ui.router.util').provider('$urlMatcherFactory', ['ng1UIRouterProvider', () => router.urlMatcherFactory]);
angular.module('ui.router.router').provider('$urlRouter', ['ng1UIRouterProvider', () => router.urlRouterProvider]);
angular.module('ui.router.state').provider('$state', ['ng1UIRouterProvider', () => router.stateProvider]);

/* This effectively calls $get() to init when we enter runtime */
angular.module('ui.router.state').run(['ng1UIRouter', function(ng1UIRouter) { }]);
angular.module('ui.router.state').run(['$state', function($state) { }]);
angular.module('ui.router.util').run(['$urlMatcherFactory', function($urlMatcherFactory) { }]);

