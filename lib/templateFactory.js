"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module view */
/** for typedoc */
var angular_1 = require("./angular");
var core_1 = require("@uirouter/core");
/**
 * Service which manages loading of templates from a ViewConfig.
 */
var TemplateFactory = (function () {
    function TemplateFactory() {
        var _this = this;
        /** @hidden */ this._useHttp = angular_1.ng.version.minor < 3;
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
    ;
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
        var asTemplate = function (result) { return core_1.services.$q.when(result).then(function (str) { return ({ template: str }); }); };
        var asComponent = function (result) { return core_1.services.$q.when(result).then(function (str) { return ({ component: str }); }); };
        return (core_1.isDefined(config.template) ? asTemplate(this.fromString(config.template, params)) :
            core_1.isDefined(config.templateUrl) ? asTemplate(this.fromUrl(config.templateUrl, params)) :
                core_1.isDefined(config.templateProvider) ? asTemplate(this.fromProvider(config.templateProvider, params, context)) :
                    core_1.isDefined(config.component) ? asComponent(config.component) :
                        core_1.isDefined(config.componentProvider) ? asComponent(this.fromComponentProvider(config.componentProvider, params, context)) :
                            asTemplate(defaultTemplate));
    };
    ;
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
        return core_1.isFunction(template) ? template(params) : template;
    };
    ;
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
        if (core_1.isFunction(url))
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
    ;
    /**
     * Creates a template by invoking an injectable provider function.
     *
     * @param provider Function to invoke via `locals`
     * @param {Function} injectFn a function used to invoke the template provider
     * @return {string|Promise.<string>} The template html as a string, or a promise
     * for that string.
     */
    TemplateFactory.prototype.fromProvider = function (provider, params, context) {
        var deps = core_1.services.$injector.annotate(provider);
        var providerFn = core_1.isArray(provider) ? core_1.tail(provider) : provider;
        var resolvable = new core_1.Resolvable("", providerFn, deps);
        return resolvable.get(context);
    };
    ;
    /**
     * Creates a component's template by invoking an injectable provider function.
     *
     * @param provider Function to invoke via `locals`
     * @param {Function} injectFn a function used to invoke the template provider
     * @return {string} The template html as a string: "<component-name input1='::$resolve.foo'></component-name>".
     */
    TemplateFactory.prototype.fromComponentProvider = function (provider, params, context) {
        var deps = core_1.services.$injector.annotate(provider);
        var providerFn = core_1.isArray(provider) ? core_1.tail(provider) : provider;
        var resolvable = new core_1.Resolvable("", providerFn, deps);
        return resolvable.get(context);
    };
    ;
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
        var prefix = angular_1.ng.version.minor >= 3 ? "::" : "";
        // Convert to kebob name. Add x- prefix if the string starts with `x-` or `data-`
        var kebob = function (camelCase) {
            var kebobed = core_1.kebobString(camelCase);
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
                var args = fn && core_1.services.$injector.annotate(fn) || [];
                // account for array style injection, i.e., ['foo', function(foo) {}]
                var arrayIdxStr = core_1.isArray(fn) ? "[" + (fn.length - 1) + "]" : '';
                return attrName + "='$resolve." + resolveName + arrayIdxStr + "(" + args.join(",") + ")'";
            }
            // some-attr="::$resolve.someResolveName"
            return attrName + "='" + prefix + "$resolve." + resolveName + "'";
        };
        var attrs = getComponentBindings(component).map(attributeTpl).join(" ");
        var kebobName = kebob(component);
        return "<" + kebobName + " " + attrs + "></" + kebobName + ">";
    };
    ;
    return TemplateFactory;
}());
exports.TemplateFactory = TemplateFactory;
// Gets all the directive(s)' inputs ('@', '=', and '<') and outputs ('&')
function getComponentBindings(name) {
    var cmpDefs = core_1.services.$injector.get(name + "Directive"); // could be multiple
    if (!cmpDefs || !cmpDefs.length)
        throw new Error("Unable to find component named '" + name + "'");
    return cmpDefs.map(getBindings).reduce(core_1.unnestR, []);
}
// Given a directive definition, find its object input attributes
// Use different properties, depending on the type of directive (component, bindToController, normal)
var getBindings = function (def) {
    if (core_1.isObject(def.bindToController))
        return scopeBindings(def.bindToController);
    return scopeBindings(def.scope);
};
// for ng 1.2 style, process the scope: { input: "=foo" }
// for ng 1.3 through ng 1.5, process the component's bindToController: { input: "=foo" } object
var scopeBindings = function (bindingsObj) { return Object.keys(bindingsObj || {})
    .map(function (key) { return [key, /^([=<@&])[?]?(.*)/.exec(bindingsObj[key])]; })
    .filter(function (tuple) { return core_1.isDefined(tuple) && core_1.isArray(tuple[1]); })
    .map(function (tuple) { return ({ name: tuple[1][2] || tuple[0], type: tuple[1][1] }); }); };
//# sourceMappingURL=templateFactory.js.map