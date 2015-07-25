/// <reference path='../../typings/angularjs/angular.d.ts' />
import {isInjectable, isDefined, isArray, defaults, equals, extend, forEach, map, parse, objectKeys, noop,
    unnest, prop, pick, pluck, removeFrom, eq, isEq, val, compose, _map} from "../common/common";
import PathContext from "../resolve/pathContext";
import {IDeferred} from "angular";
import {IStateViewConfig} from "../state/interface";

interface ViewKey {
  context: any,
  name: string,
  item: any
}

const _debug = false;
const debug = function(...any) {
  if (_debug) { console.log.call(console, arguments); }
};

const viewKey = (item: any) =>
  extend(pick(item, "name", "context", "parentContext"),  { item: item });

/**
 * Represents the union of a template and (optional) controller.
 *
 * @param {Object} config The view's configuration
 *
 * @returns {Object} New `ViewConfig` object
 */
export class ViewConfig {
  template: string;
  controller: Function;
  controllerAs: string;

  name: string;
  context: any;
  get parentContext() {
    return this.context && this.context.parent;
  }
  params: any;
  locals: any;

  sourceStateConfig: IStateViewConfig;

  constructor(stateViewConfig: IStateViewConfig) {
    this.sourceStateConfig = stateViewConfig;
    extend(this, pick(stateViewConfig, "name", "context", "params", "locals"));
    extend(this, pick(stateViewConfig.view, "controllerAs"));
  }

  /**
   * Checks a view configuration to ensure that it specifies a template.
   *
   * @return {boolean} Returns `true` if the configuration contains a valid template, otherwise `false`.
   */
  hasTemplate() {
    var viewDef = this.sourceStateConfig.view;
    return !!(viewDef.template || viewDef.templateUrl || viewDef.templateProvider);
  }

  getTemplate($factory) {
    var locals = this.locals, viewDef = this.sourceStateConfig.view;
    return $factory.fromConfig(viewDef, this.params, locals.invoke.bind(locals));
  }

  /**
   * Gets the controller for a view configuration.
   *
   *
   * @returns {Function|Promise.<Function>} Returns a controller, or a promise that resolves to a controller.
   */
  getController() {
    //* @param {Object} locals A context object from transition.context() to invoke a function in the correct context
    var provider = this.sourceStateConfig.view.controllerProvider;
    return isInjectable(provider) ? this.locals.invoke(provider) : this.sourceStateConfig.view.controller;
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

  var uiViews = [];
  var viewConfigs = [];

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
  this.load = function load (viewConfig: ViewConfig, options) {
    var options = defaults(options, {
      context:            null,
      parent:             null,
      notify:             true,
      async:              true,
      params:             {}
    });

    if (!viewConfig.hasTemplate())
      throw new Error('No template configuration specified for ' + name);

    if (options.notify) {
      /**
       * @ngdoc event
       * @name ui.router.state.$state#$viewContentLoading
       * @eventOf ui.router.state.$view
       * @eventType broadcast on root scope
       * @description
       *
       * Fired once the view **begins loading**, *before* the DOM is rendered.
       *
       * @param {Object} event Event object.
       * @param {Object} viewConfig The view config properties (template, controller, etc).
       *
       * @example
       *
       * <pre>
       * $scope.$on('$viewContentLoading', function(event, viewConfig) {
       *   // Access to all the view config properties.
       *   // and one special property 'targetView'
       *   // viewConfig.targetView
       * });
       * </pre>
       */
      $rootScope.$broadcast('$viewContentLoading', extend({ targetView: name }, options));
    }

    var promises = {
      template: $q.when(viewConfig.getTemplate($templateFactory)),
      controller: $q.when(viewConfig.getController())
    };

    return $q.all(promises)
        .then((results) => extend(viewConfig, results))
        .then(this.sync.bind(this));
  };

  /**
   * Resets a view to its initial state.
   *
   * @param {String} name The fully-qualified name of the view to reset.
   * @return {Boolean} Returns `true` if the view exists, otherwise `false`.
   */
  this.reset = function reset (stateViewConfig) {
    var viewConfig = new ViewConfig(stateViewConfig);
    viewConfigs.filter(match(viewConfig, "name", "context")).forEach(removeFrom(viewConfigs));
    uiViews.filter(match(viewConfig, "name", "parentContext")).forEach((uiView) => uiView.configUpdated({}));
    this.sync();
  };

  this.registerStateViewConfig = function(stateViewConfig: IStateViewConfig) {
    var viewConfig = new ViewConfig(stateViewConfig);
    viewConfigs.push(viewConfig);
    this.load(viewConfig);
  };

  this.sync = () => {
    var [uiViewKeys, viewConfigKeys] = [uiViews, viewConfigs].map(_map(viewKey));
    var matchingKeyPairs = unnest(uiViewKeys.map((uiView) => {
      var matches = viewConfigKeys.filter(match(uiView, "name", "parentContext"));
      return matches.map((config) => [uiView, config]);
    }));

    const configureUiView = ([uiView, viewConfig]) => uiView.configUpdated(viewConfig);
    matchingKeyPairs.map(_map(prop("item"))).forEach(configureUiView)
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
  this.registerUiView = function register(uiView) {
    var fqnMatches = isEq(prop("fqn"), val(uiView.fqn));
    if (uiViews.filter(fqnMatches).length)
      debug(`uiView already exists with name: '${uiView.fqn}' (named ${uiView.name} in context ${uiView.context})`);

    uiViews.push(uiView);
    this.sync();

    return () => {
      var idx = uiViews.indexOf(uiView);
      if (idx <= 0) {
        debug("Tried removing non-registered uiView");
        return;
      }
      debug("uiViews: ", uiViews.map(prop("fqn")));
      debug(`Removing ${uiView.fqn} from uiViews: '${uiView}' (${idx})`);
      removeFrom(uiViews)(uiView);
      debug("uiViews: ", uiViews.map(prop("fqn")));

      this.sync();
    }
  };

  /**
   * Returns the list of views currently available on the page, by fully-qualified name.
   *
   * @return {Array} Returns an array of fully-qualified view names.
   */
  this.available = () => uiViews.map(prop("name"));

  /**
   * Returns the list of views on the page containing loaded content.
   *
   * @return {Array} Returns an array of fully-qualified view names.
   */
  this.active = () => uiViews.filter(prop("$config")).map(prop("name"));
}

angular.module('ui.router.state').service('$view', $View);
