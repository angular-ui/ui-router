/** @module view */ /** for typedoc */
"use strict";
/// <reference path='../../typings/angularjs/angular.d.ts' />
import {isInjectable, isString, extend, curry, applyPairs, prop, pick, removeFrom, TypedMap} from "../common/common";
import {trace} from "../common/module";

import {StateViewConfig, ViewDeclaration} from "../state/interface";
import {UIViewData, ViewContext} from "./interface";

import {ResolveInjector} from "../resolve/module";

/**
 * Given a raw view name from a views: config, returns a normalized target viewName and contextAnchor
 */
function normalizeUiViewTarget(rawViewName = "") {
  // TODO: Validate incoming view name with a regexp to allow:
  // ex: "view.name@foo.bar" , "^.^.view.name" , "view.name@^.^" , "" ,
  // "@" , "$default@^" , "!$default.$default" , "!foo.bar"
  let viewAtContext: string[] = rawViewName.split("@");
  let uiViewName = viewAtContext[0] || "$default";  // default to unnamed view
  let uiViewContextAnchor = isString(viewAtContext[1]) ? viewAtContext[1] : "^";    // default to parent context

  // Handle relative view-name sugar syntax.
  // Matches rawViewName "^.^.^.foo.bar" into array: ["^.^.^.foo.bar", "^.^.^", "foo.bar"],
  let relativeViewNameSugar = /^(\^(?:\.\^)*)\.(.*$)/.exec(uiViewName);
  if (relativeViewNameSugar) {
    // Clobbers existing contextAnchor (rawViewName validation will fix this)
    uiViewContextAnchor = relativeViewNameSugar[1]; // set anchor to "^.^.^"
    uiViewName = relativeViewNameSugar[2]; // set view-name to "foo.bar"
  }

  if (uiViewName.charAt(0) === '!') {
    uiViewName = uiViewName.substr(1);
    uiViewContextAnchor = ""; // target absolutely from root
  }

  return {uiViewName, uiViewContextAnchor};
}

/**
 * Represents the union of a template and (optional) controller.
 *
 * @param {Object} config The view's configuration
 *
 * @returns {Object} New `ViewConfig` object
 */
export class ViewConfig {
  viewDeclarationObj: ViewDeclaration;

  template: string;
  controller: Function;
  controllerAs: string;

  context: ViewContext;

  uiViewName: string;
  uiViewContextAnchor: string;

  params: any;
  locals: any;

  constructor(stateViewConfig: StateViewConfig) {
    // viewName is something like "$default" or "foo.bar" or "$default.foo.bar.$default"
    // contextAnchor is something like "fully.qualified.context" or "^" (parent) or  "^.^.^" (parent.parent.parent)
    let {uiViewName, uiViewContextAnchor} = normalizeUiViewTarget(stateViewConfig.rawViewName);

    // handle parent relative targeting "^.^.^"
    let relativeMatch = /^(\^(?:\.\^)*)$/;
    if (relativeMatch.exec(uiViewContextAnchor)) {
      let anchor = uiViewContextAnchor.split(".").reduce(((anchor, x) => anchor.parent), stateViewConfig.context);
      uiViewContextAnchor = anchor.name;
    }

    extend(this, pick(stateViewConfig, "viewDeclarationObj", "params", "context", "locals"), {uiViewName, uiViewContextAnchor});
    this.controllerAs = stateViewConfig.viewDeclarationObj.controllerAs;
  }

  /**
   * Checks a view configuration to ensure that it specifies a template.
   *
   * @return {boolean} Returns `true` if the configuration contains a valid template, otherwise `false`.
   */
  hasTemplate() {
    let viewDef = this.viewDeclarationObj;
    return !!(viewDef.template || viewDef.templateUrl || viewDef.templateProvider);
  }

  getTemplate($factory, injector: ResolveInjector) {
    return $factory.fromConfig(this.viewDeclarationObj, this.params, injector.invokeLater.bind(injector));
  }

  /**
   * Gets the controller for a view configuration.
   *
   *
   * @returns {Function|Promise.<Function>} Returns a controller, or a promise that resolves to a controller.
   */
  getController(injector: ResolveInjector) {
    //* @param {Object} locals A context object from transition.context() to invoke a function in the correct context
    let provider = this.viewDeclarationObj.controllerProvider;
    return isInjectable(provider) ? injector.invokeLater(provider, {}) : this.viewDeclarationObj.controller;
  }
}

/**
 * @ngdoc object
 * @name ui.router.state.$view
 *
 * @requires ui.router.util.$templateFactory
 * @requires $rootScope
 *
 * @description
 *
 */
$View.$inject = ['$rootScope', '$templateFactory', '$q', '$timeout'];
function $View(   $rootScope,   $templateFactory,   $q,   $timeout) {

  let uiViews: UIViewData[] = [];
  let viewConfigs: ViewConfig[] = [];

  const match = (obj1, ...keys) =>
      (obj2) => keys.reduce(((memo, key) => memo && obj1[key] === obj2[key]), true);

  this.rootContext = function(context) {
    return context ? this._rootContext = context : this._rootContext;
  };

  /**
   * @ngdoc function
   * @name ui.router.state.$view#load
   * @methodOf ui.router.state.$view
   *
   * @description
   * Uses `$templateFactory` to load a template from a configuration object into a named view.
   *
   * @param {string} name The fully-qualified name of the view to load the template into
   * @param {Object} options The options used to load the template:
   * @param {boolean} options.notify Indicates whether a `$viewContentLoading` event should be
   *    this call.
   * @params {*} options.* Accepts the full list of parameters and options accepted by
   *    `$templateFactory.fromConfig()`, including `params` and `locals`.
   * @return {Promise.<string>} Returns a promise that resolves to the value of the template loaded.
   */
  this.load = function load (viewConfig: ViewConfig, injector: ResolveInjector) {
    if (!viewConfig.hasTemplate())
      throw new Error(`No template configuration specified for '${viewConfig.uiViewName}@${viewConfig.uiViewContextAnchor}'`);

    let promises = {
      template: $q.when(viewConfig.getTemplate($templateFactory, injector)),
      controller: $q.when(viewConfig.getController(injector))
    };

    return $q.all(promises).then((results) => {
      trace.traceViewServiceEvent("Loaded", viewConfig);
      return extend(viewConfig, results);
    });
  };

  /**
   * Resets a view to its initial state.
   *
   * @param {String} name The fully-qualified name of the view to reset.
   * @return {Boolean} Returns `true` if the view exists, otherwise `false`.
   */
  this.reset = function reset (viewConfig) {
    trace.traceViewServiceEvent("<- Removing", viewConfig);
    viewConfigs.filter(match(viewConfig, "uiViewName", "context")).forEach(removeFrom(viewConfigs));
  };

  this.registerStateViewConfig = function(viewConfig: ViewConfig) {
    trace.traceViewServiceEvent("-> Registering", viewConfig);
    viewConfigs.push(viewConfig);
  };

  this.sync = () => {
    let uiViewsByFqn: TypedMap<UIViewData> =
        uiViews.map(uiv => [uiv.fqn, uiv]).reduce(applyPairs, <any> {});

    /**
     * Given a ui-view and a ViewConfig, determines if they "match".
     *
     * A ui-view has a fully qualified name (fqn) and a context object.  The fqn is built from its overall location in
     * the DOM, describing its nesting relationship to any parent ui-view tags it is nested inside of.
     *
     * A ViewConfig has a target ui-view name and a context anchor.  The ui-view name can be a simple name, or
     * can be a segmented ui-view path, describing a portion of a ui-view fqn.
     *
     * If the ViewConfig's target ui-view name is a simple name (no dots), then a ui-view matches if:
     * - the ui-view's name matches the ViewConfig's target name
     * - the ui-view's context matches the ViewConfig's anchor
     *
     * If the ViewConfig's target ui-view name is a segmented name (with dots), then a ui-view matches if:
     * - There exists a parent ui-view where:
     *    - the parent ui-view's name matches the first segment (index 0) of the ViewConfig's target name
     *    - the parent ui-view's context matches the ViewConfig's anchor
     * - And the remaining segments (index 1..n) of the ViewConfig's target name match the tail of the ui-view's fqn
     *
     * Example:
     *
     * DOM:
     * <div ui-view>                        <!-- created in the root context (name: "") -->
     *   <div ui-view="foo">                <!-- created in the context named: "A"      -->
     *     <div ui-view>                    <!-- created in the context named: "A.B"    -->
     *       <div ui-view="bar">            <!-- created in the context named: "A.B.C"  -->
     *       </div>
     *     </div>
     *   </div>
     * </div>
     *
     * uiViews: [
     *  { fqn: "$default",                  creationContext: { name: "" } },
     *  { fqn: "$default.foo",              creationContext: { name: "A" } },
     *  { fqn: "$default.foo.$default",     creationContext: { name: "A.B" } }
     *  { fqn: "$default.foo.$default.bar", creationContext: { name: "A.B.C" } }
     * ]
     *
     * These four view configs all match the ui-view with the fqn: "$default.foo.$default.bar":
     *
     * - ViewConfig1: { uiViewName: "bar",                       uiViewContextAnchor: "A.B.C" }
     * - ViewConfig2: { uiViewName: "$default.bar",              uiViewContextAnchor: "A.B" }
     * - ViewConfig3: { uiViewName: "foo.$default.bar",          uiViewContextAnchor: "A" }
     * - ViewConfig4: { uiViewName: "$default.foo.$default.bar", uiViewContextAnchor: "" }
     *
     * Using ViewConfig3 as an example, it matches the ui-view with fqn "$default.foo.$default.bar" because:
     * - The ViewConfig's segmented target name is: [ "foo", "$default", "bar" ]
     * - There exists a parent ui-view (which has fqn: "$default.foo") where:
     *    - the parent ui-view's name "foo" matches the first segment "foo" of the ViewConfig's target name
     *    - the parent ui-view's context "A" matches the ViewConfig's anchor context "A"
     * - And the remaining segments [ "$default", "bar" ].join("."_ of the ViewConfig's target name match
     *   the tail of the ui-view's fqn "default.bar"
     */
    const matches = curry(function(uiView: UIViewData, viewConfig: ViewConfig) {
      // Split names apart from both viewConfig and uiView into segments
      let vcSegments = viewConfig.uiViewName.split(".");
      let uivSegments = uiView.fqn.split(".");

      // Check if the tails of the segment arrays match. ex, these arrays' tails match:
      // vc: ["foo", "bar"], uiv fqn: ["$default", "foo", "bar"]
      if (!angular.equals(vcSegments, uivSegments.slice(0 - vcSegments.length)))
        return false;

      // Now check if the fqn ending at the first segment of the viewConfig matches the context:
      // ["$default", "foo"].join(".") == "$default.foo", does the ui-view $default.foo context match?
      let negOffset = (1 - vcSegments.length) || undefined;
      let fqnToFirstSegment = uivSegments.slice(0, negOffset).join(".");
      let uiViewContext = uiViewsByFqn[fqnToFirstSegment].creationContext;
      return viewConfig.uiViewContextAnchor === (uiViewContext && uiViewContext.name);
    });

    // Return the number of dots in the fully qualified name
    function uiViewDepth(uiView: UIViewData) {
      return uiView.fqn.split(".").length;
    }

    // Return the ViewConfig's context's depth in the context tree.
    function viewConfigDepth(config: ViewConfig) {
      let context: ViewContext = config.context, count = 0;
      while (++count && context.parent) context = context.parent;
      return count;
    }

    // Given a depth function, returns a compare function which can return either ascending or descending order
    const depthCompare = curry((depthFn, posNeg, left, right) => posNeg * (depthFn(left) - depthFn(right)));

    const matchingConfigPair = uiView => {
      let matchingConfigs = viewConfigs.filter(matches(uiView));
      if (matchingConfigs.length > 1)
        matchingConfigs.sort(depthCompare(viewConfigDepth, -1)); // descending
      return [uiView, matchingConfigs[0]];
    };

    const configureUiView = ([uiView, viewConfig]) => {
      // If a parent ui-view is reconfigured, it could destroy child ui-views.
      // Before configuring a child ui-view, make sure it's still in the active uiViews array.
      if (uiViews.indexOf(uiView) !== -1)
        uiView.configUpdated(viewConfig);
    };

    uiViews.sort(depthCompare(uiViewDepth, 1)).map(matchingConfigPair).forEach(configureUiView);
  };

  /**
   * Allows a `ui-view` element to register its canonical name with a callback that allows it to
   * be updated with a template, controller, and local variables.
   *
   * @param {String} name The fully-qualified name of the `ui-view` object being registered.
   * @param {Function} configUpdatedCallback A callback that receives updates to the content & configuration
   *                   of the view.
   * @return {Function} Returns a de-registration function used when the view is destroyed.
   */
  this.registerUiView = function register(uiView: UIViewData) {
    trace.traceViewServiceUiViewEvent("-> Registering", uiView);
    const fqnMatches = uiv => uiv.fqn === uiView.fqn;
    if (uiViews.filter(fqnMatches).length)
      trace.traceViewServiceUiViewEvent("!!!! duplicate uiView named:", uiView);

    uiViews.push(uiView);
    this.sync();

    return () => {
      let idx = uiViews.indexOf(uiView);
      if (idx <= 0) {
        trace.traceViewServiceUiViewEvent("Tried removing non-registered uiView", uiView);
        return;
      }
      trace.traceViewServiceUiViewEvent("<- Deregistering", uiView);
      removeFrom(uiViews)(uiView);
    };
  };

  /**
   * Returns the list of views currently available on the page, by fully-qualified name.
   *
   * @return {Array} Returns an array of fully-qualified view names.
   */
  this.available = () => uiViews.map(prop("fqn"));

  /**
   * Returns the list of views on the page containing loaded content.
   *
   * @return {Array} Returns an array of fully-qualified view names.
   */
  this.active = () => uiViews.filter(prop("$config")).map(prop("name"));
}

angular.module('ui.router.state').service('$view', $View);
