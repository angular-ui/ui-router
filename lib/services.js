"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * # Angular 1 types
 *
 * UI-Router core provides various Typescript types which you can use for code completion and validating parameter values, etc.
 * The customizations to the core types for Angular UI-Router are documented here.
 *
 * The optional [[$resolve]] service is also documented here.
 *
 * @module ng1
 * @preferred
 */
/** for typedoc */
var angular_1 = require("./angular");
var core_1 = require("@uirouter/core");
var views_1 = require("./statebuilders/views");
var templateFactory_1 = require("./templateFactory");
var stateProvider_1 = require("./stateProvider");
var onEnterExitRetain_1 = require("./statebuilders/onEnterExitRetain");
var locationServices_1 = require("./locationServices");
var urlRouterProvider_1 = require("./urlRouterProvider");
angular_1.ng.module("ui.router.angular1", []);
var mod_init = angular_1.ng.module('ui.router.init', []);
var mod_util = angular_1.ng.module('ui.router.util', ['ng', 'ui.router.init']);
var mod_rtr = angular_1.ng.module('ui.router.router', ['ui.router.util']);
var mod_state = angular_1.ng.module('ui.router.state', ['ui.router.router', 'ui.router.util', 'ui.router.angular1']);
var mod_main = angular_1.ng.module('ui.router', ['ui.router.init', 'ui.router.state', 'ui.router.angular1']);
var mod_cmpt = angular_1.ng.module('ui.router.compat', ['ui.router']); // tslint:disable-line
var router = null;
$uiRouter.$inject = ['$locationProvider'];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
function $uiRouter($locationProvider) {
    // Create a new instance of the Router when the $uiRouterProvider is initialized
    router = this.router = new core_1.UIRouter();
    router.stateProvider = new stateProvider_1.StateProvider(router.stateRegistry, router.stateService);
    // Apply ng1 specific StateBuilder code for `views`, `resolve`, and `onExit/Retain/Enter` properties
    router.stateRegistry.decorator("views", views_1.ng1ViewsBuilder);
    router.stateRegistry.decorator("onExit", onEnterExitRetain_1.getStateHookBuilder("onExit"));
    router.stateRegistry.decorator("onRetain", onEnterExitRetain_1.getStateHookBuilder("onRetain"));
    router.stateRegistry.decorator("onEnter", onEnterExitRetain_1.getStateHookBuilder("onEnter"));
    router.viewService._pluginapi._viewConfigFactory('ng1', views_1.getNg1ViewConfigFactory());
    var ng1LocationService = router.locationService = router.locationConfig = new locationServices_1.Ng1LocationServices($locationProvider);
    locationServices_1.Ng1LocationServices.monkeyPatchPathParameterType(router);
    // backwards compat: also expose router instance as $uiRouterProvider.router
    router['router'] = router;
    router['$get'] = $get;
    $get.$inject = ['$location', '$browser', '$sniffer', '$rootScope', '$http', '$templateCache'];
    function $get($location, $browser, $sniffer, $rootScope, $http, $templateCache) {
        ng1LocationService._runtimeServices($rootScope, $location, $sniffer, $browser);
        delete router['router'];
        delete router['$get'];
        return router;
    }
    return router;
}
var getProviderFor = function (serviceName) { return ['$uiRouterProvider', function ($urp) {
        var service = $urp.router[serviceName];
        service["$get"] = function () { return service; };
        return service;
    }]; };
// This effectively calls $get() on `$uiRouterProvider` to trigger init (when ng enters runtime)
runBlock.$inject = ['$injector', '$q', '$uiRouter'];
function runBlock($injector, $q, $uiRouter) {
    core_1.services.$injector = $injector;
    core_1.services.$q = $q;
    // The $injector is now available.
    // Find any resolvables that had dependency annotation deferred
    $uiRouter.stateRegistry.get()
        .map(function (x) { return x.$$state().resolvables; })
        .reduce(core_1.unnestR, [])
        .filter(function (x) { return x.deps === "deferred"; })
        .forEach(function (resolvable) { return resolvable.deps = $injector.annotate(resolvable.resolveFn, $injector.strictDi); });
}
// $urlRouter service and $urlRouterProvider
var getUrlRouterProvider = function (uiRouter) {
    return uiRouter.urlRouterProvider = new urlRouterProvider_1.UrlRouterProvider(uiRouter);
};
// $state service and $stateProvider
// $urlRouter service and $urlRouterProvider
var getStateProvider = function () {
    return core_1.extend(router.stateProvider, { $get: function () { return router.stateService; } });
};
watchDigests.$inject = ['$rootScope'];
function watchDigests($rootScope) {
    $rootScope.$watch(function () { core_1.trace.approximateDigests++; });
}
exports.watchDigests = watchDigests;
mod_init.provider("$uiRouter", $uiRouter);
mod_rtr.provider('$urlRouter', ['$uiRouterProvider', getUrlRouterProvider]);
mod_util.provider('$urlService', getProviderFor('urlService'));
mod_util.provider('$urlMatcherFactory', ['$uiRouterProvider', function () { return router.urlMatcherFactory; }]);
mod_util.provider('$templateFactory', function () { return new templateFactory_1.TemplateFactory(); });
mod_state.provider('$stateRegistry', getProviderFor('stateRegistry'));
mod_state.provider('$uiRouterGlobals', getProviderFor('globals'));
mod_state.provider('$transitions', getProviderFor('transitionService'));
mod_state.provider('$state', ['$uiRouterProvider', getStateProvider]);
mod_state.factory('$stateParams', ['$uiRouter', function ($uiRouter) { return $uiRouter.globals.params; }]);
mod_main.factory('$view', function () { return router.viewService; });
mod_main.service("$trace", function () { return core_1.trace; });
mod_main.run(watchDigests);
mod_util.run(['$urlMatcherFactory', function ($urlMatcherFactory) { }]);
mod_state.run(['$state', function ($state) { }]);
mod_rtr.run(['$urlRouter', function ($urlRouter) { }]);
mod_init.run(runBlock);
/** @hidden TODO: find a place to move this */
exports.getLocals = function (ctx) {
    var tokens = ctx.getTokens().filter(core_1.isString);
    var tuples = tokens.map(function (key) {
        var resolvable = ctx.getResolvable(key);
        var waitPolicy = ctx.getPolicy(resolvable).async;
        return [key, waitPolicy === 'NOWAIT' ? resolvable.promise : resolvable.data];
    });
    return tuples.reduce(core_1.applyPairs, {});
};
//# sourceMappingURL=services.js.map