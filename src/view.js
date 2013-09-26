$View.$inject = ['$rootScope', '$templateFactory', '$q'];
function $View(   $rootScope,   $templateFactory,   $q) {

  var views = {}, queued = {}, waiting = [];

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


  function pop(name, callback) {
    if (queued[name]) {
      callback(queued[name]);
      delete queued[name];
    }
  }


  function tick(name, context) {
    for (var i = waiting.length - 1; i >= 0; i--) {
      if (waiting[i].context === context) {
        waiting.splice(i, 1)[0].defer.resolve(name);
      }
    }
  }

  /**
   * Uses `$templateFactory` to load a template from a configuration object into a named view.
   *
   * @param {String} name The fully-qualified name of the view to load the template into
   * @param {Object} options The options used to load the template:
   * @param {Boolean} options.notify Indicates whether a `$viewContentLoading` event should be
   *    this call.
   * @params {*} options.* Accepts the full list of parameters and options accepted by
   *    `$templateFactory.fromConfig()`, including `params` and `locals`.
   * @return {Promise.<string>} Returns a promise that resolves to the value of the template loaded.
   */
  this.load = function load (name, options) {
    var $template, $parent, defaults = {
      template:         undefined,
      templateUrl:      undefined,
      templateProvider: undefined,
      controller:       null,
      context:          null,
      parent:           null,
      locals:           null,
      notify:           true,
      async:            true,
      params:           {}
    };
    options = extend(defaults, options);

    if (!options.template && !options.templateUrl && !options.templateProvider) {
      return $q.reject(new Error('No template configuration specified for ' + name));
    }
    $template = $templateFactory.fromConfig(options, options.params, options.locals);

    if (options.notify) {
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
      tick(fqn, options.context);
      return push(fqn, options.async, {
        $template:   results[0],
        $controller: options.controller,
        $locals:     options.locals,
        $context:    options.context
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
