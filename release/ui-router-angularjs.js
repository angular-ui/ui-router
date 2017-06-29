/**
 * State-based routing for AngularJS 1.x
 * This bundle requires the ui-router-core.js bundle from the @uirouter/core package.
 * @version v1.0.5
 * @link https://ui-router.github.io
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('angular'), require('@uirouter/core')) :
    typeof define === 'function' && define.amd ? define(['exports', 'angular', '@uirouter/core'], factory) :
    (factory((global['@uirouter/angularjs'] = global['@uirouter/angularjs'] || {}),global.angular,global['@uirouter/core']));
}(this, (function (exports,ng_from_import,_uirouter_core) { 'use strict';

var ng_from_global = angular;
var ng = (ng_from_import && ng_from_import.module) ? ng_from_import : ng_from_global;

function getNg1ViewConfigFactory() {
    var templateFactory = null;
    return function (path, view) {
        templateFactory = templateFactory || _uirouter_core.services.$injector.get("$templateFactory");
        return [new Ng1ViewConfig(path, view, templateFactory)];
    };
}
var hasAnyKey = function (keys, obj) {
    return keys.reduce(function (acc, key) { return acc || _uirouter_core.isDefined(obj[key]); }, false);
};
/**
 * This is a [[StateBuilder.builder]] function for angular1 `views`.
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * handles the `views` property with logic specific to @uirouter/angularjs (ng1).
 *
 * If no `views: {}` property exists on the [[StateDeclaration]], then it creates the `views` object
 * and applies the state-level configuration to a view named `$default`.
 */
function ng1ViewsBuilder(state) {
    // Do not process root state
    if (!state.parent)
        return {};
    var tplKeys = ['templateProvider', 'templateUrl', 'template', 'notify', 'async'], ctrlKeys = ['controller', 'controllerProvider', 'controllerAs', 'resolveAs'], compKeys = ['component', 'bindings', 'componentProvider'], nonCompKeys = tplKeys.concat(ctrlKeys), allViewKeys = compKeys.concat(nonCompKeys);
    // Do not allow a state to have both state-level props and also a `views: {}` property.
    // A state without a `views: {}` property can declare properties for the `$default` view as properties of the state.
    // However, the `$default` approach should not be mixed with a separate `views: ` block.
    if (_uirouter_core.isDefined(state.views) && hasAnyKey(allViewKeys, state)) {
        throw new Error("State '" + state.name + "' has a 'views' object. " +
            "It cannot also have \"view properties\" at the state level.  " +
            "Move the following properties into a view (in the 'views' object): " +
            (" " + allViewKeys.filter(function (key) { return _uirouter_core.isDefined(state[key]); }).join(", ")));
    }
    var views = {}, viewsObject = state.views || { "$default": _uirouter_core.pick(state, allViewKeys) };
    _uirouter_core.forEach(viewsObject, function (config, name) {
        // Account for views: { "": { template... } }
        name = name || "$default";
        // Account for views: { header: "headerComponent" }
        if (_uirouter_core.isString(config))
            config = { component: config };
        // Make a shallow copy of the config object
        config = _uirouter_core.extend({}, config);
        // Do not allow a view to mix props for component-style view with props for template/controller-style view
        if (hasAnyKey(compKeys, config) && hasAnyKey(nonCompKeys, config)) {
            throw new Error("Cannot combine: " + compKeys.join("|") + " with: " + nonCompKeys.join("|") + " in stateview: '" + name + "@" + state.name + "'");
        }
        config.resolveAs = config.resolveAs || '$resolve';
        config.$type = "ng1";
        config.$context = state;
        config.$name = name;
        var normalized = _uirouter_core.ViewService.normalizeUIViewTarget(config.$context, config.$name);
        config.$uiViewName = normalized.uiViewName;
        config.$uiViewContextAnchor = normalized.uiViewContextAnchor;
        views[name] = config;
    });
    return views;
}
var id = 0;
var Ng1ViewConfig = (function () {
    function Ng1ViewConfig(path, viewDecl, factory) {
        var _this = this;
        this.path = path;
        this.viewDecl = viewDecl;
        this.factory = factory;
        this.$id = id++;
        this.loaded = false;
        this.getTemplate = function (uiView, context) {
            return _this.component ? _this.factory.makeComponentTemplate(uiView, context, _this.component, _this.viewDecl.bindings) : _this.template;
        };
    }
    Ng1ViewConfig.prototype.load = function () {
        var _this = this;
        var $q = _uirouter_core.services.$q;
        var context = new _uirouter_core.ResolveContext(this.path);
        var params = this.path.reduce(function (acc, node) { return _uirouter_core.extend(acc, node.paramValues); }, {});
        var promises = {
            template: $q.when(this.factory.fromConfig(this.viewDecl, params, context)),
            controller: $q.when(this.getController(context))
        };
        return $q.all(promises).then(function (results) {
            _uirouter_core.trace.traceViewServiceEvent("Loaded", _this);
            _this.controller = results.controller;
            _uirouter_core.extend(_this, results.template); // Either { template: "tpl" } or { component: "cmpName" }
            return _this;
        });
    };
    /**
     * Gets the controller for a view configuration.
     *
     * @returns {Function|Promise.<Function>} Returns a controller, or a promise that resolves to a controller.
     */
    Ng1ViewConfig.prototype.getController = function (context) {
        var provider = this.viewDecl.controllerProvider;
        if (!_uirouter_core.isInjectable(provider))
            return this.viewDecl.controller;
        var deps = _uirouter_core.services.$injector.annotate(provider);
        var providerFn = _uirouter_core.isArray(provider) ? _uirouter_core.tail(provider) : provider;
        var resolvable = new _uirouter_core.Resolvable("", providerFn, deps);
        return resolvable.get(context);
    };
    return Ng1ViewConfig;
}());

/** @module view */
/** for typedoc */
/**
 * Service which manages loading of templates from a ViewConfig.
 */
var TemplateFactory = (function () {
    function TemplateFactory() {
        var _this = this;
        /** @hidden */ this._useHttp = ng.version.minor < 3;
        /** @hidden */ this.$get = ['$http', '$templateCache', '$injector', function ($http, $templateCache, $injector) {
                _this.$templateRequest = $injector.has && $injector.has('$templateRequest') && $injector.get('$templateRequest');
                _this.$http = $http;
                _this.$templateCache = $templateCache;
                return _this;
            }];
    }
    /** @hidden */
    TemplateFactory.prototype.useHttpService = function (value) {
        this._useHttp = value;
    };
    
    /**
     * Creates a template from a configuration object.
     *
     * @param config Configuration object for which to load a template.
     * The following properties are search in the specified order, and the first one
     * that is defined is used to create the template:
     *
     * @param params  Parameters to pass to the template function.
     * @param context The resolve context associated with the template's view
     *
     * @return {string|object}  The template html as a string, or a promise for
     * that string,or `null` if no template is configured.
     */
    TemplateFactory.prototype.fromConfig = function (config, params, context) {
        var defaultTemplate = "<ui-view></ui-view>";
        var asTemplate = function (result) { return _uirouter_core.services.$q.when(result).then(function (str) { return ({ template: str }); }); };
        var asComponent = function (result) { return _uirouter_core.services.$q.when(result).then(function (str) { return ({ component: str }); }); };
        return (_uirouter_core.isDefined(config.template) ? asTemplate(this.fromString(config.template, params)) :
            _uirouter_core.isDefined(config.templateUrl) ? asTemplate(this.fromUrl(config.templateUrl, params)) :
                _uirouter_core.isDefined(config.templateProvider) ? asTemplate(this.fromProvider(config.templateProvider, params, context)) :
                    _uirouter_core.isDefined(config.component) ? asComponent(config.component) :
                        _uirouter_core.isDefined(config.componentProvider) ? asComponent(this.fromComponentProvider(config.componentProvider, params, context)) :
                            asTemplate(defaultTemplate));
    };
    
    /**
     * Creates a template from a string or a function returning a string.
     *
     * @param template html template as a string or function that returns an html template as a string.
     * @param params Parameters to pass to the template function.
     *
     * @return {string|object} The template html as a string, or a promise for that
     * string.
     */
    TemplateFactory.prototype.fromString = function (template, params) {
        return _uirouter_core.isFunction(template) ? template(params) : template;
    };
    
    /**
     * Loads a template from the a URL via `$http` and `$templateCache`.
     *
     * @param {string|Function} url url of the template to load, or a function
     * that returns a url.
     * @param {Object} params Parameters to pass to the url function.
     * @return {string|Promise.<string>} The template html as a string, or a promise
     * for that string.
     */
    TemplateFactory.prototype.fromUrl = function (url, params) {
        if (_uirouter_core.isFunction(url))
            url = url(params);
        if (url == null)
            return null;
        if (this._useHttp) {
            return this.$http.get(url, { cache: this.$templateCache, headers: { Accept: 'text/html' } })
                .then(function (response) {
                return response.data;
            });
        }
        return this.$templateRequest(url);
    };
    
    /**
     * Creates a template by invoking an injectable provider function.
     *
     * @param provider Function to invoke via `locals`
     * @param {Function} injectFn a function used to invoke the template provider
     * @return {string|Promise.<string>} The template html as a string, or a promise
     * for that string.
     */
    TemplateFactory.prototype.fromProvider = function (provider, params, context) {
        var deps = _uirouter_core.services.$injector.annotate(provider);
        var providerFn = _uirouter_core.isArray(provider) ? _uirouter_core.tail(provider) : provider;
        var resolvable = new _uirouter_core.Resolvable("", providerFn, deps);
        return resolvable.get(context);
    };
    
    /**
     * Creates a component's template by invoking an injectable provider function.
     *
     * @param provider Function to invoke via `locals`
     * @param {Function} injectFn a function used to invoke the template provider
     * @return {string} The template html as a string: "<component-name input1='::$resolve.foo'></component-name>".
     */
    TemplateFactory.prototype.fromComponentProvider = function (provider, params, context) {
        var deps = _uirouter_core.services.$injector.annotate(provider);
        var providerFn = _uirouter_core.isArray(provider) ? _uirouter_core.tail(provider) : provider;
        var resolvable = new _uirouter_core.Resolvable("", providerFn, deps);
        return resolvable.get(context);
    };
    
    /**
     * Creates a template from a component's name
     *
     * This implements route-to-component.
     * It works by retrieving the component (directive) metadata from the injector.
     * It analyses the component's bindings, then constructs a template that instantiates the component.
     * The template wires input and output bindings to resolves or from the parent component.
     *
     * @param uiView {object} The parent ui-view (for binding outputs to callbacks)
     * @param context The ResolveContext (for binding outputs to callbacks returned from resolves)
     * @param component {string} Component's name in camel case.
     * @param bindings An object defining the component's bindings: {foo: '<'}
     * @return {string} The template as a string: "<component-name input1='::$resolve.foo'></component-name>".
     */
    TemplateFactory.prototype.makeComponentTemplate = function (uiView, context, component, bindings) {
        bindings = bindings || {};
        // Bind once prefix
        var prefix = ng.version.minor >= 3 ? "::" : "";
        // Convert to kebob name. Add x- prefix if the string starts with `x-` or `data-`
        var kebob = function (camelCase) {
            var kebobed = _uirouter_core.kebobString(camelCase);
            return /^(x|data)-/.exec(kebobed) ? "x-" + kebobed : kebobed;
        };
        var attributeTpl = function (input) {
            var name = input.name, type = input.type;
            var attrName = kebob(name);
            // If the ui-view has an attribute which matches a binding on the routed component
            // then pass that attribute through to the routed component template.
            // Prefer ui-view wired mappings to resolve data, unless the resolve was explicitly bound using `bindings:`
            if (uiView.attr(attrName) && !bindings[name])
                return attrName + "='" + uiView.attr(attrName) + "'";
            var resolveName = bindings[name] || name;
            // Pre-evaluate the expression for "@" bindings by enclosing in {{ }}
            // some-attr="{{ ::$resolve.someResolveName }}"
            if (type === '@')
                return attrName + "='{{" + prefix + "$resolve." + resolveName + "}}'";
            // Wire "&" callbacks to resolves that return a callback function
            // Get the result of the resolve (should be a function) and annotate it to get its arguments.
            // some-attr="$resolve.someResolveResultName(foo, bar)"
            if (type === '&') {
                var res = context.getResolvable(resolveName);
                var fn = res && res.data;
                var args = fn && _uirouter_core.services.$injector.annotate(fn) || [];
                // account for array style injection, i.e., ['foo', function(foo) {}]
                var arrayIdxStr = _uirouter_core.isArray(fn) ? "[" + (fn.length - 1) + "]" : '';
                return attrName + "='$resolve." + resolveName + arrayIdxStr + "(" + args.join(",") + ")'";
            }
            // some-attr="::$resolve.someResolveName"
            return attrName + "='" + prefix + "$resolve." + resolveName + "'";
        };
        var attrs = getComponentBindings(component).map(attributeTpl).join(" ");
        var kebobName = kebob(component);
        return "<" + kebobName + " " + attrs + "></" + kebobName + ">";
    };
    
    return TemplateFactory;
}());
// Gets all the directive(s)' inputs ('@', '=', and '<') and outputs ('&')
function getComponentBindings(name) {
    var cmpDefs = _uirouter_core.services.$injector.get(name + "Directive"); // could be multiple
    if (!cmpDefs || !cmpDefs.length)
        throw new Error("Unable to find component named '" + name + "'");
    return cmpDefs.map(getBindings).reduce(_uirouter_core.unnestR, []);
}
// Given a directive definition, find its object input attributes
// Use different properties, depending on the type of directive (component, bindToController, normal)
var getBindings = function (def) {
    if (_uirouter_core.isObject(def.bindToController))
        return scopeBindings(def.bindToController);
    return scopeBindings(def.scope);
};
// for ng 1.2 style, process the scope: { input: "=foo" }
// for ng 1.3 through ng 1.5, process the component's bindToController: { input: "=foo" } object
var scopeBindings = function (bindingsObj) { return Object.keys(bindingsObj || {})
    .map(function (key) { return [key, /^([=<@&])[?]?(.*)/.exec(bindingsObj[key])]; })
    .filter(function (tuple) { return _uirouter_core.isDefined(tuple) && _uirouter_core.isArray(tuple[1]); })
    .map(function (tuple) { return ({ name: tuple[1][2] || tuple[0], type: tuple[1][1] }); }); };

/** @module ng1 */ /** for typedoc */
/**
 * The Angular 1 `StateProvider`
 *
 * The `$stateProvider` works similar to Angular's v1 router, but it focuses purely
 * on state.
 *
 * A state corresponds to a "place" in the application in terms of the overall UI and
 * navigation. A state describes (via the controller / template / view properties) what
 * the UI looks like and does at that place.
 *
 * States often have things in common, and the primary way of factoring out these
 * commonalities in this model is via the state hierarchy, i.e. parent/child states aka
 * nested states.
 *
 * The `$stateProvider` provides interfaces to declare these states for your app.
 */
var StateProvider = (function () {
    function StateProvider(stateRegistry, stateService) {
        this.stateRegistry = stateRegistry;
        this.stateService = stateService;
        _uirouter_core.createProxyFunctions(_uirouter_core.val(StateProvider.prototype), this, _uirouter_core.val(this));
    }
    /**
     * Decorates states when they are registered
     *
     * Allows you to extend (carefully) or override (at your own peril) the
     * `stateBuilder` object used internally by [[StateRegistry]].
     * This can be used to add custom functionality to ui-router,
     * for example inferring templateUrl based on the state name.
     *
     * When passing only a name, it returns the current (original or decorated) builder
     * function that matches `name`.
     *
     * The builder functions that can be decorated are listed below. Though not all
     * necessarily have a good use case for decoration, that is up to you to decide.
     *
     * In addition, users can attach custom decorators, which will generate new
     * properties within the state's internal definition. There is currently no clear
     * use-case for this beyond accessing internal states (i.e. $state.$current),
     * however, expect this to become increasingly relevant as we introduce additional
     * meta-programming features.
     *
     * **Warning**: Decorators should not be interdependent because the order of
     * execution of the builder functions in non-deterministic. Builder functions
     * should only be dependent on the state definition object and super function.
     *
     *
     * Existing builder functions and current return values:
     *
     * - **parent** `{object}` - returns the parent state object.
     * - **data** `{object}` - returns state data, including any inherited data that is not
     *   overridden by own values (if any).
     * - **url** `{object}` - returns a {@link ui.router.util.type:UrlMatcher UrlMatcher}
     *   or `null`.
     * - **navigable** `{object}` - returns closest ancestor state that has a URL (aka is
     *   navigable).
     * - **params** `{object}` - returns an array of state params that are ensured to
     *   be a super-set of parent's params.
     * - **views** `{object}` - returns a views object where each key is an absolute view
     *   name (i.e. "viewName@stateName") and each value is the config object
     *   (template, controller) for the view. Even when you don't use the views object
     *   explicitly on a state config, one is still created for you internally.
     *   So by decorating this builder function you have access to decorating template
     *   and controller properties.
     * - **ownParams** `{object}` - returns an array of params that belong to the state,
     *   not including any params defined by ancestor states.
     * - **path** `{string}` - returns the full path from the root down to this state.
     *   Needed for state activation.
     * - **includes** `{object}` - returns an object that includes every state that
     *   would pass a `$state.includes()` test.
     *
     * #### Example:
     * Override the internal 'views' builder with a function that takes the state
     * definition, and a reference to the internal function being overridden:
     * ```js
     * $stateProvider.decorator('views', function (state, parent) {
     *   let result = {},
     *       views = parent(state);
     *
     *   angular.forEach(views, function (config, name) {
     *     let autoName = (state.name + '.' + name).replace('.', '/');
     *     config.templateUrl = config.templateUrl || '/partials/' + autoName + '.html';
     *     result[name] = config;
     *   });
     *   return result;
     * });
     *
     * $stateProvider.state('home', {
     *   views: {
     *     'contact.list': { controller: 'ListController' },
     *     'contact.item': { controller: 'ItemController' }
     *   }
     * });
     * ```
     *
     *
     * ```js
     * // Auto-populates list and item views with /partials/home/contact/list.html,
     * // and /partials/home/contact/item.html, respectively.
     * $state.go('home');
     * ```
     *
     * @param {string} name The name of the builder function to decorate.
     * @param {object} func A function that is responsible for decorating the original
     * builder function. The function receives two parameters:
     *
     *   - `{object}` - state - The state config object.
     *   - `{object}` - super - The original builder function.
     *
     * @return {object} $stateProvider - $stateProvider instance
     */
    StateProvider.prototype.decorator = function (name, func) {
        return this.stateRegistry.decorator(name, func) || this;
    };
    StateProvider.prototype.state = function (name, definition) {
        if (_uirouter_core.isObject(name)) {
            definition = name;
        }
        else {
            definition.name = name;
        }
        this.stateRegistry.register(definition);
        return this;
    };
    /**
     * Registers an invalid state handler
     *
     * This is a passthrough to [[StateService.onInvalid]] for ng1.
     */
    StateProvider.prototype.onInvalid = function (callback) {
        return this.stateService.onInvalid(callback);
    };
    return StateProvider;
}());

/** @module ng1 */ /** */
/**
 * This is a [[StateBuilder.builder]] function for angular1 `onEnter`, `onExit`,
 * `onRetain` callback hooks on a [[Ng1StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * ensures that those hooks are injectable for @uirouter/angularjs (ng1).
 */
var getStateHookBuilder = function (hookName) {
    return function stateHookBuilder(state, parentFn) {
        var hook = state[hookName];
        var pathname = hookName === 'onExit' ? 'from' : 'to';
        function decoratedNg1Hook(trans, state) {
            var resolveContext = new _uirouter_core.ResolveContext(trans.treeChanges(pathname));
            var locals = _uirouter_core.extend(getLocals(resolveContext), { $state$: state, $transition$: trans });
            return _uirouter_core.services.$injector.invoke(hook, this, locals);
        }
        return hook ? decoratedNg1Hook : undefined;
    };
};

/**
 * Implements UI-Router LocationServices and LocationConfig using Angular 1's $location service
 */
var Ng1LocationServices = (function () {
    function Ng1LocationServices($locationProvider) {
        // .onChange() registry
        this._urlListeners = [];
        this.$locationProvider = $locationProvider;
        var _lp = _uirouter_core.val($locationProvider);
        _uirouter_core.createProxyFunctions(_lp, this, _lp, ['hashPrefix']);
    }
    Ng1LocationServices.prototype.dispose = function () { };
    Ng1LocationServices.prototype.onChange = function (callback) {
        var _this = this;
        this._urlListeners.push(callback);
        return function () { return _uirouter_core.removeFrom(_this._urlListeners)(callback); };
    };
    Ng1LocationServices.prototype.html5Mode = function () {
        var html5Mode = this.$locationProvider.html5Mode();
        html5Mode = _uirouter_core.isObject(html5Mode) ? html5Mode.enabled : html5Mode;
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
        var _loc = _uirouter_core.val($location);
        var _browser = _uirouter_core.val($browser);
        // Bind these LocationService functions to $location
        _uirouter_core.createProxyFunctions(_loc, this, _loc, ["replace", "path", "search", "hash"]);
        // Bind these LocationConfig functions to $location
        _uirouter_core.createProxyFunctions(_loc, this, _loc, ['port', 'protocol', 'host']);
        // Bind these LocationConfig functions to $browser
        _uirouter_core.createProxyFunctions(_browser, this, _browser, ['baseHref']);
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
        pathType.encode = function (val$$1) {
            return val$$1 != null ? val$$1.toString().replace(/(~|\/)/g, function (m) { return ({ '~': '~~', '/': '~2F' }[m]); }) : val$$1;
        };
        pathType.decode = function (val$$1) {
            return val$$1 != null ? val$$1.toString().replace(/(~~|~2F)/g, function (m) { return ({ '~~': '~', '~2F': '/' }[m]); }) : val$$1;
        };
    };
    return Ng1LocationServices;
}());

/** @module url */ /** */
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
        if (!_uirouter_core.isFunction(ruleFn))
            throw new Error("'rule' must be a function");
        var match = function () {
            return ruleFn(_uirouter_core.services.$injector, _this._router.locationService);
        };
        var rule = new _uirouter_core.BaseUrlRule(match, _uirouter_core.identity);
        this._urlRouter.rule(rule);
        return this;
    };
    
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
        if (_uirouter_core.isString(rule)) {
            urlRouter.otherwise(rule);
        }
        else if (_uirouter_core.isFunction(rule)) {
            urlRouter.otherwise(function () { return rule(_uirouter_core.services.$injector, _this._router.locationService); });
        }
        else {
            throw new Error("'rule' must be a string or function");
        }
        return this;
    };
    
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
        if (_uirouter_core.isArray(handler) || _uirouter_core.isFunction(handler)) {
            handler = UrlRouterProvider.injectableHandler(this._router, handler);
        }
        this._urlRouter.when(what, handler);
        return this;
    };
    
    UrlRouterProvider.injectableHandler = function (router, handler) {
        return function (match) {
            return _uirouter_core.services.$injector.invoke(handler, null, { $match: match, $stateParams: router.globals.params });
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
    
    return UrlRouterProvider;
}());

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
ng.module("ui.router.angular1", []);
var mod_init = ng.module('ui.router.init', []);
var mod_util = ng.module('ui.router.util', ['ng', 'ui.router.init']);
var mod_rtr = ng.module('ui.router.router', ['ui.router.util']);
var mod_state = ng.module('ui.router.state', ['ui.router.router', 'ui.router.util', 'ui.router.angular1']);
var mod_main = ng.module('ui.router', ['ui.router.init', 'ui.router.state', 'ui.router.angular1']);
var mod_cmpt = ng.module('ui.router.compat', ['ui.router']); // tslint:disable-line
var router = null;
$uiRouter.$inject = ['$locationProvider'];
/** This angular 1 provider instantiates a Router and exposes its services via the angular injector */
function $uiRouter($locationProvider) {
    // Create a new instance of the Router when the $uiRouterProvider is initialized
    router = this.router = new _uirouter_core.UIRouter();
    router.stateProvider = new StateProvider(router.stateRegistry, router.stateService);
    // Apply ng1 specific StateBuilder code for `views`, `resolve`, and `onExit/Retain/Enter` properties
    router.stateRegistry.decorator("views", ng1ViewsBuilder);
    router.stateRegistry.decorator("onExit", getStateHookBuilder("onExit"));
    router.stateRegistry.decorator("onRetain", getStateHookBuilder("onRetain"));
    router.stateRegistry.decorator("onEnter", getStateHookBuilder("onEnter"));
    router.viewService._pluginapi._viewConfigFactory('ng1', getNg1ViewConfigFactory());
    var ng1LocationService = router.locationService = router.locationConfig = new Ng1LocationServices($locationProvider);
    Ng1LocationServices.monkeyPatchPathParameterType(router);
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
    _uirouter_core.services.$injector = $injector;
    _uirouter_core.services.$q = $q;
    // The $injector is now available.
    // Find any resolvables that had dependency annotation deferred
    $uiRouter.stateRegistry.get()
        .map(function (x) { return x.$$state().resolvables; })
        .reduce(_uirouter_core.unnestR, [])
        .filter(function (x) { return x.deps === "deferred"; })
        .forEach(function (resolvable) { return resolvable.deps = $injector.annotate(resolvable.resolveFn, $injector.strictDi); });
}
// $urlRouter service and $urlRouterProvider
var getUrlRouterProvider = function (uiRouter) {
    return uiRouter.urlRouterProvider = new UrlRouterProvider(uiRouter);
};
// $state service and $stateProvider
// $urlRouter service and $urlRouterProvider
var getStateProvider = function () {
    return _uirouter_core.extend(router.stateProvider, { $get: function () { return router.stateService; } });
};
watchDigests.$inject = ['$rootScope'];
function watchDigests($rootScope) {
    $rootScope.$watch(function () { _uirouter_core.trace.approximateDigests++; });
}
mod_init.provider("$uiRouter", $uiRouter);
mod_rtr.provider('$urlRouter', ['$uiRouterProvider', getUrlRouterProvider]);
mod_util.provider('$urlService', getProviderFor('urlService'));
mod_util.provider('$urlMatcherFactory', ['$uiRouterProvider', function () { return router.urlMatcherFactory; }]);
mod_util.provider('$templateFactory', function () { return new TemplateFactory(); });
mod_state.provider('$stateRegistry', getProviderFor('stateRegistry'));
mod_state.provider('$uiRouterGlobals', getProviderFor('globals'));
mod_state.provider('$transitions', getProviderFor('transitionService'));
mod_state.provider('$state', ['$uiRouterProvider', getStateProvider]);
mod_state.factory('$stateParams', ['$uiRouter', function ($uiRouter) { return $uiRouter.globals.params; }]);
mod_main.factory('$view', function () { return router.viewService; });
mod_main.service("$trace", function () { return _uirouter_core.trace; });
mod_main.run(watchDigests);
mod_util.run(['$urlMatcherFactory', function ($urlMatcherFactory) { }]);
mod_state.run(['$state', function ($state) { }]);
mod_rtr.run(['$urlRouter', function ($urlRouter) { }]);
mod_init.run(runBlock);
/** @hidden TODO: find a place to move this */
var getLocals = function (ctx) {
    var tokens = ctx.getTokens().filter(_uirouter_core.isString);
    var tuples = tokens.map(function (key) {
        var resolvable = ctx.getResolvable(key);
        var waitPolicy = ctx.getPolicy(resolvable).async;
        return [key, waitPolicy === 'NOWAIT' ? resolvable.promise : resolvable.data];
    });
    return tuples.reduce(_uirouter_core.applyPairs, {});
};

/**
 * # Angular 1 injectable services
 *
 * This is a list of the objects which can be injected using angular's injector.
 *
 * There are three different kind of injectable objects:
 *
 * ## **Provider** objects
 * #### injectable into a `.config()` block during configtime
 *
 * - [[$uiRouterProvider]]: The UI-Router instance
 * - [[$stateProvider]]: State registration
 * - [[$transitionsProvider]]: Transition hooks
 * - [[$urlServiceProvider]]: All URL related public APIs
 *
 * - [[$uiViewScrollProvider]]: Disable ui-router view scrolling
 * - [[$urlRouterProvider]]: (deprecated) Url matching rules
 * - [[$urlMatcherFactoryProvider]]: (deprecated) Url parsing config
 *
 * ## **Service** objects
 * #### injectable globally during runtime
 *
 * - [[$uiRouter]]: The UI-Router instance
 * - [[$trace]]: Enable transition trace/debug
 * - [[$transitions]]: Transition hooks
 * - [[$state]]: Imperative state related APIs
 * - [[$stateRegistry]]: State registration
 * - [[$urlService]]: All URL related public APIs
 * - [[$uiRouterGlobals]]: Global variables
 * - [[$uiViewScroll]]: Scroll an element into view
 *
 * - [[$stateParams]]: (deprecated) Global state param values
 * - [[$urlRouter]]: (deprecated) URL synchronization
 * - [[$urlMatcherFactory]]: (deprecated) URL parsing config
 *
 * ## **Per-Transition** objects
 *
 * - These kind of objects are injectable into:
 *   - Resolves ([[Ng1StateDeclaration.resolve]]),
 *   - Transition Hooks ([[TransitionService.onStart]], etc),
 *   - Routed Controllers ([[Ng1ViewDeclaration.controller]])
 *
 * #### Different instances are injected based on the [[Transition]]
 *
 * - [[$transition$]]: The current Transition object
 * - [[$stateParams]]: State param values for pending Transition (deprecated)
 * - Any resolve data defined using [[Ng1StateDeclaration.resolve]]
 *
 * @ng1api
 * @preferred
 * @module injectables
 */ /** */
/**
 * The current (or pending) State Parameters
 *
 * An injectable global **Service Object** which holds the state parameters for the latest **SUCCESSFUL** transition.
 *
 * The values are not updated until *after* a `Transition` successfully completes.
 *
 * **Also:** an injectable **Per-Transition Object** object which holds the pending state parameters for the pending `Transition` currently running.
 *
 * ### Deprecation warning:
 *
 * The value injected for `$stateParams` is different depending on where it is injected.
 *
 * - When injected into an angular service, the object injected is the global **Service Object** with the parameter values for the latest successful `Transition`.
 * - When injected into transition hooks, resolves, or view controllers, the object is the **Per-Transition Object** with the parameter values for the running `Transition`.
 *
 * Because of these confusing details, this service is deprecated.
 *
 * ### Instead of using the global `$stateParams` service object,
 * inject [[$uiRouterGlobals]] and use [[UIRouterGlobals.params]]
 *
 * ```js
 * MyService.$inject = ['$uiRouterGlobals'];
 * function MyService($uiRouterGlobals) {
 *   return {
 *     paramValues: function () {
 *       return $uiRouterGlobals.params;
 *     }
 *   }
 * }
 * ```
 *
 * ### Instead of using the per-transition `$stateParams` object,
 * inject the current `Transition` (as [[$transition$]]) and use [[Transition.params]]
 *
 * ```js
 * MyController.$inject = ['$transition$'];
 * function MyController($transition$) {
 *   var username = $transition$.params().username;
 *   // .. do something with username
 * }
 * ```
 *
 * ---
 *
 * This object can be injected into other services.
 *
 * #### Deprecated Example:
 * ```js
 * SomeService.$inject = ['$http', '$stateParams'];
 * function SomeService($http, $stateParams) {
 *   return {
 *     getUser: function() {
 *       return $http.get('/api/users/' + $stateParams.username);
 *     }
 *   }
 * };
 * angular.service('SomeService', SomeService);
 * ```
 * @deprecated
 */

/**
 * # Angular 1 Directives
 *
 * These are the directives included in UI-Router for Angular 1.
 * These directives are used in templates to create viewports and link/navigate to states.
 *
 * @ng1api
 * @preferred
 * @module directives
 */ /** for typedoc */
/** @hidden */
function parseStateRef(ref) {
    var paramsOnly = ref.match(/^\s*({[^}]*})\s*$/), parsed;
    if (paramsOnly)
        ref = '(' + paramsOnly[1] + ')';
    parsed = ref.replace(/\n/g, " ").match(/^\s*([^(]*?)\s*(\((.*)\))?\s*$/);
    if (!parsed || parsed.length !== 4)
        throw new Error("Invalid state ref '" + ref + "'");
    return { state: parsed[1] || null, paramExpr: parsed[3] || null };
}
/** @hidden */
function stateContext(el) {
    var $uiView = el.parent().inheritedData('$uiView');
    var path = _uirouter_core.parse('$cfg.path')($uiView);
    return path ? _uirouter_core.tail(path).state.name : undefined;
}
/** @hidden */
function processedDef($state, $element, def) {
    var uiState = def.uiState || $state.current.name;
    var uiStateOpts = _uirouter_core.extend(defaultOpts($element, $state), def.uiStateOpts || {});
    var href = $state.href(uiState, def.uiStateParams, uiStateOpts);
    return { uiState: uiState, uiStateParams: def.uiStateParams, uiStateOpts: uiStateOpts, href: href };
}
/** @hidden */
function getTypeInfo(el) {
    // SVGAElement does not use the href attribute, but rather the 'xlinkHref' attribute.
    var isSvg = Object.prototype.toString.call(el.prop('href')) === '[object SVGAnimatedString]';
    var isForm = el[0].nodeName === "FORM";
    return {
        attr: isForm ? "action" : (isSvg ? 'xlink:href' : 'href'),
        isAnchor: el.prop("tagName").toUpperCase() === "A",
        clickable: !isForm
    };
}
/** @hidden */
function clickHook(el, $state, $timeout, type, getDef) {
    return function (e) {
        var button = e.which || e.button, target = getDef();
        if (!(button > 1 || e.ctrlKey || e.metaKey || e.shiftKey || el.attr('target'))) {
            // HACK: This is to allow ng-clicks to be processed before the transition is initiated:
            var transition = $timeout(function () {
                $state.go(target.uiState, target.uiStateParams, target.uiStateOpts);
            });
            e.preventDefault();
            // if the state has no URL, ignore one preventDefault from the <a> directive.
            var ignorePreventDefaultCount = type.isAnchor && !target.href ? 1 : 0;
            e.preventDefault = function () {
                if (ignorePreventDefaultCount-- <= 0)
                    $timeout.cancel(transition);
            };
        }
    };
}
/** @hidden */
function defaultOpts(el, $state) {
    return {
        relative: stateContext(el) || $state.$current,
        inherit: true,
        source: "sref"
    };
}
/** @hidden */
function bindEvents(element, scope, hookFn, uiStateOpts) {
    var events;
    if (uiStateOpts) {
        events = uiStateOpts.events;
    }
    if (!_uirouter_core.isArray(events)) {
        events = ['click'];
    }
    var on = element.on ? 'on' : 'bind';
    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
        var event_1 = events_1[_i];
        element[on](event_1, hookFn);
    }
    scope.$on('$destroy', function () {
        var off = element.off ? 'off' : 'unbind';
        for (var _i = 0, events_2 = events; _i < events_2.length; _i++) {
            var event_2 = events_2[_i];
            element[off](event_2, hookFn);
        }
    });
}
/**
 * `ui-sref`: A directive for linking to a state
 *
 * A directive which links to a state (and optionally, parameters).
 * When clicked, this directive activates the linked state with the supplied parameter values.
 *
 * ### Linked State
 * The attribute value of the `ui-sref` is the name of the state to link to.
 *
 * #### Example:
 * This will activate the `home` state when the link is clicked.
 * ```html
 * <a ui-sref="home">Home</a>
 * ```
 *
 * ### Relative Links
 * You can also use relative state paths within `ui-sref`, just like a relative path passed to `$state.go()` ([[StateService.go]]).
 * You just need to be aware that the path is relative to the state that *created* the link.
 * This allows a state to create a relative `ui-sref` which always targets the same destination.
 *
 * #### Example:
 * Both these links are relative to the parent state, even when a child state is currently active.
 * ```html
 * <a ui-sref=".child1">child 1 state</a>
 * <a ui-sref=".child2">child 2 state</a>
 * ```
 *
 * This link activates the parent state.
 * ```html
 * <a ui-sref="^">Return</a>
 * ```
 *
 * ### hrefs
 * If the linked state has a URL, the directive will automatically generate and
 * update the `href` attribute (using the [[StateService.href]]  method).
 *
 * #### Example:
 * Assuming the `users` state has a url of `/users/`
 * ```html
 * <a ui-sref="users" href="/users/">Users</a>
 * ```
 *
 * ### Parameter Values
 * In addition to the state name, a `ui-sref` can include parameter values which are applied when activating the state.
 * Param values can be provided in the `ui-sref` value after the state name, enclosed by parentheses.
 * The content inside the parentheses is an expression, evaluated to the parameter values.
 *
 * #### Example:
 * This example renders a list of links to users.
 * The state's `userId` parameter value comes from each user's `user.id` property.
 * ```html
 * <li ng-repeat="user in users">
 *   <a ui-sref="users.detail({ userId: user.id })">{{ user.displayName }}</a>
 * </li>
 * ```
 *
 * Note:
 * The parameter values expression is `$watch`ed for updates.
 *
 * ### Transition Options
 * You can specify [[TransitionOptions]] to pass to [[StateService.go]] by using the `ui-sref-opts` attribute.
 * Options are restricted to `location`, `inherit`, and `reload`.
 *
 * #### Example:
 * ```html
 * <a ui-sref="home" ui-sref-opts="{ reload: true }">Home</a>
 * ```
 *
 * ### Other DOM Events
 *
 * You can also customize which DOM events to respond to (instead of `click`) by
 * providing an `events` array in the `ui-sref-opts` attribute.
 *
 * #### Example:
 * ```html
 * <input type="text" ui-sref="contacts" ui-sref-opts="{ events: ['change', 'blur'] }">
 * ```
 *
 * ### Highlighting the active link
 * This directive can be used in conjunction with [[uiSrefActive]] to highlight the active link.
 *
 * ### Examples
 * If you have the following template:
 *
 * ```html
 * <a ui-sref="home">Home</a>
 * <a ui-sref="about">About</a>
 * <a ui-sref="{page: 2}">Next page</a>
 *
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a ui-sref="contacts.detail({ id: contact.id })">{{ contact.name }}</a>
 *     </li>
 * </ul>
 * ```
 *
 * Then (assuming the current state is `contacts`) the rendered html including hrefs would be:
 *
 * ```html
 * <a href="#/home" ui-sref="home">Home</a>
 * <a href="#/about" ui-sref="about">About</a>
 * <a href="#/contacts?page=2" ui-sref="{page: 2}">Next page</a>
 *
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/1" ui-sref="contacts.detail({ id: contact.id })">Joe</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/2" ui-sref="contacts.detail({ id: contact.id })">Alice</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/3" ui-sref="contacts.detail({ id: contact.id })">Bob</a>
 *     </li>
 * </ul>
 *
 * <a href="#/home" ui-sref="home" ui-sref-opts="{reload: true}">Home</a>
 * ```
 *
 * ### Notes
 *
 * - You can use `ui-sref` to change **only the parameter values** by omitting the state name and parentheses.
 * #### Example:
 * Sets the `lang` parameter to `en` and remains on the same state.
 *
 * ```html
 * <a ui-sref="{ lang: 'en' }">English</a>
 * ```
 *
 * - A middle-click, right-click, or ctrl-click is handled (natively) by the browser to open the href in a new window, for example.
 *
 * - Unlike the parameter values expression, the state name is not `$watch`ed (for performance reasons).
 * If you need to dynamically update the state being linked to, use the fully dynamic [[uiState]] directive.
 */
var uiSref;
uiSref = ['$uiRouter', '$timeout',
    function $StateRefDirective($uiRouter, $timeout) {
        var $state = $uiRouter.stateService;
        return {
            restrict: 'A',
            require: ['?^uiSrefActive', '?^uiSrefActiveEq'],
            link: function (scope, element, attrs, uiSrefActive) {
                var type = getTypeInfo(element);
                var active = uiSrefActive[1] || uiSrefActive[0];
                var unlinkInfoFn = null;
                var hookFn;
                var rawDef = {};
                var getDef = function () { return processedDef($state, element, rawDef); };
                var ref = parseStateRef(attrs.uiSref);
                rawDef.uiState = ref.state;
                rawDef.uiStateOpts = attrs.uiSrefOpts ? scope.$eval(attrs.uiSrefOpts) : {};
                function update() {
                    var def = getDef();
                    if (unlinkInfoFn)
                        unlinkInfoFn();
                    if (active)
                        unlinkInfoFn = active.$$addStateInfo(def.uiState, def.uiStateParams);
                    if (def.href != null)
                        attrs.$set(type.attr, def.href);
                }
                if (ref.paramExpr) {
                    scope.$watch(ref.paramExpr, function (val$$1) {
                        rawDef.uiStateParams = _uirouter_core.extend({}, val$$1);
                        update();
                    }, true);
                    rawDef.uiStateParams = _uirouter_core.extend({}, scope.$eval(ref.paramExpr));
                }
                update();
                scope.$on('$destroy', $uiRouter.stateRegistry.onStatesChanged(update));
                scope.$on('$destroy', $uiRouter.transitionService.onSuccess({}, update));
                if (!type.clickable)
                    return;
                hookFn = clickHook(element, $state, $timeout, type, getDef);
                bindEvents(element, scope, hookFn, rawDef.uiStateOpts);
            }
        };
    }];
/**
 * `ui-state`: A fully dynamic directive for linking to a state
 *
 * A directive which links to a state (and optionally, parameters).
 * When clicked, this directive activates the linked state with the supplied parameter values.
 *
 * **This directive is very similar to [[uiSref]], but it `$observe`s and `$watch`es/evaluates all its inputs.**
 *
 * A directive which links to a state (and optionally, parameters).
 * When clicked, this directive activates the linked state with the supplied parameter values.
 *
 * ### Linked State
 * The attribute value of `ui-state` is an expression which is `$watch`ed and evaluated as the state to link to.
 * **This is in contrast with `ui-sref`, which takes a state name as a string literal.**
 *
 * #### Example:
 * Create a list of links.
 * ```html
 * <li ng-repeat="link in navlinks">
 *   <a ui-state="link.state">{{ link.displayName }}</a>
 * </li>
 * ```
 *
 * ### Relative Links
 * If the expression evaluates to a relative path, it is processed like [[uiSref]].
 * You just need to be aware that the path is relative to the state that *created* the link.
 * This allows a state to create relative `ui-state` which always targets the same destination.
 *
 * ### hrefs
 * If the linked state has a URL, the directive will automatically generate and
 * update the `href` attribute (using the [[StateService.href]]  method).
 *
 * ### Parameter Values
 * In addition to the state name expression, a `ui-state` can include parameter values which are applied when activating the state.
 * Param values should be provided using the `ui-state-params` attribute.
 * The `ui-state-params` attribute value is `$watch`ed and evaluated as an expression.
 *
 * #### Example:
 * This example renders a list of links with param values.
 * The state's `userId` parameter value comes from each user's `user.id` property.
 * ```html
 * <li ng-repeat="link in navlinks">
 *   <a ui-state="link.state" ui-state-params="link.params">{{ link.displayName }}</a>
 * </li>
 * ```
 *
 * ### Transition Options
 * You can specify [[TransitionOptions]] to pass to [[StateService.go]] by using the `ui-state-opts` attribute.
 * Options are restricted to `location`, `inherit`, and `reload`.
 * The value of the `ui-state-opts` is `$watch`ed and evaluated as an expression.
 *
 * #### Example:
 * ```html
 * <a ui-state="returnto.state" ui-state-opts="{ reload: true }">Home</a>
 * ```
 *
 * ### Other DOM Events
 *
 * You can also customize which DOM events to respond to (instead of `click`) by
 * providing an `events` array in the `ui-state-opts` attribute.
 *
 * #### Example:
 * ```html
 * <input type="text" ui-state="contacts" ui-state-opts="{ events: ['change', 'blur'] }">
 * ```
 *
 * ### Highlighting the active link
 * This directive can be used in conjunction with [[uiSrefActive]] to highlight the active link.
 *
 * ### Notes
 *
 * - You can use `ui-params` to change **only the parameter values** by omitting the state name and supplying only `ui-state-params`.
 *   However, it might be simpler to use [[uiSref]] parameter-only links.
 *
 * #### Example:
 * Sets the `lang` parameter to `en` and remains on the same state.
 *
 * ```html
 * <a ui-state="" ui-state-params="{ lang: 'en' }">English</a>
 * ```
 *
 * - A middle-click, right-click, or ctrl-click is handled (natively) by the browser to open the href in a new window, for example.
 * ```
 */
var uiState;
uiState = ['$uiRouter', '$timeout',
    function $StateRefDynamicDirective($uiRouter, $timeout) {
        var $state = $uiRouter.stateService;
        return {
            restrict: 'A',
            require: ['?^uiSrefActive', '?^uiSrefActiveEq'],
            link: function (scope, element, attrs, uiSrefActive) {
                var type = getTypeInfo(element);
                var active = uiSrefActive[1] || uiSrefActive[0];
                var unlinkInfoFn = null;
                var hookFn;
                var rawDef = {};
                var getDef = function () { return processedDef($state, element, rawDef); };
                var inputAttrs = ['uiState', 'uiStateParams', 'uiStateOpts'];
                var watchDeregFns = inputAttrs.reduce(function (acc, attr) { return (acc[attr] = _uirouter_core.noop, acc); }, {});
                function update() {
                    var def = getDef();
                    if (unlinkInfoFn)
                        unlinkInfoFn();
                    if (active)
                        unlinkInfoFn = active.$$addStateInfo(def.uiState, def.uiStateParams);
                    if (def.href != null)
                        attrs.$set(type.attr, def.href);
                }
                inputAttrs.forEach(function (field) {
                    rawDef[field] = attrs[field] ? scope.$eval(attrs[field]) : null;
                    attrs.$observe(field, function (expr) {
                        watchDeregFns[field]();
                        watchDeregFns[field] = scope.$watch(expr, function (newval) {
                            rawDef[field] = newval;
                            update();
                        }, true);
                    });
                });
                update();
                scope.$on('$destroy', $uiRouter.stateRegistry.onStatesChanged(update));
                scope.$on('$destroy', $uiRouter.transitionService.onSuccess({}, update));
                if (!type.clickable)
                    return;
                hookFn = clickHook(element, $state, $timeout, type, getDef);
                bindEvents(element, scope, hookFn, rawDef.uiStateOpts);
            }
        };
    }];
/**
 * `ui-sref-active` and `ui-sref-active-eq`: A directive that adds a CSS class when a `ui-sref` is active
 *
 * A directive working alongside [[uiSref]] and [[uiState]] to add classes to an element when the
 * related directive's state is active (and remove them when it is inactive).
 *
 * The primary use-case is to highlight the active link in navigation menus,
 * distinguishing it from the inactive menu items.
 *
 * ### Linking to a `ui-sref` or `ui-state`
 * `ui-sref-active` can live on the same element as `ui-sref`/`ui-state`, or it can be on a parent element.
 * If a `ui-sref-active` is a parent to more than one `ui-sref`/`ui-state`, it will apply the CSS class when **any of the links are active**.
 *
 * ### Matching
 *
 * The `ui-sref-active` directive applies the CSS class when the `ui-sref`/`ui-state`'s target state **or any child state is active**.
 * This is a "fuzzy match" which uses [[StateService.includes]].
 *
 * The `ui-sref-active-eq` directive applies the CSS class when the `ui-sref`/`ui-state`'s target state is directly active (not when child states are active).
 * This is an "exact match" which uses [[StateService.is]].
 *
 * ### Parameter values
 * If the `ui-sref`/`ui-state` includes parameter values, the current parameter values must match the link's values for the link to be highlighted.
 * This allows a list of links to the same state with different parameters to be rendered, and the correct one highlighted.
 *
 * #### Example:
 * ```html
 * <li ng-repeat="user in users" ui-sref-active="active">
 *   <a ui-sref="user.details({ userId: user.id })">{{ user.lastName }}</a>
 * </li>
 * ```
 *
 * ### Examples
 *
 * Given the following template:
 * #### Example:
 * ```html
 * <ul>
 *   <li ui-sref-active="active" class="item">
 *     <a href ui-sref="app.user({user: 'bilbobaggins'})">@bilbobaggins</a>
 *   </li>
 * </ul>
 * ```
 *
 * When the app state is `app.user` (or any child state),
 * and contains the state parameter "user" with value "bilbobaggins",
 * the resulting HTML will appear as (note the 'active' class):
 *
 * ```html
 * <ul>
 *   <li ui-sref-active="active" class="item active">
 *     <a ui-sref="app.user({user: 'bilbobaggins'})" href="/users/bilbobaggins">@bilbobaggins</a>
 *   </li>
 * </ul>
 * ```
 *
 * ### Glob mode
 *
 * It is possible to pass `ui-sref-active` an expression that evaluates to an object.
 * The objects keys represent active class names and values represent the respective state names/globs.
 * `ui-sref-active` will match if the current active state **includes** any of
 * the specified state names/globs, even the abstract ones.
 *
 * #### Example:
 * Given the following template, with "admin" being an abstract state:
 * ```html
 * <div ui-sref-active="{'active': 'admin.**'}">
 *   <a ui-sref-active="active" ui-sref="admin.roles">Roles</a>
 * </div>
 * ```
 *
 * When the current state is "admin.roles" the "active" class will be applied to both the <div> and <a> elements.
 * It is important to note that the state names/globs passed to `ui-sref-active` override any state provided by a linked `ui-sref`.
 *
 * ### Notes:
 *
 * - The class name is interpolated **once** during the directives link time (any further changes to the
 * interpolated value are ignored).
 *
 * - Multiple classes may be specified in a space-separated format: `ui-sref-active='class1 class2 class3'`
 */
var uiSrefActive;
uiSrefActive = ['$state', '$stateParams', '$interpolate', '$uiRouter',
    function $StateRefActiveDirective($state, $stateParams, $interpolate, $uiRouter) {
        return {
            restrict: "A",
            controller: ['$scope', '$element', '$attrs',
                function ($scope, $element, $attrs) {
                    var states = [], activeEqClass, uiSrefActive;
                    // There probably isn't much point in $observing this
                    // uiSrefActive and uiSrefActiveEq share the same directive object with some
                    // slight difference in logic routing
                    activeEqClass = $interpolate($attrs.uiSrefActiveEq || '', false)($scope);
                    try {
                        uiSrefActive = $scope.$eval($attrs.uiSrefActive);
                    }
                    catch (e) {
                        // Do nothing. uiSrefActive is not a valid expression.
                        // Fall back to using $interpolate below
                    }
                    uiSrefActive = uiSrefActive || $interpolate($attrs.uiSrefActive || '', false)($scope);
                    if (_uirouter_core.isObject(uiSrefActive)) {
                        _uirouter_core.forEach(uiSrefActive, function (stateOrName, activeClass) {
                            if (_uirouter_core.isString(stateOrName)) {
                                var ref = parseStateRef(stateOrName);
                                addState(ref.state, $scope.$eval(ref.paramExpr), activeClass);
                            }
                        });
                    }
                    // Allow uiSref to communicate with uiSrefActive[Equals]
                    this.$$addStateInfo = function (newState, newParams) {
                        // we already got an explicit state provided by ui-sref-active, so we
                        // shadow the one that comes from ui-sref
                        if (_uirouter_core.isObject(uiSrefActive) && states.length > 0) {
                            return;
                        }
                        var deregister = addState(newState, newParams, uiSrefActive);
                        update();
                        return deregister;
                    };
                    function updateAfterTransition(trans) {
                        trans.promise.then(update, _uirouter_core.noop);
                    }
                    $scope.$on('$stateChangeSuccess', update);
                    $scope.$on('$destroy', $uiRouter.transitionService.onStart({}, updateAfterTransition));
                    if ($uiRouter.globals.transition) {
                        updateAfterTransition($uiRouter.globals.transition);
                    }
                    function addState(stateName, stateParams, activeClass) {
                        var state = $state.get(stateName, stateContext($element));
                        var stateInfo = {
                            state: state || { name: stateName },
                            params: stateParams,
                            activeClass: activeClass
                        };
                        states.push(stateInfo);
                        return function removeState() {
                            _uirouter_core.removeFrom(states)(stateInfo);
                        };
                    }
                    // Update route state
                    function update() {
                        var splitClasses = function (str) {
                            return str.split(/\s/).filter(_uirouter_core.identity);
                        };
                        var getClasses = function (stateList) {
                            return stateList.map(function (x) { return x.activeClass; }).map(splitClasses).reduce(_uirouter_core.unnestR, []);
                        };
                        var allClasses = getClasses(states).concat(splitClasses(activeEqClass)).reduce(_uirouter_core.uniqR, []);
                        var fuzzyClasses = getClasses(states.filter(function (x) { return $state.includes(x.state.name, x.params); }));
                        var exactlyMatchesAny = !!states.filter(function (x) { return $state.is(x.state.name, x.params); }).length;
                        var exactClasses = exactlyMatchesAny ? splitClasses(activeEqClass) : [];
                        var addClasses = fuzzyClasses.concat(exactClasses).reduce(_uirouter_core.uniqR, []);
                        var removeClasses = allClasses.filter(function (cls) { return !_uirouter_core.inArray(addClasses, cls); });
                        $scope.$evalAsync(function () {
                            addClasses.forEach(function (className) { return $element.addClass(className); });
                            removeClasses.forEach(function (className) { return $element.removeClass(className); });
                        });
                    }
                    update();
                }]
        };
    }];
ng.module('ui.router.state')
    .directive('uiSref', uiSref)
    .directive('uiSrefActive', uiSrefActive)
    .directive('uiSrefActiveEq', uiSrefActive)
    .directive('uiState', uiState);

/** @module ng1 */ /** for typedoc */
/**
 * `isState` Filter: truthy if the current state is the parameter
 *
 * Translates to [[StateService.is]] `$state.is("stateName")`.
 *
 * #### Example:
 * ```html
 * <div ng-if="'stateName' | isState">show if state is 'stateName'</div>
 * ```
 */
$IsStateFilter.$inject = ['$state'];
function $IsStateFilter($state) {
    var isFilter = function (state, params, options) {
        return $state.is(state, params, options);
    };
    isFilter.$stateful = true;
    return isFilter;
}
/**
 * `includedByState` Filter: truthy if the current state includes the parameter
 *
 * Translates to [[StateService.includes]]` $state.is("fullOrPartialStateName")`.
 *
 * #### Example:
 * ```html
 * <div ng-if="'fullOrPartialStateName' | includedByState">show if state includes 'fullOrPartialStateName'</div>
 * ```
 */
$IncludedByStateFilter.$inject = ['$state'];
function $IncludedByStateFilter($state) {
    var includesFilter = function (state, params, options) {
        return $state.includes(state, params, options);
    };
    includesFilter.$stateful = true;
    return includesFilter;
}
ng.module('ui.router.state')
    .filter('isState', $IsStateFilter)
    .filter('includedByState', $IncludedByStateFilter);

/**
 * @ng1api
 * @module directives
 */ /** for typedoc */
/**
 * `ui-view`: A viewport directive which is filled in by a view from the active state.
 *
 * ### Attributes
 *
 * - `name`: (Optional) A view name.
 *   The name should be unique amongst the other views in the same state.
 *   You can have views of the same name that live in different states.
 *   The ui-view can be targeted in a View using the name ([[Ng1StateDeclaration.views]]).
 *
 * - `autoscroll`: an expression. When it evaluates to true, the `ui-view` will be scrolled into view when it is activated.
 *   Uses [[$uiViewScroll]] to do the scrolling.
 *
 * - `onload`: Expression to evaluate whenever the view updates.
 *
 * #### Example:
 * A view can be unnamed or named.
 * ```html
 * <!-- Unnamed -->
 * <div ui-view></div>
 *
 * <!-- Named -->
 * <div ui-view="viewName"></div>
 *
 * <!-- Named (different style) -->
 * <ui-view name="viewName"></ui-view>
 * ```
 *
 * You can only have one unnamed view within any template (or root html). If you are only using a
 * single view and it is unnamed then you can populate it like so:
 *
 * ```html
 * <div ui-view></div>
 * $stateProvider.state("home", {
 *   template: "<h1>HELLO!</h1>"
 * })
 * ```
 *
 * The above is a convenient shortcut equivalent to specifying your view explicitly with the
 * [[Ng1StateDeclaration.views]] config property, by name, in this case an empty name:
 *
 * ```js
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }
 * })
 * ```
 *
 * But typically you'll only use the views property if you name your view or have more than one view
 * in the same template. There's not really a compelling reason to name a view if its the only one,
 * but you could if you wanted, like so:
 *
 * ```html
 * <div ui-view="main"></div>
 * ```
 *
 * ```js
 * $stateProvider.state("home", {
 *   views: {
 *     "main": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }
 * })
 * ```
 *
 * Really though, you'll use views to set up multiple views:
 *
 * ```html
 * <div ui-view></div>
 * <div ui-view="chart"></div>
 * <div ui-view="data"></div>
 * ```
 *
 * ```js
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     },
 *     "chart": {
 *       template: "<chart_thing/>"
 *     },
 *     "data": {
 *       template: "<data_thing/>"
 *     }
 *   }
 * })
 * ```
 *
 * #### Examples for `autoscroll`:
 * ```html
 * <!-- If autoscroll present with no expression,
 *      then scroll ui-view into view -->
 * <ui-view autoscroll/>
 *
 * <!-- If autoscroll present with valid expression,
 *      then scroll ui-view into view if expression evaluates to true -->
 * <ui-view autoscroll='true'/>
 * <ui-view autoscroll='false'/>
 * <ui-view autoscroll='scopeVariable'/>
 * ```
 *
 * Resolve data:
 *
 * The resolved data from the state's `resolve` block is placed on the scope as `$resolve` (this
 * can be customized using [[Ng1ViewDeclaration.resolveAs]]).  This can be then accessed from the template.
 *
 * Note that when `controllerAs` is being used, `$resolve` is set on the controller instance *after* the
 * controller is instantiated.  The `$onInit()` hook can be used to perform initialization code which
 * depends on `$resolve` data.
 *
 * #### Example:
 * ```js
 * $stateProvider.state('home', {
 *   template: '<my-component user="$resolve.user"></my-component>',
 *   resolve: {
 *     user: function(UserService) { return UserService.fetchUser(); }
 *   }
 * });
 * ```
 */
var uiView;
uiView = ['$view', '$animate', '$uiViewScroll', '$interpolate', '$q',
    function $ViewDirective($view, $animate, $uiViewScroll, $interpolate, $q) {
        function getRenderer(attrs, scope) {
            return {
                enter: function (element, target, cb) {
                    if (ng.version.minor > 2) {
                        $animate.enter(element, null, target).then(cb);
                    }
                    else {
                        $animate.enter(element, null, target, cb);
                    }
                },
                leave: function (element, cb) {
                    if (ng.version.minor > 2) {
                        $animate.leave(element).then(cb);
                    }
                    else {
                        $animate.leave(element, cb);
                    }
                }
            };
        }
        function configsEqual(config1, config2) {
            return config1 === config2;
        }
        var rootData = {
            $cfg: { viewDecl: { $context: $view._pluginapi._rootViewContext() } },
            $uiView: {}
        };
        var directive = {
            count: 0,
            restrict: 'ECA',
            terminal: true,
            priority: 400,
            transclude: 'element',
            compile: function (tElement, tAttrs, $transclude) {
                return function (scope, $element, attrs) {
                    var previousEl, currentEl, currentScope, unregister, onloadExp = attrs['onload'] || '', autoScrollExp = attrs['autoscroll'], renderer = getRenderer(attrs, scope), viewConfig = undefined, inherited = $element.inheritedData('$uiView') || rootData, name = $interpolate(attrs['uiView'] || attrs['name'] || '')(scope) || '$default';
                    var activeUIView = {
                        $type: 'ng1',
                        id: directive.count++,
                        name: name,
                        fqn: inherited.$uiView.fqn ? inherited.$uiView.fqn + "." + name : name,
                        config: null,
                        configUpdated: configUpdatedCallback,
                        get creationContext() {
                            var fromParentTagConfig = _uirouter_core.parse('$cfg.viewDecl.$context')(inherited);
                            // Allow <ui-view name="foo"><ui-view name="bar"></ui-view></ui-view>
                            // See https://github.com/angular-ui/ui-router/issues/3355
                            var fromParentTag = _uirouter_core.parse('$uiView.creationContext')(inherited);
                            return fromParentTagConfig || fromParentTag;
                        }
                    };
                    _uirouter_core.trace.traceUIViewEvent("Linking", activeUIView);
                    function configUpdatedCallback(config) {
                        if (config && !(config instanceof Ng1ViewConfig))
                            return;
                        if (configsEqual(viewConfig, config))
                            return;
                        _uirouter_core.trace.traceUIViewConfigUpdated(activeUIView, config && config.viewDecl && config.viewDecl.$context);
                        viewConfig = config;
                        updateView(config);
                    }
                    $element.data('$uiView', { $uiView: activeUIView });
                    updateView();
                    unregister = $view.registerUIView(activeUIView);
                    scope.$on("$destroy", function () {
                        _uirouter_core.trace.traceUIViewEvent("Destroying/Unregistering", activeUIView);
                        unregister();
                    });
                    function cleanupLastView() {
                        if (previousEl) {
                            _uirouter_core.trace.traceUIViewEvent("Removing (previous) el", previousEl.data('$uiView'));
                            previousEl.remove();
                            previousEl = null;
                        }
                        if (currentScope) {
                            _uirouter_core.trace.traceUIViewEvent("Destroying scope", activeUIView);
                            currentScope.$destroy();
                            currentScope = null;
                        }
                        if (currentEl) {
                            var _viewData_1 = currentEl.data('$uiViewAnim');
                            _uirouter_core.trace.traceUIViewEvent("Animate out", _viewData_1);
                            renderer.leave(currentEl, function () {
                                _viewData_1.$$animLeave.resolve();
                                previousEl = null;
                            });
                            previousEl = currentEl;
                            currentEl = null;
                        }
                    }
                    function updateView(config) {
                        var newScope = scope.$new();
                        var animEnter = $q.defer(), animLeave = $q.defer();
                        var $uiViewData = {
                            $cfg: config,
                            $uiView: activeUIView,
                        };
                        var $uiViewAnim = {
                            $animEnter: animEnter.promise,
                            $animLeave: animLeave.promise,
                            $$animLeave: animLeave
                        };
                        /**
                         * @ngdoc event
                         * @name ui.router.state.directive:ui-view#$viewContentLoading
                         * @eventOf ui.router.state.directive:ui-view
                         * @eventType emits on ui-view directive scope
                         * @description
                         *
                         * Fired once the view **begins loading**, *before* the DOM is rendered.
                         *
                         * @param {Object} event Event object.
                         * @param {string} viewName Name of the view.
                         */
                        newScope.$emit('$viewContentLoading', name);
                        var cloned = $transclude(newScope, function (clone) {
                            clone.data('$uiViewAnim', $uiViewAnim);
                            clone.data('$uiView', $uiViewData);
                            renderer.enter(clone, $element, function onUIViewEnter() {
                                animEnter.resolve();
                                if (currentScope)
                                    currentScope.$emit('$viewContentAnimationEnded');
                                if (_uirouter_core.isDefined(autoScrollExp) && !autoScrollExp || scope.$eval(autoScrollExp)) {
                                    $uiViewScroll(clone);
                                }
                            });
                            cleanupLastView();
                        });
                        currentEl = cloned;
                        currentScope = newScope;
                        /**
                         * @ngdoc event
                         * @name ui.router.state.directive:ui-view#$viewContentLoaded
                         * @eventOf ui.router.state.directive:ui-view
                         * @eventType emits on ui-view directive scope
                         * @description           *
                         * Fired once the view is **loaded**, *after* the DOM is rendered.
                         *
                         * @param {Object} event Event object.
                         */
                        currentScope.$emit('$viewContentLoaded', config || viewConfig);
                        currentScope.$eval(onloadExp);
                    }
                };
            }
        };
        return directive;
    }];
$ViewDirectiveFill.$inject = ['$compile', '$controller', '$transitions', '$view', '$q', '$timeout'];
/** @hidden */
function $ViewDirectiveFill($compile, $controller, $transitions, $view, $q, $timeout) {
    var getControllerAs = _uirouter_core.parse('viewDecl.controllerAs');
    var getResolveAs = _uirouter_core.parse('viewDecl.resolveAs');
    return {
        restrict: 'ECA',
        priority: -400,
        compile: function (tElement) {
            var initial = tElement.html();
            tElement.empty();
            return function (scope, $element) {
                var data = $element.data('$uiView');
                if (!data) {
                    $element.html(initial);
                    $compile($element.contents())(scope);
                    return;
                }
                var cfg = data.$cfg || { viewDecl: {}, getTemplate: ng_from_import.noop };
                var resolveCtx = cfg.path && new _uirouter_core.ResolveContext(cfg.path);
                $element.html(cfg.getTemplate($element, resolveCtx) || initial);
                _uirouter_core.trace.traceUIViewFill(data.$uiView, $element.html());
                var link = $compile($element.contents());
                var controller = cfg.controller;
                var controllerAs = getControllerAs(cfg);
                var resolveAs = getResolveAs(cfg);
                var locals = resolveCtx && getLocals(resolveCtx);
                scope[resolveAs] = locals;
                if (controller) {
                    var controllerInstance = $controller(controller, _uirouter_core.extend({}, locals, { $scope: scope, $element: $element }));
                    if (controllerAs) {
                        scope[controllerAs] = controllerInstance;
                        scope[controllerAs][resolveAs] = locals;
                    }
                    // TODO: Use $view service as a central point for registering component-level hooks
                    // Then, when a component is created, tell the $view service, so it can invoke hooks
                    // $view.componentLoaded(controllerInstance, { $scope: scope, $element: $element });
                    // scope.$on('$destroy', () => $view.componentUnloaded(controllerInstance, { $scope: scope, $element: $element }));
                    $element.data('$ngControllerController', controllerInstance);
                    $element.children().data('$ngControllerController', controllerInstance);
                    registerControllerCallbacks($q, $transitions, controllerInstance, scope, cfg);
                }
                // Wait for the component to appear in the DOM
                if (_uirouter_core.isString(cfg.viewDecl.component)) {
                    var cmp_1 = cfg.viewDecl.component;
                    var kebobName = _uirouter_core.kebobString(cmp_1);
                    var tagRegexp_1 = new RegExp("^(x-|data-)?" + kebobName + "$", "i");
                    var getComponentController = function () {
                        var directiveEl = [].slice.call($element[0].children)
                            .filter(function (el) { return el && el.tagName && tagRegexp_1.exec(el.tagName); });
                        return directiveEl && ng.element(directiveEl).data("$" + cmp_1 + "Controller");
                    };
                    var deregisterWatch_1 = scope.$watch(getComponentController, function (ctrlInstance) {
                        if (!ctrlInstance)
                            return;
                        registerControllerCallbacks($q, $transitions, ctrlInstance, scope, cfg);
                        deregisterWatch_1();
                    });
                }
                link(scope);
            };
        }
    };
}
/** @hidden */
var hasComponentImpl = typeof ng.module('ui.router')['component'] === 'function';
/** @hidden incrementing id */
var _uiCanExitId = 0;
/** @hidden TODO: move these callbacks to $view and/or `/hooks/components.ts` or something */
function registerControllerCallbacks($q, $transitions, controllerInstance, $scope, cfg) {
    // Call $onInit() ASAP
    if (_uirouter_core.isFunction(controllerInstance.$onInit) && !(cfg.viewDecl.component && hasComponentImpl)) {
        controllerInstance.$onInit();
    }
    var viewState = _uirouter_core.tail(cfg.path).state.self;
    var hookOptions = { bind: controllerInstance };
    // Add component-level hook for onParamsChange
    if (_uirouter_core.isFunction(controllerInstance.uiOnParamsChanged)) {
        var resolveContext = new _uirouter_core.ResolveContext(cfg.path);
        var viewCreationTrans_1 = resolveContext.getResolvable('$transition$').data;
        // Fire callback on any successful transition
        var paramsUpdated = function ($transition$) {
            // Exit early if the $transition$ is the same as the view was created within.
            // Exit early if the $transition$ will exit the state the view is for.
            if ($transition$ === viewCreationTrans_1 || $transition$.exiting().indexOf(viewState) !== -1)
                return;
            var toParams = $transition$.params("to");
            var fromParams = $transition$.params("from");
            var toSchema = $transition$.treeChanges().to.map(function (node) { return node.paramSchema; }).reduce(_uirouter_core.unnestR, []);
            var fromSchema = $transition$.treeChanges().from.map(function (node) { return node.paramSchema; }).reduce(_uirouter_core.unnestR, []);
            // Find the to params that have different values than the from params
            var changedToParams = toSchema.filter(function (param) {
                var idx = fromSchema.indexOf(param);
                return idx === -1 || !fromSchema[idx].type.equals(toParams[param.id], fromParams[param.id]);
            });
            // Only trigger callback if a to param has changed or is new
            if (changedToParams.length) {
                var changedKeys_1 = changedToParams.map(function (x) { return x.id; });
                // Filter the params to only changed/new to params.  `$transition$.params()` may be used to get all params.
                var newValues = _uirouter_core.filter(toParams, function (val$$1, key) { return changedKeys_1.indexOf(key) !== -1; });
                controllerInstance.uiOnParamsChanged(newValues, $transition$);
            }
        };
        $scope.$on('$destroy', $transitions.onSuccess({}, paramsUpdated, hookOptions));
    }
    // Add component-level hook for uiCanExit
    if (_uirouter_core.isFunction(controllerInstance.uiCanExit)) {
        var id_1 = _uiCanExitId++;
        var cacheProp_1 = '_uiCanExitIds';
        // Returns true if a redirect transition already answered truthy
        var prevTruthyAnswer_1 = function (trans) {
            return !!trans && (trans[cacheProp_1] && trans[cacheProp_1][id_1] === true || prevTruthyAnswer_1(trans.redirectedFrom()));
        };
        // If a user answered yes, but the transition was later redirected, don't also ask for the new redirect transition
        var wrappedHook = function (trans) {
            var promise, ids = trans[cacheProp_1] = trans[cacheProp_1] || {};
            if (!prevTruthyAnswer_1(trans)) {
                promise = $q.when(controllerInstance.uiCanExit(trans));
                promise.then(function (val$$1) { return ids[id_1] = (val$$1 !== false); });
            }
            return promise;
        };
        var criteria = { exiting: viewState.name };
        $scope.$on('$destroy', $transitions.onBefore(criteria, wrappedHook, hookOptions));
    }
}
ng.module('ui.router.state').directive('uiView', uiView);
ng.module('ui.router.state').directive('uiView', $ViewDirectiveFill);

/** @module ng1 */ /** */
/** @hidden */
function $ViewScrollProvider() {
    var useAnchorScroll = false;
    this.useAnchorScroll = function () {
        useAnchorScroll = true;
    };
    this.$get = ['$anchorScroll', '$timeout', function ($anchorScroll, $timeout) {
            if (useAnchorScroll) {
                return $anchorScroll;
            }
            return function ($element) {
                return $timeout(function () {
                    $element[0].scrollIntoView();
                }, 0, false);
            };
        }];
}
ng.module('ui.router.state').provider('$uiViewScroll', $ViewScrollProvider);

/**
 * Main entry point for angular 1.x build
 * @module ng1
 */ /** */
var index = "ui.router";

exports['default'] = index;
exports.core = _uirouter_core;
exports.watchDigests = watchDigests;
exports.getLocals = getLocals;
exports.getNg1ViewConfigFactory = getNg1ViewConfigFactory;
exports.ng1ViewsBuilder = ng1ViewsBuilder;
exports.Ng1ViewConfig = Ng1ViewConfig;
exports.StateProvider = StateProvider;
exports.UrlRouterProvider = UrlRouterProvider;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ui-router-angularjs.js.map
