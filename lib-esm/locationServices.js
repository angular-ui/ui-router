import { val, createProxyFunctions, removeFrom, isObject } from "ui-router-core";
/**
 * Implements UI-Router LocationServices and LocationConfig using Angular 1's $location service
 */
var Ng1LocationServices = (function () {
    function Ng1LocationServices($locationProvider) {
        // .onChange() registry
        this._urlListeners = [];
        this.$locationProvider = $locationProvider;
        var _lp = val($locationProvider);
        createProxyFunctions(_lp, this, _lp, ['hashPrefix']);
    }
    Ng1LocationServices.prototype.dispose = function () { };
    Ng1LocationServices.prototype.onChange = function (callback) {
        var _this = this;
        this._urlListeners.push(callback);
        return function () { return removeFrom(_this._urlListeners)(callback); };
    };
    Ng1LocationServices.prototype.html5Mode = function () {
        var html5Mode = this.$locationProvider.html5Mode();
        html5Mode = isObject(html5Mode) ? html5Mode.enabled : html5Mode;
        return html5Mode && this.$sniffer.history;
    };
    Ng1LocationServices.prototype.url = function (newUrl, replace, state) {
        if (replace === void 0) { replace = false; }
        if (newUrl)
            this.$location.url(newUrl);
        if (replace)
            this.$location.replace();
        if (state)
            this.$location.state(state);
        return this.$location.url();
    };
    Ng1LocationServices.prototype._runtimeServices = function ($rootScope, $location, $sniffer, $browser) {
        var _this = this;
        this.$location = $location;
        this.$sniffer = $sniffer;
        // Bind $locationChangeSuccess to the listeners registered in LocationService.onChange
        $rootScope.$on("$locationChangeSuccess", function (evt) { return _this._urlListeners.forEach(function (fn) { return fn(evt); }); });
        var _loc = val($location);
        var _browser = val($browser);
        // Bind these LocationService functions to $location
        createProxyFunctions(_loc, this, _loc, ["replace", "path", "search", "hash"]);
        // Bind these LocationConfig functions to $location
        createProxyFunctions(_loc, this, _loc, ['port', 'protocol', 'host']);
        // Bind these LocationConfig functions to $browser
        createProxyFunctions(_browser, this, _browser, ['baseHref']);
    };
    /**
     * Applys ng1-specific path parameter encoding
     *
     * The Angular 1 `$location` service is a bit weird.
     * It doesn't allow slashes to be encoded/decoded bi-directionally.
     *
     * See the writeup at https://github.com/angular-ui/ui-router/issues/2598
     *
     * This code patches the `path` parameter type so it encoded/decodes slashes as ~2F
     *
     * @param router
     */
    Ng1LocationServices.monkeyPatchPathParameterType = function (router) {
        var pathType = router.urlMatcherFactory.type('path');
        pathType.encode = function (val) {
            return val != null ? val.toString().replace(/(~|\/)/g, function (m) { return ({ '~': '~~', '/': '~2F' }[m]); }) : val;
        };
        pathType.decode = function (val) {
            return val != null ? val.toString().replace(/(~~|~2F)/g, function (m) { return ({ '~~': '~', '~2F': '/' }[m]); }) : val;
        };
    };
    return Ng1LocationServices;
}());
export { Ng1LocationServices };
//# sourceMappingURL=locationServices.js.map