/**
 * Represents the union of a template and (optional) controller.
 *
 * @param {Object} config The view's configuration
 *
 * @returns {Object} New `ViewConfig` object
 */
function ViewConfig(config) {
  this.config = config;
}

/**
 * Gets the controller for a view configuration.
 *
 * @param {Object} locals The view's locals, used when the view has a controller provider.
 *
 * @returns {Function|Promise.<Function>} Returns a controller, or a promise that resolves to a controller.
 */
ViewConfig.prototype.controller = function(locals) {
  var cfg = this.config, provider = this.config.controllerProvider;
  return isInjectable(provider) ? locals.invokeLater(provider) : cfg.controller;
};

/**
 * Checks a view configuration to ensure that it specifies a template.
 *
 * @return {boolean} Returns `true` if the configuration contains a valid template, otherwise `false`.
 */
ViewConfig.prototype.hasTemplate = function() {
  return !!(this.config.template || this.config.templateUrl || this.config.templateProvider);
};

ViewConfig.prototype.template = function($factory, params, locals) {
  return $factory.fromConfig(this.config, params, locals);
};

/**
 * Class responsible for queuing view configurations waiting to be populated into views.
 */
function ViewQueue(views) {
  this.map = {};
  this.queued = {};
  this.waiting = [];
  this.views = views;
}

/**
 * Pushes a view configuration to be assigned to a named `uiView` element that either already
 * exists, or is waiting to be created. If the view identified by `name` exists, the
 * configuration will be assigned immediately. If it does not, and `async` is `true`, the
 * configuration will be queued for assignment until the view exists.
 *
 * @param {String} name The fully-qualified view name the configuration should be assigned to.
 * @param {Boolean} async Determines whether the configuration can be queued if the view does
 *                        not currently exist on the page. If the view does not exist and
 *                        `async` is `false`, will return a rejected promise.
 * @param {Object} config The view configuration to be assigned to the named `uiView`. Should
 *                        include a `$template` key containing the HTML string to render, and
 *                        can optionally include a `$controller`, `$locals`, and a `$context`
 *                        object, which represents the object responsibile for the view (i.e.
 *                        a UI state object), that can be used to look up the view later by a
 *                        relative/non-fully-qualified name.
 */
ViewQueue.prototype.push = function(name, async, config) {
  if (config && config.$context && this.waiting.length) {
    this.digest(name, config.$context);
  }
  if (this.views[name]) {
    this.views[name](config);
    this.views[name].$config = config;
    return config;
  }
  var err = "Attempted to synchronously load template into non-existent view " + name;
  return (async) ? (this.map[name] = config) : new Error(err);
};

/**
 * Pops a queued view configuration for a `uiView` that has come into existence.
 *
 * @param {String} name The fully-qualified dot-separated name of the view.
 * @param {Function} callback The initialization function passed by `uiView` to
 *                            `$view.register()`.
 */
ViewQueue.prototype.pop = function(name, callback) {
  if (!this.queued[name]) return;
  callback(this.queued[name]);
  this.views[name].$config = this.queued[name];
  delete this.queued[name];
};

/**
 * Invoked when views have been queued for which fully-qualified names cannot be resolved
 * (i.e. the parent view exists but has not been loaded/configured yet). Checks the list to
 * see if the context of the most-recently-resolved view matches the parent context being
 * waited for.
 *
 * @param {String} name The name of the loaded view.
 * @param {Object} context The context object responsible for the view.
 */
ViewQueue.prototype.digest = function(name, context) {
  for (var i = this.waiting.length - 1; i >= 0; i--) {
    if (this.waiting[i].context !== context) continue;
    this.waiting.splice(i, 1)[0].defer.resolve(name);
  }
};

ViewQueue.prototype.waitFor = function(context, defer) {
  this.waiting.push({ context: context, defer: defer });
  return defer ? defer.promise : null;
};

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
$View.$inject = ['$rootScope', '$templateFactory', '$q'];
function $View(   $rootScope,   $templateFactory,   $q) {

  var viewDefs = {}, viewQueue = new ViewQueue(viewDefs);

  /**
   * Maps a value to a promise resolution or rejection.
   */
  function qIfy(val) {
    return $q[val instanceof Error ? "reject" : "when"](val);
  }

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
  this.load = function load (name, options) {

    var $template, $parent, viewConfig = new ViewConfig(defaults(options, {
      template:           undefined,
      templateUrl:        undefined,
      templateProvider:   undefined,
      controller:         null,
      controllerAs:       null,
      controllerProvider: null
    }));

    var opts = defaults(options, {
      context:            null,
      parent:             null,
      locals:             null,
      notify:             true,
      async:              true,
      params:             {}
    });

    if (!viewConfig.hasTemplate()) return qIfy(new Error('No template configuration specified for ' + name));

    if (opts.notify) {
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
      $rootScope.$broadcast('$viewContentLoading', extend({ targetView: name }, opts));
    }
    var fqn = (opts.parent) ? this.find(name, opts.parent) : name;

    return $q.all({
      template: $q.when(viewConfig.template($templateFactory, opts.params, opts.locals)),
      parent: fqn ? $q.when(fqn) : viewQueue.waitFor(opts.parent, $q.defer()).then(function(parent) {
        return parent + "." + name;
      })
    }).then(function(results) {
      return qIfy(viewQueue.push(results.parent, viewConfig, {
        async:    opts.async,
        template: results.template,
        locals:   opts.locals,
        context:  opts.context
      }));
    });
  };

  /**
   * Resets a view to its initial state.
   *
   * @param {String} name The fully-qualified name of the view to reset.
   * @return {Boolean} Returns `true` if the view exists, otherwise `false`.
   */
  this.reset = function reset (name) {
    if (!viewDefs[name]) return false;
    return viewQueue.push(name, false, null) === null;
  };

  /**
   * Syncs a set of view configurations 
   */
  this.sync = function sync (configs) {
    forEach(configs, function(cfg) {
      var state = cfg[0], views = cfg[1], params = cfg[2], locals = cfg[3];

      forEach(views, function(view, name) {
        //if (view.controllerProvider) debugger;
        this.load(name, extend(view, {
          params: params,
          locals: locals,
          context: state,
          parent: state.parent.name ? state.parent : null
        }));
      }, this);
    }, this);
  };

  /**
   * Allows a `ui-view` element to register its canonical name with a callback that allows it to
   * be updated with a template, controller, and local variables.
   *
   * @param {String} name The fully-qualified name of the `ui-view` object being registered.
   * @param {Function} callback A callback that receives updates to the content & configuration
   *                   of the view.
   * @return {Function} Returns a de-registration function used when the view is destroyed.
   */
  this.register = function register (name, callback) {
    viewDefs[name] = callback;
    viewDefs[name].$config = null;
    viewQueue.pop(name, callback);

    return function() {
      delete viewDefs[name];
    };
  };

  /**
   * Determines whether a particular view exists on the page, by querying the fully-qualified name.
   *
   * @param {String} name The fully-qualified dot-separated name of the view, if `context` is not
            specified. If `context` is specified, `name` should be relative to the parent `context`.
   * @param {Object} context Optional parent context in which to look for the named view.
   * @return {Boolean} Returns `true` if the view exists on the page, otherwise `false`.
   */
  this.exists = function exists (name, context) {
    return isDefined(viewDefs[context ? this.find(name, context) : name]);
  };

  /**
   * Resolves a view's relative name to a fully-qualified name by looking up the parent of the view,
   * by the parent view's context object.
   *
   * @param {String} name A relative view name.
   * @param {Object} context The context object of the parent view in which to look up the view to
   *        return.
   * @return {String} Returns the fully-qualified view name, or `null`, if `context` cannot be found.
   */
  this.find = function find (name, context) {
    var result;

    if (isArray(name)) {
      return map(name, function(name) { return this.find(name, context); });
    }

    angular.forEach(viewDefs, function(def, absName) {
      if (!def || !def.$config || context !== def.$config.$context) {
        return;
      }
      result = absName + "." + name;
    });
    return result;
  };

  /**
   * Returns the list of views currently available on the page, by fully-qualified name.
   *
   * @return {Array} Returns an array of fully-qualified view names.
   */
  this.available = function available () {
    return objectKeys(viewDefs);
  };

  /**
   * Returns the list of views on the page containing loaded content.
   *
   * @return {Array} Returns an array of fully-qualified view names.
   */
  this.active = function active () {
    var result = [];

    angular.forEach(viewDefs, function(config, key) {
      if (config && config.$config) {
        result.push(key);
      }
    });
    return result;
  };
}

angular.module('ui.router.state').service('$view', $View);
