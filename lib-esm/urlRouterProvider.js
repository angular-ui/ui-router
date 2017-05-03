/** @module url */ /** */
import { BaseUrlRule } from "@uirouter/core";
import { services, isString, isFunction, isArray, identity } from "@uirouter/core";
/**
 * Manages rules for client-side URL
 *
 * ### Deprecation warning:
 * This class is now considered to be an internal API
 * Use the [[UrlService]] instead.
 * For configuring URL rules, use the [[UrlRulesApi]] which can be found as [[UrlService.rules]].
 *
 * This class manages the router rules for what to do when the URL changes.
 *
 * This provider remains for backwards compatibility.
 *
 * @deprecated
 */
var UrlRouterProvider = (function () {
    /** @hidden */
    function UrlRouterProvider(router) {
        this._router = router;
        this._urlRouter = router.urlRouter;
    }
    /** @hidden */
    UrlRouterProvider.prototype.$get = function () {
        var urlRouter = this._urlRouter;
        urlRouter.update(true);
        if (!urlRouter.interceptDeferred)
            urlRouter.listen();
        return urlRouter;
    };
    /**
     * Registers a url handler function.
     *
     * Registers a low level url handler (a `rule`).
     * A rule detects specific URL patterns and returns a redirect, or performs some action.
     *
     * If a rule returns a string, the URL is replaced with the string, and all rules are fired again.
     *
     * #### Example:
     * ```js
     * var app = angular.module('app', ['ui.router.router']);
     *
     * app.config(function ($urlRouterProvider) {
     *   // Here's an example of how you might allow case insensitive urls
     *   $urlRouterProvider.rule(function ($injector, $location) {
     *     var path = $location.path(),
     *         normalized = path.toLowerCase();
     *
     *     if (path !== normalized) {
     *       return normalized;
     *     }
     *   });
     * });
     * ```
     *
     * @param ruleFn
     * Handler function that takes `$injector` and `$location` services as arguments.
     * You can use them to detect a url and return a different url as a string.
     *
     * @return [[UrlRouterProvider]] (`this`)
     */
    UrlRouterProvider.prototype.rule = function (ruleFn) {
        var _this = this;
        if (!isFunction(ruleFn))
            throw new Error("'rule' must be a function");
        var match = function () {
            return ruleFn(services.$injector, _this._router.locationService);
        };
        var rule = new BaseUrlRule(match, identity);
        this._urlRouter.rule(rule);
        return this;
    };
    ;
    /**
     * Defines the path or behavior to use when no url can be matched.
     *
     * #### Example:
     * ```js
     * var app = angular.module('app', ['ui.router.router']);
     *
     * app.config(function ($urlRouterProvider) {
     *   // if the path doesn't match any of the urls you configured
     *   // otherwise will take care of routing the user to the
     *   // specified url
     *   $urlRouterProvider.otherwise('/index');
     *
     *   // Example of using function rule as param
     *   $urlRouterProvider.otherwise(function ($injector, $location) {
     *     return '/a/valid/url';
     *   });
     * });
     * ```
     *
     * @param rule
     * The url path you want to redirect to or a function rule that returns the url path or performs a `$state.go()`.
     * The function version is passed two params: `$injector` and `$location` services, and should return a url string.
     *
     * @return {object} `$urlRouterProvider` - `$urlRouterProvider` instance
     */
    UrlRouterProvider.prototype.otherwise = function (rule) {
        var _this = this;
        var urlRouter = this._urlRouter;
        if (isString(rule)) {
            urlRouter.otherwise(rule);
        }
        else if (isFunction(rule)) {
            urlRouter.otherwise(function () { return rule(services.$injector, _this._router.locationService); });
        }
        else {
            throw new Error("'rule' must be a string or function");
        }
        return this;
    };
    ;
    /**
     * Registers a handler for a given url matching.
     *
     * If the handler is a string, it is
     * treated as a redirect, and is interpolated according to the syntax of match
     * (i.e. like `String.replace()` for `RegExp`, or like a `UrlMatcher` pattern otherwise).
     *
     * If the handler is a function, it is injectable.
     * It gets invoked if `$location` matches.
     * You have the option of inject the match object as `$match`.
     *
     * The handler can return
     *
     * - **falsy** to indicate that the rule didn't match after all, then `$urlRouter`
     *   will continue trying to find another one that matches.
     * - **string** which is treated as a redirect and passed to `$location.url()`
     * - **void** or any **truthy** value tells `$urlRouter` that the url was handled.
     *
     * #### Example:
     * ```js
     * var app = angular.module('app', ['ui.router.router']);
     *
     * app.config(function ($urlRouterProvider) {
     *   $urlRouterProvider.when($state.url, function ($match, $stateParams) {
     *     if ($state.$current.navigable !== state ||
     *         !equalForKeys($match, $stateParams) {
     *      $state.transitionTo(state, $match, false);
     *     }
     *   });
     * });
     * ```
     *
     * @param what A pattern string to match, compiled as a [[UrlMatcher]].
     * @param handler The path (or function that returns a path) that you want to redirect your user to.
     * @param ruleCallback [optional] A callback that receives the `rule` registered with [[UrlMatcher.rule]]
     *
     * Note: the handler may also invoke arbitrary code, such as `$state.go()`
     */
    UrlRouterProvider.prototype.when = function (what, handler) {
        if (isArray(handler) || isFunction(handler)) {
            handler = UrlRouterProvider.injectableHandler(this._router, handler);
        }
        this._urlRouter.when(what, handler);
        return this;
    };
    ;
    UrlRouterProvider.injectableHandler = function (router, handler) {
        return function (match) {
            return services.$injector.invoke(handler, null, { $match: match, $stateParams: router.globals.params });
        };
    };
    /**
     * Disables monitoring of the URL.
     *
     * Call this method before UI-Router has bootstrapped.
     * It will stop UI-Router from performing the initial url sync.
     *
     * This can be useful to perform some asynchronous initialization before the router starts.
     * Once the initialization is complete, call [[listen]] to tell UI-Router to start watching and synchronizing the URL.
     *
     * #### Example:
     * ```js
     * var app = angular.module('app', ['ui.router']);
     *
     * app.config(function ($urlRouterProvider) {
     *   // Prevent $urlRouter from automatically intercepting URL changes;
     *   $urlRouterProvider.deferIntercept();
     * })
     *
     * app.run(function (MyService, $urlRouter, $http) {
     *   $http.get("/stuff").then(function(resp) {
     *     MyService.doStuff(resp.data);
     *     $urlRouter.listen();
     *     $urlRouter.sync();
     *   });
     * });
     * ```
     *
     * @param defer Indicates whether to defer location change interception.
     *        Passing no parameter is equivalent to `true`.
     */
    UrlRouterProvider.prototype.deferIntercept = function (defer) {
        this._urlRouter.deferIntercept(defer);
    };
    ;
    return UrlRouterProvider;
}());
export { UrlRouterProvider };
//# sourceMappingURL=urlRouterProvider.js.map