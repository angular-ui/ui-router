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
$View.$inject = ['$rootScope', '$templateFactory', '$q', '$injector'];
function $View(   $rootScope,   $templateFactory,   $q,   $injector) {

  var views = {}, queued = {}, waiting = [];

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
  function push(name, async, config) {
    if (config && config.$context && waiting.length) {
      tick(name, config.$context);
    }
    if (views[name]) {
      views[name](config);
      views[name].$config = config;
      return config;
    }
    if (!async) {
      return $q.reject(new Error("Attempted to synchronously load template into non-existent view " + name));
    }
    queued[name] = config;
    return config;
  }


  /**
   * Pops a queued view configuration for a `uiView` that has come into existence.
   *
   * @param {String} name The fully-qualified dot-separated name of the view.
   * @param {Function} callback The initialization function passed by `uiView` to
   *                            `$view.register()`.
   */
  function pop(name, callback) {
    if (queued[name]) {
      callback(queued[name]);
      views[name].$config = queued[name];
      delete queued[name];
    }
  }


  /**
   * Invoked when views have been queued for which fully-qualified names cannot be resolved
   * (i.e. the parent view exists but has not been loaded/configured yet). Checks the list to
   * see if the context of the most-recently-resolved view matches the parent context being
   * waited for.
   *
   * @param {String} name The name of the loaded view.
   * @param {Object} context The context object responsible for the view.
   */
  function tick(name, context) {
    for (var i = waiting.length - 1; i >= 0; i--) {
      if (waiting[i].context === context) {
        waiting.splice(i, 1)[0].defer.resolve(name);
      }
    }
  }

  /**
   * Returns a controller from a hash of options, either by executing an injectable
   * `controllerProvider` function, or by returning the value of the `controller` key.
   *
   * @param {Object} options An object hash with either a `controllerProvider` key or a
   *                         `controller` key.
   * @return {*} Returns a controller.
   */
  function resolveController(options) {
    if (isFunction(options.controllerProvider) || isArray(options.controllerProvider)) {
      return $injector.invoke(options.controllerProvider, null, options.locals);
    }
    return options.controller;
  }

  /**
   * Checks a view configuration to ensure that it specifies a template.
   *
   * @param {Object} options An object hash with either a `template` key, a `templateUrl` key or a
   *                         `templateProvider` key.
   * @return {boolean} Returns `true` if the configuration is valid, otherwise `false`.
   */
  function hasValidTemplate(options) {
    return (options.template || options.templateUrl || options.templateProvider);
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
    var $template, $parent, defaults = {
      template:           undefined,
      templateUrl:        undefined,
      templateProvider:   undefined,
      controller:         null,
      controllerAs:       null,
      controllerProvider: null,
      context:            null,
      parent:             null,
      locals:             null,
      notify:             true,
      async:              true,
      params:             {}
    };
    options = extend(defaults, options);

    if (!hasValidTemplate(options)) return $q.reject(new Error('No template configuration specified for ' + name));
    $template = $templateFactory.fromConfig(options, options.params, options.locals);

    if ($template && options.notify) {
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
       * $scope.$on('$viewContentLoading',
       * function(event, viewConfig){
       *     // Access to all the view config properties.
       *     // and one special property 'targetView'
       *     // viewConfig.targetView
       * });
       * </pre>
       */
      options.targetView = name;
      $rootScope.$broadcast('$viewContentLoading', options);
    }
    var promises = [$q.when($template)], fqn = (options.parent) ? this.find(name, options.parent) : name;

    if (!fqn) {
      var self = this;
      $parent = $q.defer();

      promises.push($parent.promise.then(function(parent) {
        fqn = parent + "." + name;
      }));

      waiting.push({ context: options.parent, defer: $parent });
    }

    return $q.all(promises).then(function(results) {
      return push(fqn, options.async, {
        template:     results[0],
        controller:   resolveController(options),
        controllerAs: options.controllerAs,
        locals:       options.locals,
        context:      options.context
      });
    });
  };

  /**
   * Resets a view to its initial state.
   *
   * @param {String} name The fully-qualified name of the view to reset.
   * @return {Boolean} Returns `true` if the view exists, otherwise `false`.
   */
  this.reset = function reset (name) {
    if (!views[name]) {
      return false;
    }
    return push(name, false, null) === null;
  };

  /**
   * Syncs a set of view configurations 
   *
   * @param {String} name The fully-qualified name of the view to reset.
   * @return {Boolean} Returns `true` if the view exists, otherwise `false`.
   */
  this.sync = function sync (views, options) {
    forEach(views, function(view) {
      // (1) Determine locals for template (should be packed in the view config)
      // (2) Determine locals for controller
      // (3) Maybe move the above logic to load()
      this.load(view[0], extend(copy(options), view[1], { locals: $q.all() })
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
    views[name] = callback;
    views[name].$config = null;
    pop(name, callback);

    return function() {
      delete views[name];
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
    return isDefined(views[context ? this.find(name, context) : name]);
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

    if (angular.isArray(name)) {
      result = [];

      angular.forEach(name, function(name) {
        result.push(this.find(name, context));
      }, this);

      return result;
    }

    angular.forEach(views, function(def, absName) {
      if (!def || !def.$config || context !== def.$config.$context) {
        return;
      }
      // @TODO
    };
    options = extend(defaults, options);
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
    views[name] = callback;
    views[name].$config = null;
    pop(name, callback);

    return function() {
      delete views[name];
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
    return isDefined(views[context ? this.find(name, context) : name]);
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

    if (angular.isArray(name)) {
      result = [];

      angular.forEach(name, function(name) {
        result.push(this.find(name, context));
      }, this);

      return result;
    }

    angular.forEach(views, function(def, absName) {
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
    return keys(views);
  };

  /**
   * Returns the list of views on the page containing loaded content.
   *
   * @return {Array} Returns an array of fully-qualified view names.
   */
  this.active = function active () {
    var result = [];

    angular.forEach(views, function(config, key) {
      if (config && config.$config) {
        result.push(key);
      }
    });
    return result;
  };
}

angular.module('ui.router.state').service('$view', $View);
