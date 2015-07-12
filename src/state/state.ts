import {extend, inherit, pluck, defaults, copy, abstractKey, equalForKeys, forEach, pick, objectKeys, ancestors, arraySearch, noop, identity} from "../common/common";
import {not, prop, pipe, val} from "../common/common";
import {isDefined, isFunction, isArray, isObject, isString} from "../common/common";
import {Glob} from "./glob";
import {TransitionRejection, RejectType, RejectFactory} from "../transition/rejectFactory";
import {defaultTransOpts} from "../transition/transitionService";
import {Param} from "../params/param";
import {ParamSet} from "../params/paramSet";
import {IServiceProviderFactory} from "angular";

export interface IPublicState {
  name: string;
  resolve: any; // key->Function
  url: string;
  resolvePolicy: (string|Object);
  // TODO: finish defining state API.  Maybe start with what's on Definitely Typed.
}

export interface IState {
  name: string;
  resolve: any; // key->Function
  url: string;
  resolvePolicy: (string|Object);
  self: IPublicState;
  params: ParamSet;
  root(): IState;
  path: IState[];
  // TODO: finish defining state API.  Maybe start with what's on Definitely Typed.
}


export function StateQueueManager(states, builder, $urlRouterProvider, $state) {
  var queue = [];

  var queueManager = extend(this, {
    register: function(config: IPublicState, pre?: boolean) {
      // Wrap a new object around the state so we can store our private details easily.
      var state = inherit(new State(), extend({}, config, {
        self: config,
        resolve: config.resolve || {},
        toString: function() { return this.name; }
      }));

      if (!isString(state.name)) throw new Error("State must have a valid name");
      if (states.hasOwnProperty(state.name) || pluck(queue, 'name').indexOf(state.name) !== -1)
        throw new Error(`State '${state.name}' is already defined`);

      queue[pre ? "unshift" : "push"](state);
      if (queueManager.autoFlush) {
        queueManager.flush($state);
      }
      return state;
    },

    flush: function($state) {
      var result, state, orphans = [], orphanIdx, previousQueueLength = {};

      while (queue.length > 0) {
        state = queue.shift();
        result = builder.build(state);
        orphanIdx = orphans.indexOf(state);

        if (result) {
          if (states.hasOwnProperty(state.name))
            throw new Error(`State '${name}' is already defined`);
          states[state.name] = state;
          this.attachRoute($state, state);
          if (orphanIdx >= 0) orphans.splice(orphanIdx, 1);
          continue;
        }

        var prev = previousQueueLength[state.name];
        previousQueueLength[state.name] = queue.length;
        if (orphanIdx >= 0 && prev === queue.length) {
          // Wait until two consecutive iterations where no additional states were dequeued successfully.
          throw new Error(`Cannot register orphaned state '${state.name}'`);
        } else if (orphanIdx < 0) {
          orphans.push(state);
        }

        queue.push(state);
      }
      return states;
    },

    autoFlush: false,

    attachRoute: function($state, state) {
      if (state[abstractKey] || !state.url) return;

      $urlRouterProvider.when(state.url, ['$match', '$stateParams', function ($match, $stateParams) {
        if ($state.$current.navigable != state || !equalForKeys($match, $stateParams)) {
          $state.transitionTo(state, $match, { inherit: true, location: false });
        }
      }]);
    }
  });
}

// Builds state properties from definition passed to StateQueueManager.register()
export function StateBuilder(root, matcher, $urlMatcherFactoryProvider) {

  var self = this, builders = {

    parent: function(state) {
      return matcher.find(self.parentName(state));
    },

    data: function(state) {
      if (state.parent && state.parent.data) {
        state.data = state.self.data = extend({}, state.parent.data, state.data);
      }
      return state.data;
    },

    // Build a URLMatcher if necessary, either via a relative or absolute URL
    url: function(state) {
      var url = state.url, config = { params: state.params || {} };
      var parent = state.parent;

      if (isString(url)) {
        if (url.charAt(0) == '^') return $urlMatcherFactoryProvider.compile(url.substring(1), config);
        return ((parent && parent.navigable) || root()).url.concat(url, config);
      }
      if (!url || $urlMatcherFactoryProvider.isMatcher(url)) return url;
      throw new Error(`Invalid url '${url}' in state '${state}'`);
    },

    // Keep track of the closest ancestor state that has a URL (i.e. is navigable)
    navigable: function(state) {
      return !state.abstract && state.url ? state : (state.parent ? state.parent.navigable : null);
    },

    // Own parameters for this state. state.url.params is already built at this point. Create and add non-url params
    ownParams: function(state) {
      var params = state.url && state.url.params || new ParamSet();
      forEach(state.params || {}, function(config, id) {
        if (!params[id]) params[id] = new Param(id, null, config, "config");
      });
      if (state.reloadOnSearch === false) {
        forEach(params, function(param) { if (param && param.location === 'search') param.dynamic = true; });
      }
      return params;
    },

    // Derive parameters for this state and ensure they're a super-set of parent's parameters
    params: function(state) {
      var base = state.parent && state.parent.params ? state.parent.params.$$new() : new ParamSet();
      return extend(base, state.ownParams);
    },

    // If there is no explicit multi-view configuration, make one up so we don't have
    // to handle both cases in the view directive later. Note that having an explicit
    // 'views' property will mean the default unnamed view properties are ignored. This
    // is also a good time to resolve view names to absolute names, so everything is a
    // straight lookup at link time.
    views: function(state) {
      var views    = {},
          tplKeys  = ['templateProvider', 'templateUrl', 'template', 'notify', 'async'],
          ctrlKeys = ['controller', 'controllerProvider', 'controllerAs'];
      var allKeys = tplKeys.concat(ctrlKeys);

      forEach(state.views || { "$default": pick(state, allKeys) }, function (config, name) {

        // Allow controller settings to be defined at the state level for all views
        forEach(ctrlKeys, function(key) {
          if (state[key] && !config[key]) config[key] = state[key];
        });

        if (objectKeys(config).length > 0) views[name] = config;
      });
      return views;
    },

    // Keep a full path from the root down to this state as this is needed for state activation.
    path: function(state) {
      return state.parent ? state.parent.path.concat(state) : []; // exclude root from path
    },

    // Speed up $state.includes() as it's used a lot
    includes: function(state) {
      var includes = state.parent ? extend({}, state.parent.includes) : {};
      includes[state.name] = true;
      return includes;
    }
  };

  extend(this, {
    builder: function(name, func) {
      if (isString(name) && !isDefined(func)) return builders[name];
      if (!isFunction(func) || !isString(name)) return;

      function remove(name, func) {
        if (!builders[name].length) {
          delete builders[name];
          return;
        }
        builders[name].splice(builders[name].indexOf(func, 1));

        if (builders[name].length === 1) {
          builders[name] = builders[name][0];
        }
      }

      function add(name, func) {
        if (!builders[name]) {
          builders[name] = func;
          return function() { remove(name, func); };
        }
        
        if (!isArray(builders[name])) {
          builders[name] = [builders[name]];
        }
        builders[name].push(func);
        return function() { remove(name, func); };
      }

      return add(name, func);
    },

    build: function(state) {
      var parent = this.parentName(state);
      if (parent && !matcher.find(parent)) return null;

      for (var key in builders) {
        var steps = isArray(builders[key]) ? builders[key].reverse() : [builders[key]];
        var chainFns = (memo, step) => step(state, memo);
        state[key] = steps.reduce(chainFns, noop);
      }
      return state;
    },

    parentName: function(state) {
      var name = state.name || "";
      if (name.indexOf('.') !== -1) return name.substring(0, name.lastIndexOf('.'));
      if (!state.parent) return "";
      return isString(state.parent) ? state.parent : state.parent.name;
    },

    name: function(state) {
      var name = state.name;
      if (name.indexOf('.') !== -1 || !state.parent) return name;

      var parentName = isString(state.parent) ? state.parent : state.parent.name;
      return parentName ? parentName + "." + name : name;
    }
  });
}

export function StateMatcher(states) {
  extend(this, {
    isRelative: function(stateName) {
      stateName = stateName || "";
      return stateName.indexOf(".") === 0 || stateName.indexOf("^") === 0;
    },

    find: function(stateOrName, base) {
      if (!stateOrName && stateOrName !== "") return undefined;
      var isStr = isString(stateOrName), name = isStr ? stateOrName : stateOrName.name;

      if (this.isRelative(name)) name = this.resolvePath(name, base);
      var state = states[name];

      if (state && (isStr || (!isStr && (state === stateOrName || state.self === stateOrName)))) {
        return state;
      }
      return undefined;
    },

    reference: function(identifier, base, params) {
      return new StateReference(identifier, this.find(identifier, base), params, base);
    },

    resolvePath: function(name, base) {
      if (!base) throw new Error(`No reference point given for path '${name}'`);
      base = this.find(base);
      
      var rel = name.split("."), i = 0, pathLength = rel.length, current = base;

      for (; i < pathLength; i++) {
        if (rel[i] === "" && i === 0) {
          current = base;
          continue;
        }
        if (rel[i] === "^") {
          if (!current.parent) throw new Error(`Path '${name}' not valid for state '${base.name}'`);
          current = current.parent;
          continue;
        }
        break;
      }
      rel = rel.slice(i).join(".");
      return current.name + (current.name && rel ? "." : "") + rel;
    }
  });
}

/**
 * @ngdoc object
 * @name ui.router.state.type:State
 *
 * @description
 * Definition object for states. Includes methods for manipulating the state heirarchy.
 *
 * @param {Object} config  A configuration object hash that includes the results of user-supplied
 *        values, as well as values from `StateBuilder`.
 *
 * @returns {Object}  Returns a new `State` object.
 */
function State(config?: IPublicState) {
  extend(this, config);
}

/**
 * @ngdoc function
 * @name ui.router.state.type:State#is
 * @methodOf ui.router.state.type:State
 *
 * @description
 * Compares the identity of the state against the passed value, which is either an object
 * reference to the actual `State` instance, the original definition object passed to
 * `$stateProvider.state()`, or the fully-qualified name.
 *
 * @param {Object} ref Can be one of (a) a `State` instance, (b) an object that was passed
 *        into `$stateProvider.state()`, (c) the fully-qualified name of a state as a string.
 * @returns {boolean} Returns `true` if `ref` matches the current `State` instance.
 */
State.prototype.is = function(ref) {
  return this === ref || this.self === ref || this.fqn() === ref;
};

/**
 * @ngdoc function
 * @name ui.router.state.type:State#fqn
 * @methodOf ui.router.state.type:State
 *
 * @description
 * Returns the fully-qualified name of the state, based on its current position in the tree.
 *
 * @returns {string} Returns a dot-separated name of the state.
 */
State.prototype.fqn = function() {
  if (!this.parent || !(this.parent instanceof this.constructor)) {
    return this.name;
  }
  var name = this.parent.fqn();
  return name ? name + "." + this.name : this.name;
};

/**
 * @ngdoc function
 * @name ui.router.state.type:State#root
 * @methodOf ui.router.state.type:State
 *
 * @description
 * Returns the root node of this state's tree.
 *
 * @returns {State} The root of this state's tree.
 */
State.prototype.root = function() {
  var result = this;

  while (result.parent) {
    result = result.parent;
  }
  return result;
};



/**
 * @ngdoc object
 * @name ui.router.state.type:StateReference
 *
 * @description
 * Wraps a state and a set of parameters with the value used to identify the state. Allows states
 * to be referenced in a consistent way in application code, separate from state definitions.
 *
 * @param {*} identifier  An identifier for a state. Either a fully-qualified path, or the object
 *            used to define the state.
 * @param {State} definition The `State` object definition.
 * @param {Object} params Parameters attached to the current state reference.
 * @param {Object} params Parameters attached to the current state reference.
 * @param {Object} base Optional. Base state used during lookup of state definition by identifier.
 *
 * @returns {Function}
 */
export class StateReference {
  private _identifier;
  private _definition: IState;
  private _params;
  private _base;

  constructor(identifier, definition: IState, params, base) {
    this._identifier = identifier;
    this._definition = definition;
    this._params = params;
    this._base = base;
  }

  identifier() {
    return this._identifier;
  }

  $state(): IState {
    return this._definition;
  }

  state(): IPublicState {
    return this._definition && this._definition.self;
  }

  params(newParams?: any) {
    if (newParams)
      return new StateReference(this._identifier, this._definition, newParams, this._base);
    return this._params;
  }

  base() {
    return this._base;
  }

  valid() {
    var def = this._definition;
    return !!(def && def.self && !def.self[abstractKey] && def.params.$$validates(this._params));
  }

  error() {
    switch (true) {
      case (!this._definition && !!this._base):
        return `Could not resolve '${this._identifier}' from state '${this._base}'`;
      case (!this._definition):
        return `No such state '${this._identifier}'`;
      case !this._definition.self:
        return `State '${this._identifier}' has an invalid definition`;
      case this._definition.self[abstractKey]:
        return `Cannot transition to abstract state '${this._identifier}'`;
    }
  }
}

export class TransitionQueue {
  _items: Array<any>;

  constructor() {
    this._items = [];
  }

  push(transition) {
    this._items.push(transition);
    return transition;
  }

  clear() {
    var current = this._items;
    this._items = [];
    return current;
  }

  size() {
    return this._items.length;
  }

  pop(transition) {
    var idx = this._items.indexOf(transition);
    return idx > -1 && this._items.splice(idx, 1)[0];
  }

  last() {
    return this._items[this._items.length - 1];
  }
}

/**
 * @ngdoc object
 * @name ui.router.state.$stateProvider
 *
 * @requires ui.router.router.$urlRouterProvider
 * @requires ui.router.util.$urlMatcherFactoryProvider
 *
 * @description
 * The new `$stateProvider` works similar to Angular's v1 router, but it focuses purely
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
$StateProvider.$inject = ['$urlRouterProvider', '$urlMatcherFactoryProvider'];
function $StateProvider(   $urlRouterProvider,   $urlMatcherFactoryProvider) {

  var root, states = {};
  var $state: any = function $state() {};

  var matcher    = new StateMatcher(states);
  var builder    = new StateBuilder(function() { return root; }, matcher, $urlMatcherFactoryProvider);
  var stateQueue = new StateQueueManager(states, builder, $urlRouterProvider, $state);
  var transQueue = new TransitionQueue();


  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#decorator
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Allows you to extend (carefully) or override (at your own peril) the
   * `stateBuilder` object used internally by `$stateProvider`. This can be used
   * to add custom functionality to ui-router, for example inferring templateUrl
   * based on the state name.
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
   * @example
   * <pre>
   * // Override the internal 'views' builder with a function that takes the state
   * // definition, and a reference to the internal function being overridden:
   * $stateProvider.decorator('views', function (state, parent) {
   *   var result = {},
   *       views = parent(state);
   *
   *   angular.forEach(views, function (config, name) {
   *     var autoName = (state.name + '.' + name).replace('.', '/');
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
   *
   * // ...
   *
   * $state.go('home');
   * // Auto-populates list and item views with /partials/home/contact/list.html,
   * // and /partials/home/contact/item.html, respectively.
   * </pre>
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
  this.decorator = decorator;
  function decorator(name, func) {
    /*jshint validthis: true */
    return builder.builder(name, func) || this;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#state
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Registers a state configuration under a given state name. The stateConfig object
   * has the following acceptable properties.
   *
   * <a id='template'></a>
   *
   * - **`template`** - {string|function=} - html template as a string or a function that returns
   *   an html template as a string which should be used by the uiView directives. This property
   *   takes precedence over templateUrl.
   *
   *   If `template` is a function, it will be called with the following parameters:
   *
   *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by
   *     applying the current state
   *
   * <a id='templateUrl'></a>
   *
   * - **`templateUrl`** - {string|function=} - path or function that returns a path to an html
   *   template that should be used by uiView.
   *
   *   If `templateUrl` is a function, it will be called with the following parameters:
   *
   *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by
   *     applying the current state
   *
   * <a id='templateProvider'></a>
   *
   * - **`templateProvider`** - {function=} - Provider function that returns HTML content
   *   string.
   *
   * <a id='controller'></a>
   *
   * - **`controller`** - {string|function=} -  Controller fn that should be associated with newly
   *   related scope or the name of a registered controller if passed as a string.
   *
   * <a id='controllerProvider'></a>
   *
   * - **`controllerProvider`** - {function=} - Injectable provider function that returns
   *   the actual controller or string.
   *
   * <a id='controllerAs'></a>
   *
   * - **`controllerAs`** – {string=} – A controller alias name. If present the controller will be
   *   published to scope under the controllerAs name.
   *
   * <a id='resolve'></a>
   *
   * - **`resolve`** - {object.&lt;string, function&gt;=} - An optional map of dependencies which
   *   should be injected into the controller. If any of these dependencies are promises,
   *   the router will wait for them all to be resolved or one to be rejected before the
   *   controller is instantiated. If all the promises are resolved successfully, the values
   *   of the resolved promises are injected and $stateChangeSuccess event is fired. If any
   *   of the promises are rejected the $stateChangeError event is fired. The map object is:
   *
   *   - key - {string}: name of dependency to be injected into controller
   *   - factory - {string|function}: If string then it is alias for service. Otherwise if function,
   *     it is injected and return value it treated as dependency. If result is a promise, it is
   *     resolved before its value is injected into controller.
   *
   * <a id='url'></a>
   *
   * - **`url`** - {string=} - A url with optional parameters. When a state is navigated or
   *   transitioned to, the `$stateParams` service will be populated with any
   *   parameters that were passed.
   *
   * <a id='params'></a>
   *
   * - **`params`** - {object=} - An array of parameter names or regular expressions. Only
   *   use this within a state if you are not using url. Otherwise you can specify your
   *   parameters within the url. When a state is navigated or transitioned to, the
   *   $stateParams service will be populated with any parameters that were passed.
   *
   * <a id='views'></a>
   *
   * - **`views`** - {object=} - Use the views property to set up multiple views or to target views
   *   manually/explicitly.
   *
   * <a id='abstract'></a>
   *
   * - **`abstract`** - {boolean=} - An abstract state will never be directly activated,
   *   but can provide inherited properties to its common children states.
   *
   * <a id='onEnter'></a>
   *
   * - **`onEnter`** - {object=} - Callback function for when a state is entered. Good way
   *   to trigger an action or dispatch an event, such as opening a dialog.
   * If minifying your scripts, make sure to use the `['injection1', 'injection2', function(injection1, injection2){}]` syntax.
   *
   * <a id='onExit'></a>
   *
   * - **`onExit`** - {object=} - Callback function for when a state is exited. Good way to
   *   trigger an action or dispatch an event, such as opening a dialog.
   * If minifying your scripts, make sure to use the `['injection1', 'injection2', function(injection1, injection2){}]` syntax.
   *
   * <a id='reloadOnSearch'></a>
   *
   * - **`reloadOnSearch = true`** - {boolean=} - If `false`, will not retrigger the same state
   *   just because a search/query parameter has changed (via $location.search() or $location.hash()).
   *   Useful for when you'd like to modify $location.search() without triggering a reload.
   *
   * <a id='data'></a>
   *
   * - **`data`** - {object=} - Arbitrary data object, useful for custom configuration.
   *
   * @example
   * <pre>
   * // Some state name examples
   *
   * // stateName can be a single top-level name (must be unique).
   * $stateProvider.state("home", {});
   *
   * // Or it can be a nested state name. This state is a child of the
   * // above "home" state.
   * $stateProvider.state("home.newest", {});
   *
   * // Nest states as deeply as needed.
   * $stateProvider.state("home.newest.abc.xyz.inception", {});
   *
   * // state() returns $stateProvider, so you can chain state declarations.
   * $stateProvider
   *   .state("home", {})
   *   .state("about", {})
   *   .state("contacts", {});
   * </pre>
   *
   * @param {string} name A unique state name, e.g. "home", "about", "contacts".
   * To create a parent/child state use a dot, e.g. "about.sales", "home.newest".
   * @param {object} definition State configuration object.
   */
  this.state = state;
  function state(name, definition) {
    /*jshint validthis: true */
    if (isObject(name)) definition = name;
    else definition.name = name;
    stateQueue.register(definition);
    return this;
  }

  /**
   * @ngdoc object
   * @name ui.router.state.$state
   *
   * @requires $rootScope
   * @requires $q
   * @requires $injector
   * @requires ui.router.state.$view
   * @requires ui.router.state.$stateParams
   * @requires ui.router.router.$urlRouter
   * @requires ui.router.state.$transition
   * @requires ui.router.util.$urlMatcherFactory
   *
   * @property {object} params A param object, e.g. {sectionId: section.id)}, that
   * you'd like to test against the current active state.
   * @property {object} current A reference to the state's config object. However
   * you passed it in. Useful for accessing custom data.
   * @property {object} transition Currently pending transition. A promise that'll
   * resolve or reject.
   *
   * @description
   * `$state` service is responsible for representing states as well as transitioning
   * between them. It also provides interfaces to ask for current state or even states
   * you're coming from.
   */
  this.$get = $get;
  $get.$inject = ['$rootScope', '$q', '$injector', '$view', '$stateParams', '$urlRouter', '$transition', '$urlMatcherFactory'];
  function $get(   $rootScope,   $q,   $injector,   $view,   $stateParams,   $urlRouter,   $transition,   $urlMatcherFactory) {

    // Implicit root state that is always active
    root = stateQueue.register({
      name: '',
      url: '^',
      views: null,
      params: {
        '#': { value: null, type: 'hash'} // Param to hold the "hash" at the end of the URL
      },
      'abstract': true
    }, true);

    root.navigable = null;

    extend($state, {
      params: new StateParams(),
      current: root.self,
      $current: root,
      transition: null
    });

    stateQueue.flush($state);
    stateQueue.autoFlush = true; // Autoflush once we are in runtime

    /**
     * @ngdoc function
     * @name ui.router.state.$state#reload
     * @methodOf ui.router.state.$state
     *
     * @description
     * A method that force reloads the current state, or a partial state hierarchy. All resolves are re-resolved,
     * controllers reinstantiated, and events re-fired.
     *
     * @example
     * <pre>
     * var app angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.reload = function(){
     *     $state.reload();
     *   }
     * });
     * </pre>
     *
     * `reload()` is just an alias for:
     * <pre>
     * $state.transitionTo($state.current, $stateParams, {
     *   reload: true, inherit: false, notify: true
     * });
     * </pre>
     *
     * @param {string=|object=} reloadState - A state name or a state object, which is the root of the resolves to be re-resolved.
     * @example
     * <pre>
     * //assuming app application consists of 3 states: 'contacts', 'contacts.detail', 'contacts.detail.item'
     * //and current state is 'contacts.detail.item'
     * var app angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.reload = function(){
     *     //will reload 'contact.detail' and nested 'contact.detail.item' states
     *     $state.reload('contact.detail');
     *   }
     * });
     * </pre>
     *
     * @returns {promise} A promise representing the state of the new transition. See
     * {@link ui.router.state.$state#methods_go $state.go}.
     */
    $state.reload = function reload(reloadState) {
      var reloadOpt = isDefined(reloadState) ? reloadState : true;
      return $state.transitionTo($state.current, $stateParams, {
        reload: reloadOpt,
        inherit: false,
        notify: false
      });
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#go
     * @methodOf ui.router.state.$state
     *
     * @description
     * Convenience method for transitioning to a new state. `$state.go` calls
     * `$state.transitionTo` internally but automatically sets options to
     * `{ location: true, inherit: true, relative: $state.$current, notify: true }`.
     * This allows you to easily use an absolute or relative to path and specify
     * only the parameters you'd like to update (while letting unspecified parameters
     * inherit from the currently active ancestor states).
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.go('contact.detail');
     *   };
     * });
     * </pre>
     * <img src='../ngdoc_assets/StateGoExamples.png'/>
     *
     * @param {string} to Absolute state name or relative state path. Some examples:
     *
     * - `$state.go('contact.detail')` - will go to the `contact.detail` state
     * - `$state.go('^')` - will go to a parent state
     * - `$state.go('^.sibling')` - will go to a sibling state
     * - `$state.go('.child.grandchild')` - will go to grandchild state
     *
     * @param {object=} params A map of the parameters that will be sent to the state,
     * will populate $stateParams. Any parameters that are not specified will be inherited from currently
     * defined parameters. This allows, for example, going to a sibling state that shares parameters
     * specified in a parent state. Parameter inheritance only works between common ancestor states, I.e.
     * transitioning to a sibling will get you the parameters for all parents, transitioning to a child
     * will get you all current parameters, etc.
     * @param {object=} options Options object. The options are:
     *
     * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
     *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
     * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'),
     *    defines which state to be relative from.
     * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
     * - **`reload`** (v0.2.5) - {boolean=false}, If `true` will force transition even if the state or params
     *    have not changed, aka a reload of the same state. It differs from reloadOnSearch because you'd
     *    use this when you want to force a reload when *everything* is the same, including search params.
     *
     * @returns {promise} A promise representing the state of the new transition.
     *
     * Possible success values:
     *
     * - $state.current
     *
     * <br/>Possible rejection values:
     *
     * - 'transition superseded' - when a newer transition has been started after this one
     * - 'transition prevented' - when `event.preventDefault()` has been called in a `$stateChangeStart` listener
     * - 'transition aborted' - when `event.preventDefault()` has been called in a `$stateNotFound` listener or
     *   when a `$stateNotFound` `event.retry` promise errors.
     * - 'transition failed' - when a state has been unsuccessfully found after 2 tries.
     * - *resolve error* - when an error has occurred with a `resolve`
     *
     */
    $state.go = function go(to, params, options) {
      var defautGoOpts = { relative: $state.$current, inherit: true };
      return $state.transitionTo(to, params, defaults(options, defautGoOpts, defaultTransOpts));
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#redirect
     * @methodOf ui.router.state.$state
     *
     * @description
     * Creates a redirect transition from an existing transition. Used in the context of a callback function
     * which can receive a `$transition$` injectable. The result is then returned from the callback.
     *
     * @example
     * <pre>
     * $transitionProvider.on({ from: "first", to: "second" }, function($state, $transition$) {
     *   var params = { foo: 'bar' };
     *   return $state.redirect($transition$).to("third", params);
     * });
     * </pre>
     *
     * @returns {Transition} A new {@link ui.router.state.type:Transition `Transition`} that
     * targets a new state or set of parameters.
     */
    $state.redirect = function redirect(transition) {
      return {
        to: function(state, params, options) {
          return transition.redirect(matcher.reference(state, null, params), options);
        }
      };
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#transitionTo
     * @methodOf ui.router.state.$state
     *
     * @description
     * Low-level method for transitioning to a new state. {@link ui.router.state.$state#methods_go $state.go}
     * uses `transitionTo` internally. `$state.go` is recommended in most situations.
     *
     * @example
     * <pre>
     * var app = angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.transitionTo('contact.detail');
     *   };
     * });
     * </pre>
     *
     * @param {string} to State name.
     * @param {object=} toParams A map of the parameters that will be sent to the state,
     * will populate $stateParams.
     * @param {object=} options Options object. The options are:
     *
     * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
     *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
     * - **`inherit`** - {boolean=false}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=}, When transitioning with relative path (e.g '^'),
     *    defines which state to be relative from.
     * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
     * - **`reload`** (v0.2.5) - {boolean=false}, If `true` will force transition even if the state or params
     *    have not changed, aka a reload of the same state. It differs from reloadOnSearch because you'd
     *    use this when you want to force a reload when *everything* is the same, including search params.
     *
     * @returns {promise} A promise representing the state of the new transition. See
     * {@link ui.router.state.$state#methods_go $state.go}.
     */
    $state.transitionTo = function transitionTo(to, toParams, options) {
      options = defaults(options, defaultTransOpts);

      // If we're reloading, find the state object to reload from
      if (isObject(options.reload) && !options.reload.name) { throw new Error('Invalid reload state object'); }
      options.reloadState = options.reload === true ? $state.$current.path[0] : matcher.find(options.reload, options.relative);
      if (options.reload && !options.reloadState) {
        throw new Error(`No such reload state '${(isString(options.reload) ? options.reload : options.reload.name)}'`);
      }

      var transition = transQueue.push($transition.create(
        matcher.reference($state.current, null, extend({}, $stateParams)),
        matcher.reference(to, options && options.relative, toParams),
        extend(options, {
          current: transQueue.last.bind(transQueue)
        })
      ));

      var stateHandler = {

        runTransition: function runTransition(transition) {
          // When the transition promise (prepromise; before callbacks) is resolved/rejected, update the $state service
          function handleSuccess() { return stateHandler.transitionSuccess(transition); }
          function handleFailure(error) { return stateHandler.transitionFailure(error); }
          transition.run();
          return transition.prepromise.then(handleSuccess, handleFailure);
        },

        transitionSuccess: function transitionSuccess(transition) {
          // TODO: sync on entering state, not transition success?
          $view.sync(transition.views());
          // TODO: Refactor this stuff. Maybe a Path can return views() for elements
          transition.exiting().forEach(function(state) {
            forEach(state.views, function (view, key) {
              var found = $view.find(key, state.parent);
              found && $view.reset(found);
            });
          });

          // Update globals in $state
          $state.$current = transition.$to().$state();
          $state.current = transition.$to().state();

          stateHandler.updateStateParams(transition);
          transQueue.clear();
          return transition;
        },

        transitionFailure: function transitionFailure(error) {
          // Handle redirect and abort
          if (error instanceof TransitionRejection) {
            if (error.type === RejectType.IGNORED) {
              // Update $stateParmas/$state.params/$location.url if transition ignored, but dynamic params have changed.
              if (!$state.$current.params.$$filter(not(not(prop('dynamic')))).$$equals($stateParams, transition.params())) {
                stateHandler.updateStateParams(transition);
              }
              return $state.current;
            }

            if (error.type === RejectType.SUPERSEDED) {
              //if (error.redirected && error.detail instanceof Transition) { // TODO: expose Transition class for instanceof
              if (error.redirected && error.detail && isFunction(error.detail.run)) {
                transQueue.push(error.detail);
                return stateHandler.runTransition(error.detail);
              }
            }

            return $q.reject(error);
          }

          return $q.reject(error);
        },

        updateStateParams: function updateStateParams(transition) {
          var options = transition.options();
          $state.params = transition.params();
          copy($state.params, $stateParams);
          $stateParams.$sync().$off();

          if (options.location && $state.$current.navigable) {
            $urlRouter.push($state.$current.navigable.url, $stateParams, { replace: options.location === 'replace' });
          }

          $urlRouter.update(true);
        }
      };

      var result = stateHandler.runTransition(transition);

      // Pop the transition off the queue
      result.finally(pipe(val(transition), transQueue.pop.bind(transQueue)));

      // Return a promise for the transition, which also has the transition object on it.
      // Allows, for instance:
      // $state.go("foo").transition.redirects.then(function() { alert("Ive been redirected to state " + $state.current.name); }
      return extend(result.then(identity), { transition: transition });
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#is
     * @methodOf ui.router.state.$state
     *
     * @description
     * Similar to {@link ui.router.state.$state#methods_includes $state.includes},
     * but only checks for the full state name. If params is supplied then it will be
     * tested for strict equality against the current active params object, so all params
     * must match with none missing and no extras.
     *
     * @example
     * <pre>
     * $state.$current.name = 'contacts.details.item';
     *
     * // absolute name
     * $state.is('contact.details.item'); // returns true
     * $state.is(contactDetailItemStateObject); // returns true
     *
     * // relative name (. and ^), typically from a template
     * // E.g. from the 'contacts.details' template
     * <div ng-class="{highlighted: $state.is('.item')}">Item</div>
     * </pre>
     *
     * @param {string|object} stateOrName The state name (absolute or relative) or state object you'd like to check.
     * @param {object=} params A param object, e.g. `{sectionId: section.id}`, that you'd like
     * to test against the current active state.
     * @param {object=} options An options object.  The options are:
     *
     * - **`relative`** - {string|object} -  If `stateOrName` is a relative state name and `options.relative` is set, .is will
     * test relative to `options.relative` state (or name).
     *
     * @returns {boolean} Returns true if it is the state.
     */
    $state.is = function is(stateOrName, params, options) {
      options = defaults(options, { relative: $state.$current });
      var state = matcher.find(stateOrName, options.relative);
      if (!isDefined(state)) return undefined;
      if ($state.$current !== state) return false;
      return isDefined(params) && params !== null ? state.params.$$equals($stateParams, params) : true;
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#includes
     * @methodOf ui.router.state.$state
     *
     * @description
     * A method to determine if the current active state is equal to or is the child of the
     * state stateName. If any params are passed then they will be tested for a match as well.
     * Not all the parameters need to be passed, just the ones you'd like to test for equality.
     *
     * @example
     * Partial and relative names
     * <pre>
     * $state.$current.name = 'contacts.details.item';
     *
     * // Using partial names
     * $state.includes("contacts"); // returns true
     * $state.includes("contacts.details"); // returns true
     * $state.includes("contacts.details.item"); // returns true
     * $state.includes("contacts.list"); // returns false
     * $state.includes("about"); // returns false
     *
     * // Using relative names (. and ^), typically from a template
     * // E.g. from the 'contacts.details' template
     * <div ng-class="{highlighted: $state.includes('.item')}">Item</div>
     * </pre>
     *
     * Basic globbing patterns
     * <pre>
     * $state.$current.name = 'contacts.details.item.url';
     *
     * $state.includes("*.details.*.*"); // returns true
     * $state.includes("*.details.**"); // returns true
     * $state.includes("**.item.**"); // returns true
     * $state.includes("*.details.item.url"); // returns true
     * $state.includes("*.details.*.url"); // returns true
     * $state.includes("*.details.*"); // returns false
     * $state.includes("item.**"); // returns false
     * </pre>
     *
     * @param {string} stateOrName A partial name, relative name, or glob pattern
     * to be searched for within the current state name.
     * @param {object=} params A param object, e.g. `{sectionId: section.id}`,
     * that you'd like to test against the current active state.
     * @param {object=} options An options object.  The options are:
     *
     * - **`relative`** - {string|object=} -  If `stateOrName` is a relative state reference and `options.relative` is set,
     * .includes will test relative to `options.relative` state (or name).
     *
     * @returns {boolean} Returns true if it does include the state
     */
    $state.includes = function includes(stateOrName, params, options) {
      options = defaults(options, { relative: $state.$current });
      var glob = isString(stateOrName) && Glob.fromString(stateOrName);

      if (glob) {
        if (!glob.matches($state.$current.name)) return false;
        stateOrName = $state.$current.name;
      }
      var state = matcher.find(stateOrName, options.relative), include = $state.$current.includes;

      if (!isDefined(state)) return undefined;
      if (!isDefined(include[state.name])) return false;
      return params ? equalForKeys(state.params.$$values(params), $stateParams, objectKeys(params)) : true;
    };


    /**
     * @ngdoc function
     * @name ui.router.state.$state#href
     * @methodOf ui.router.state.$state
     *
     * @description
     * A url generation method that returns the compiled url for the given state populated with the given params.
     *
     * @example
     * <pre>
     * expect($state.href("about.person", { person: "bob" })).toEqual("/about/bob");
     * </pre>
     *
     * @param {string|object} stateOrName The state name or state object you'd like to generate a url from.
     * @param {object=} params An object of parameter values to fill the state's required parameters.
     * @param {object=} options Options object. The options are:
     *
     * - **`lossy`** - {boolean=true} -  If true, and if there is no url associated with the state provided in the
     *    first parameter, then the constructed href url will be built from the first navigable ancestor (aka
     *    ancestor with a valid url).
     * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'), 
     *    defines which state to be relative from.
     * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
     *
     * @returns {string} compiled state url
     */
    $state.href = function href(stateOrName, params, options) {
      var defaultHrefOpts = {
        lossy:    true,
        inherit:  true,
        absolute: false,
        relative: $state.$current
      };
      options = defaults(options, defaultHrefOpts);

      var state = matcher.find(stateOrName, options.relative);

      if (!isDefined(state)) return null;
      if (options.inherit) params = $stateParams.$inherit(params || {}, $state.$current, state);

      var nav = (state && options.lossy) ? state.navigable : state;

      if (!nav || nav.url === undefined || nav.url === null) {
        return null;
      }
      return $urlRouter.href(nav.url, state.params.$$values(params), {
        absolute: options.absolute
      });
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#get
     * @methodOf ui.router.state.$state
     *
     * @description
     * Returns the state configuration object for any specific state or all states.
     *
     * @param {string|Object=} stateOrName (absolute or relative) If provided, will only get the config for
     * the requested state. If not provided, returns an array of ALL state configs.
     * @param {string|object=} context When stateOrName is a relative state reference, the state will be retrieved relative to context.
     * @returns {Object|Array} State configuration object or array of all objects.
     */
    $state.get = function (stateOrName, context) {
      if (arguments.length === 0) return objectKeys(states).map(function(name) { return states[name].self; });
      return (matcher.find(stateOrName, context || $state.$current) || {}).self || null;
    };

    return $state;
  }
}

export function StateParams() { }

$StateParamsProvider.$inject = [];
function $StateParamsProvider() {

  function stateParamsFactory() {
    var observers = {}, current = {};

    function unhook(key, func) {
      return function() {
        forEach(key.split(" "), function(k) {
          observers[k].splice(observers[k].indexOf(func), 1);
        });
      };
    }

    function observeChange(key, val?: any) {
      if (!observers[key] || !observers[key].length) return;

      forEach(observers[key], function(func) {
        func(val);
      });
    }


    StateParams.prototype.$digest = function() {
      forEach(this, function(val, key) {
        if (val == current[key] || !this.hasOwnProperty(key)) return;
        current[key] = val;
        observeChange(key, val);
      }, this);
    };

    /**
     * Merges a set of parameters with all parameters inherited between the common parents of the
     * current state and a given destination state.
     *
     * @param {Object} newParams The set of parameters which will be composited with inherited params.
     * @param {Object} $current Internal definition of object representing the current state.
     * @param {Object} $to Internal definition of object representing state to transition to.
     */
    StateParams.prototype.$inherit = function(newParams, $current, $to) {
      var parents = ancestors($current, $to), parentParams, inherited = {}, inheritList = [];

      for (var i in parents) {
        if (!parents[i].params) continue;
        parentParams = objectKeys(parents[i].params);
        if (!parentParams.length) continue;

        for (var j in parentParams) {
          if (arraySearch(inheritList, parentParams[j]) >= 0) continue;
          inheritList.push(parentParams[j]);
          inherited[parentParams[j]] = this[parentParams[j]];
        }
      }
      return extend({}, inherited, newParams);
    };

    StateParams.prototype.$set = function(params, url) {
      var hasChanged = false, abort = false;

      if (url) {
        forEach(params, function(val, key) {
          if ((url.parameters(key) || {}).dynamic !== true) abort = true;
        });
      }
      if (abort) return false;

      forEach(params, function(val, key) {
        if (val != this[key]) {
          this[key] = val;
          observeChange(key);
          hasChanged = true;
        }
      }, this);

      this.$sync();
      return hasChanged;
    };

    StateParams.prototype.$sync = function() {
      copy(this, current);
      return this;
    };

    StateParams.prototype.$off = function() {
      observers = {};
      return this;
    };

    StateParams.prototype.$raw = function() {
      var raw = {};
      for(var key in this) {
        if (!StateParams.prototype.hasOwnProperty(key))
          raw[key] = this[key];
      }
      return raw;
    };

    StateParams.prototype.$localize = function(state, params) {
      var localized = new StateParams();
      params = params || this;

      forEach(state.params, function(val, key) {
        localized[key] = params[key];
      });
      return localized;
    };

    StateParams.prototype.$observe = function(key, func) {
      forEach(key.split(" "), function(k) {
        (observers[k] || (observers[k] = [])).push(func);
      });
      return unhook(key, func);
    };

    return new StateParams();
  }

  var global = stateParamsFactory();

  this.$get = $get;
  $get.$inject = ['$rootScope'];
  function $get(   $rootScope) {

    $rootScope.$watch(function() {
      global.$digest();
    });

    return global;
  }
}

angular.module('ui.router.state')
  .provider('$stateParams', <IServiceProviderFactory> $StateParamsProvider)
  .provider('$state', <IServiceProviderFactory> $StateProvider)
  .run(['$state', function($state) { /* This effectively calls $get() to init when we enter runtime */ }]);
