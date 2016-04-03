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
import {UIRouter} from "../router";
import {services} from "../common/coreservices";
import {map, bindFunctions, removeFrom, find, noop} from "../common/common";
import {prop, propEq} from "../common/hof";
import {isObject} from "../common/predicates";
import {Node} from "../path/module";
import {Resolvable, ResolveContext} from "../resolve/module";
import {State} from "../state/module";
import {trace} from "../common/trace";
import {ng1ViewsBuilder, ng1ViewConfigFactory, Ng1ViewConfig} from "./viewsBuilder";
import {TemplateFactory} from "./templateFactory";

/** @hidden */
let app = angular.module("ui.router.angular1", []);

/**
 * @ngdoc overview
 * @name ui.router.util
 *
 * @description
 * # ui.router.util sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 *
 */
angular.module('ui.router.util', ['ng', 'ui.router.init']);

/**
 * @ngdoc overview
 * @name ui.router.router
 *
 * @requires ui.router.util
 *
 * @description
 * # ui.router.router sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 */
angular.module('ui.router.router', ['ui.router.util']);

/**
 * @ngdoc overview
 * @name ui.router.state
 *
 * @requires ui.router.router
 * @requires ui.router.util
 *
 * @description
 * # ui.router.state sub-module
 *
 * This module is a dependency of the main ui.router module. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 *
 */
angular.module('ui.router.state', ['ui.router.router', 'ui.router.util', 'ui.router.angular1']);

/**
 * @ngdoc overview
 * @name ui.router
 *
 * @requires ui.router.state
 *
 * @description
 * # ui.router
 *
 * ## The main module for ui.router
 * There are several sub-modules included with the ui.router module, however only this module is needed
 * as a dependency within your angular app. The other modules are for organization purposes.
 *
 * The modules are:
 * * ui.router - the main "umbrella" module
 * * ui.router.router -
 *
 * *You'll need to include **only** this module as the dependency within your angular app.*
 *
 * <pre>
 * <!doctype html>
 * <html ng-app="myApp">
 * <head>
 *   <script src="js/angular.js"></script>
 *   <!-- Include the ui-router script -->
 *   <script src="js/angular-ui-router.min.js"></script>
 *   <script>
 *     // ...and add 'ui.router' as a dependency
 *     var myApp = angular.module('myApp', ['ui.router']);
 *   </script>
 * </head>
 * <body>
 * </body>
 * </html>
 * </pre>
 */
angular.module('ui.router', ['ui.router.init', 'ui.router.state', 'ui.router.angular1']);

angular.module('ui.router.compat', ['ui.router']);

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

let router: UIRouter = null;

ng1UIRouter.$inject = ['$locationProvider'];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
function ng1UIRouter($locationProvider) {

  // Create a new instance of the Router when the ng1UIRouterProvider is initialized
  router = new UIRouter();
  
  // Apply ng1 `views` builder to the StateBuilder
  router.stateRegistry.decorator("views", ng1ViewsBuilder);

  router.viewService.viewConfigFactory('ng1', ng1ViewConfigFactory);

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
      let html5Mode = $locationProvider.html5Mode();
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
    let parentNode = new Node(new State(<any> { params: {} }));
    let node = new Node(new State(<any> { params: {} }));
    let context = new ResolveContext([parentNode, node]);

    context.addResolvables(Resolvable.makeResolvables(invocables), node.state);

    const resolveData = (parentLocals) => {
      const rewrap = _locals => Resolvable.makeResolvables(<any> map(_locals, local => () => local));
      context.addResolvables(rewrap(parentLocals), parentNode.state);
      context.addResolvables(rewrap(locals), node.state);
      return context.resolvePath();
    };

    return parent ? parent.then(resolveData) : resolveData({});
  }
});

function $stateParamsFactory(ng1UIRouter) {
  return ng1UIRouter.globals.params;
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
angular.module('ui.router.router').run(['$urlRouter', function($urlRouter) { }]);

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
angular.module('ui.router.state').provider('$state', ['ng1UIRouterProvider', getStateProvider]);
angular.module('ui.router.state').run(['$state', function($state) { }]);

// $stateParams service
angular.module('ui.router.state').factory('$stateParams', ['ng1UIRouter', (ng1UIRouter) =>
    ng1UIRouter.globals.params]);

// $transitions service and $transitionsProvider
function getTransitionsProvider() {
  loadAllControllerLocals.$inject = ['$transition$'];
  function loadAllControllerLocals($transition$) {
    const loadLocals = (vc: Ng1ViewConfig) => {
      let node = (<Node> find($transition$.treeChanges().to, propEq('state', vc.viewDecl.$context)));
      // Temporary fix; This whole callback should be nuked when fixing #2662
      if (!node) return services.$q.when();
      let resolveCtx = node.resolveContext;
      let controllerDeps = annotateController(vc.controller);
      let resolvables = resolveCtx.getResolvables();

      function $loadControllerLocals() { }
      $loadControllerLocals.$inject = controllerDeps.filter(dep => resolvables.hasOwnProperty(dep));
      // Load any controller resolves that aren't already loaded
      return resolveCtx.invokeLater($loadControllerLocals)
          // Then provide the view config with all the resolved data
          .then(() => vc.locals = map(resolvables, res => res.data));
    };

    let loadAllLocals = $transition$.views("entering").filter(vc => !!vc.controller).map(loadLocals);
    return services.$q.all(loadAllLocals).then(noop);
  }
  router.transitionService.onFinish({}, loadAllControllerLocals);

  router.transitionService["$get"] = () => router.transitionService;
  return router.transitionService;
}
angular.module('ui.router.state').provider('$transitions', ['ng1UIRouterProvider', getTransitionsProvider]);

// $templateFactory service
angular.module('ui.router.util').factory('$templateFactory', ['ng1UIRouter', () => new TemplateFactory()]);

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
