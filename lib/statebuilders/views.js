"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@uirouter/core");
function getNg1ViewConfigFactory() {
    var templateFactory = null;
    return function (path, view) {
        templateFactory = templateFactory || core_1.services.$injector.get("$templateFactory");
        return [new Ng1ViewConfig(path, view, templateFactory)];
    };
}
exports.getNg1ViewConfigFactory = getNg1ViewConfigFactory;
var hasAnyKey = function (keys, obj) {
    return keys.reduce(function (acc, key) { return acc || core_1.isDefined(obj[key]); }, false);
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
    if (core_1.isDefined(state.views) && hasAnyKey(allViewKeys, state)) {
        throw new Error("State '" + state.name + "' has a 'views' object. " +
            "It cannot also have \"view properties\" at the state level.  " +
            "Move the following properties into a view (in the 'views' object): " +
            (" " + allViewKeys.filter(function (key) { return core_1.isDefined(state[key]); }).join(", ")));
    }
    var views = {}, viewsObject = state.views || { "$default": core_1.pick(state, allViewKeys) };
    core_1.forEach(viewsObject, function (config, name) {
        // Account for views: { "": { template... } }
        name = name || "$default";
        // Account for views: { header: "headerComponent" }
        if (core_1.isString(config))
            config = { component: config };
        // Make a shallow copy of the config object
        config = core_1.extend({}, config);
        // Do not allow a view to mix props for component-style view with props for template/controller-style view
        if (hasAnyKey(compKeys, config) && hasAnyKey(nonCompKeys, config)) {
            throw new Error("Cannot combine: " + compKeys.join("|") + " with: " + nonCompKeys.join("|") + " in stateview: '" + name + "@" + state.name + "'");
        }
        config.resolveAs = config.resolveAs || '$resolve';
        config.$type = "ng1";
        config.$context = state;
        config.$name = name;
        var normalized = core_1.ViewService.normalizeUIViewTarget(config.$context, config.$name);
        config.$uiViewName = normalized.uiViewName;
        config.$uiViewContextAnchor = normalized.uiViewContextAnchor;
        views[name] = config;
    });
    return views;
}
exports.ng1ViewsBuilder = ng1ViewsBuilder;
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
        var $q = core_1.services.$q;
        var context = new core_1.ResolveContext(this.path);
        var params = this.path.reduce(function (acc, node) { return core_1.extend(acc, node.paramValues); }, {});
        var promises = {
            template: $q.when(this.factory.fromConfig(this.viewDecl, params, context)),
            controller: $q.when(this.getController(context))
        };
        return $q.all(promises).then(function (results) {
            core_1.trace.traceViewServiceEvent("Loaded", _this);
            _this.controller = results.controller;
            core_1.extend(_this, results.template); // Either { template: "tpl" } or { component: "cmpName" }
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
        if (!core_1.isInjectable(provider))
            return this.viewDecl.controller;
        var deps = core_1.services.$injector.annotate(provider);
        var providerFn = core_1.isArray(provider) ? core_1.tail(provider) : provider;
        var resolvable = new core_1.Resolvable("", providerFn, deps);
        return resolvable.get(context);
    };
    return Ng1ViewConfig;
}());
exports.Ng1ViewConfig = Ng1ViewConfig;
//# sourceMappingURL=views.js.map