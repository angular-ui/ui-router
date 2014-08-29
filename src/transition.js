// temporary to write specs for internals
var Path;


/**
 * @ngdoc object
 * @name ui.router.state.$transitionProvider
 */
$TransitionProvider.$inject = [];
function $TransitionProvider() {

  var $transition = {}, events, stateMatcher = angular.noop, abstractKey = 'abstract';

  function pluck(collection, key) {
    var result = isArray(collection) ? [] : {};

    forEach(collection, function(val, i) {
      result[i] = isFunction(key) ? key(val) : val[key];
    });
    return result;
  }

  function map(collection, callback) {
    var result = isArray(collection) ? [] : {};

    forEach(collection, function(val, i) {
      result[i] = callback(val, i);
    });
    return result;
  }

  // $transitionProvider.on({ from: "home", to: "somewhere.else" }, function($transition$, $http) {
  //   // ...
  // });
  this.on = function(states, callback) {
  };

  // $transitionProvider.onEnter({ from: "home", to: "somewhere.else" }, function($transition$, $http) {
  //   // ...
  // });
  this.onEnter = function(states, callback) {
  };

  // $transitionProvider.onExit({ from: "home", to: "somewhere.else" }, function($transition$, $http) {
  //   // ...
  // });
  this.onExit = function(states, callback) {
  };

  // $transitionProvider.onSuccess({ from: "home", to: "somewhere.else" }, function($transition$, $http) {
  //   // ...
  // });
  this.onSuccess = function(states, callback) {
  };

  // $transitionProvider.onError({ from: "home", to: "somewhere.else" }, function($transition$, $http) {
  //   // ...
  // });
  this.onError = function(states, callback) {
  };


  /**
   * @ngdoc service
   * @name ui.router.state.$transition
   *
   * @requires $q
   * @requires $injector
   * @requires ui.router.util.$resolve
   *
   * @description
   * The `$transition` service manages changes in states and parameters.
   */
  this.$get = $get;
  $get.$inject = ['$q', '$injector', '$resolve', '$stateParams'];
  function $get(   $q,   $injector,   $resolve,   $stateParams) {

    var from = { state: null, params: null },
        to   = { state: null, params: null };

    /**
     * @ngdoc object
     * @name ui.router.state.type:Transition
     *
     * @description
     * Represents a transition between two states, and contains all contextual information about the
     * to/from states and parameters, as well as the list of states being entered and exited as a
     * result of this transition.
     *
     * @param {Object} fromState The origin {@link ui.router.state.$stateProvider#state state} from which the transition is leaving.
     * @param {Object} fromParams An object hash of the current parameters of the `from` state.
     * @param {Object} toState The target {@link ui.router.state.$stateProvider#state state} being transitioned to.
     * @param {Object} toParams An object hash of the target parameters for the `to` state.
     * @param {Object} options An object hash of the options for this transition.
     *
     * @returns {Object} New `Transition` object
     */
    function Transition(fromState, fromParams, toState, toParams, options) {
      var keep = 0, state, retained = [], entering = [], exiting = [];
      var hasRun = false, hasCalculated = false;

      var states = {
        to: stateMatcher(toState, options),
        from: stateMatcher(fromState, options)
      };

      function isTargetStateValid() {
        var state = stateMatcher(toState, options);

        if (!isDefined(state)) {
          if (!options || !options.relative) return "No such state " + angular.toJson(toState);
          return "Could not resolve " + angular.toJson(toState) + " from state " + angular.toJson(options.relative);
        }
        if (state[abstractKey]) return "Cannot transition to abstract state " + angular.toJson(toState);
        return null;
      }

      function hasBeenSuperseded() {
        return !(fromState === from.state && fromParams === from.params);
      }

      function calculateTreeChanges() {
        if (hasCalculated) return;

        state = toState.path[keep];

        while (state && state === fromState.path[keep] && equalForKeys(toParams, fromParams, state.ownParams)) {
          retained.push(state);
          keep++;
          state = toState.path[keep];
        }

        for (var i = fromState.path.length - 1; i >= keep; i--) {
          exiting.push(fromState.path[i]);
        }

        for (i = keep; i < toState.path.length; i++) {
          entering.push(toState.path[i]);
        }
        hasCalculated = true;
      }


      extend(this, {
        /**
         * @ngdoc function
         * @name ui.router.state.type:Transition#from
         * @methodOf ui.router.state.type:Transition
         *
         * @description
         * Returns the origin state of the current transition, as passed to the `Transition` constructor.
         *
         * @returns {Object} The origin {@link ui.router.state.$stateProvider#state state} of the transition.
         */
        from: extend(function() { return fromState; }, {

          /**
           * @ngdoc function
           * @name ui.router.state.type:Transition.from#state
           * @methodOf ui.router.state.type:Transition
           *
           * @description
           * Returns the object definition of the origin state of the current transition.
           *
           * @returns {Object} The origin {@link ui.router.state.$stateProvider#state state} of the transition.
           */
          state: function() {
            return states.from && states.from.self;
          },

          $state: function() {
            return states.from;
          }
        }),

        /**
         * @ngdoc function
         * @name ui.router.state.type:Transition#to
         * @methodOf ui.router.state.type:Transition
         *
         * @description
         * Returns the target state of the current transition, as passed to the `Transition` constructor.
         *
         * @returns {Object} The target {@link ui.router.state.$stateProvider#state state} of the transition.
         */
        to: extend(function() { return toState; }, {

          /**
           * @ngdoc function
           * @name ui.router.state.type:Transition.to#state
           * @methodOf ui.router.state.type:Transition
           *
           * @description
           * Returns the object definition of the target state of the current transition.
           *
           * @returns {Object} The target {@link ui.router.state.$stateProvider#state state} of the transition.
           */
          state: function() {
            return states.to && states.to.self;
          },

          $state: function() {
            return states.to;
          }
        }),

        isValid: function() {
          return isTargetStateValid() === null && !hasBeenSuperseded();
        },

        rejection: function() {
          var reason = isTargetStateValid();
          return reason ? $q.reject(new Error(reason)) : null;
        },

        /**
         * @ngdoc function
         * @name ui.router.state.type:Transition#params
         * @methodOf ui.router.state.type:Transition
         *
         * @description
         * Gets the origin and target parameters for the transition.
         *
         * @returns {Object} An object with `to` and `from` keys, each of which contains an object hash of
         * state parameters.
         */
        params: function() {
          // toParams = (options.inherit) ? inheritParams(fromParams, toParams, from, toState);
          return { from: fromParams, to: toParams };
        },

        options: function() {
          return options;
        },

        entering: function() {
          calculateTreeChanges();
          return extend(pluck(entering, 'self'), new Path(entering));
        },

        exiting: function() {
          calculateTreeChanges();
          return extend(pluck(entering, 'self'), new Path(exiting));
        },

        retained: function() {
          calculateTreeChanges();
          return pluck(retained, 'self');
        },

        views: function() {
          return map(entering, function(state) {
            return [state.self, state.views];
          });
        },

        redirect: function(to, params, options) {
          if (to === toState && params === toParams) return false;
          return new Transition(fromState, fromParams, to, params, options || this.options());
        },

        ensureValid: function(failHandler) {
          if (this.isValid()) return $q.when(this);
          return $q.when(failHandler(this));
        },

        /**
         * @ngdoc function
         * @name ui.router.state.type:Transition#ignored
         * @methodOf ui.router.state.type:Transition
         *
         * @description
         * Indicates whether the transition should be ignored, based on whether the to and from states are the
         * same, and whether the `reload` option is set.
         *
         * @returns {boolean} Whether the transition should be ignored.
         */
        ignored: function() {
          return (toState === fromState && !options.reload);
        },

        run: function() {
          var exiting = this.exiting().$$exit();
          if (exiting !== true) return exiting;

          var entering = this.entering().$$enter();
          if (entering !== true) return entering;

          return true;
        },

        begin: function(compare, exec) {
          if (!compare()) return this.SUPERSEDED;
          if (!exec()) return this.ABORTED;
          if (!compare()) return this.SUPERSEDED;
          return true;
        },

        end: function() {
          from = { state: toState, params: toParams };
          to   = { state: null, params: null };
        }
      });
    }

    Transition.prototype.SUPERSEDED = 2;
    Transition.prototype.ABORTED    = 3;
    Transition.prototype.INVALID    = 4;

    // An element in the path which represents a state and its resolve status
    // When the resolved data is ready, it is stored here in the PathElement on the Resolvable(s) objects
    function PathElement(state) {
      var resolvables = map(state.resolve || {}, function(resolveFn, resolveName) {
        return new Resolvable(resolveName, resolveFn, state);
      });
      this.resolvables = function() { return resolvables; };
      this.$$resolvables = resolvables;
      this.$$state = state;
      this.state = function() { return state; };

      function resolveElement(pathContext) {
        return $q.all(map(resolvables, function(resolvable) { return resolvable.get(pathContext); }));
      }
      this.resolveElement = resolveElement;
    }

    function Path(states) {
      var self = this;
      // states contains public or private state?
      var elements = map(states, function (state) {
        return new PathElement(state);
      });
      self.elements = function() { return elements; };
      self.$$elements = elements; // for development

      // pathContext will hold stateful Resolvables (containing possibly resolved data), mapped per state-name.
      function resolvePath(pathContext) {
        return $q.all(map(elements, function(element) { return element.resolveElement(pathContext); }));
      }
      self.resolvePath = resolvePath;

      function invoke(hook, self, locals) {
        if (!hook) return;
        return $injector.invoke(hook, self, locals);
      }

      extend(this, {
        $$enter: function(/* locals */) {
          for (var i = 0; i < states.length; i++) {
            // entering.locals = toLocals[i];
            if (invoke(states[i].self.onEnter, states[i].self, locals(states[i])) === false) return false;
          }
          return true;
        },
        $$exit: function(/* locals */) {
          for (var i = states.length - 1; i >= 0; i--) {
            if (invoke(states[i].self.onExit, states[i].self, locals(states[i])) === false) return false;
            // states[i].locals = null;
          }
          return true;
        },
        resolve: function resolvePath(pathContext) {
          return self.resolvePath(pathContext);
        }
      });



      /* resolved, locals */
//      function resolveState(state, params, filtered, inherited, dst) {
//        var locals = { $stateParams: (filtered) ? params : $stateParams.$localize(state, params) };
//
//        // Resolve 'global' dependencies for the state, i.e. those not specific to a view.
//        // We're also including $stateParams in this; that way the parameters are restricted
//        // to the set that should be visible to the state, and are independent of when we update
//        // the global $state and $stateParams values.
//        dst.resolve = $resolve.resolve(state.resolve, locals, dst.resolve, state);
//
//        var promises = [dst.resolve.then(function (globals) {
//          dst.globals = globals;
//        })];
//
//        if (inherited) promises.push(inherited);
//
//        // Resolve template and dependencies for all views.
//        forEach(state.views, function (view, name) {
//          var injectables = (view.resolve && view.resolve !== state.resolve ? view.resolve : {});
//
//          promises.push($view.load(name, extend({}, view, {
//            locals: extend({}, locals, injectables),
//            params: locals.$stateParams,
//            context: state,
//            parent: (name.indexOf(".") > -1 || state.parent === root) ? null : state.parent
//          })));
//
//          promises.push($resolve.resolve(injectables, locals, dst.resolve, state).then(function (result) {
//            dst[name] = result;
//          }));
//        });
//
//        // Wait for all the promises and then return the activation object
//        return $q.all(promises).then(function (values) {
//          return dst;
//        });
//      }
    }

    var PathContext = function(parentPath) {
      var resolvablesByState = {};

      var previousIteration = {};
      forEach(parentPath.elements(), function(pathElem) {
        var resolvesbyName = indexBy(pathElem.resolvables(), 'name');
        var resolvables = extend({}, previousIteration, resolvesbyName);
        previousIteration = resolvablesByState[pathElem.state().name] = resolvables;
      });

      this.getResolvableLocals = function(stateName) {
        return resolvablesByState[stateName];
      };
    };

    function Resolvable(name, resolveFn, state) {
      var self = this;
      self.name = name;
      self.resolveFn = resolveFn;
      self.state = state;
      self.deps = $injector.annotate(resolveFn);

      self.promise = undefined;
      self.data = undefined;

      // This is to allow Resolvables to be invoked later, during a transition to grandchildren states, per our
      // discussion in #2 and https://github.com/angular-ui/ui-router/issues/702
      // " a resolve should never be loaded unless it's depended on by an injectable function"
      // Unless we do static analysis, we'll have to allow the resolveFn invoke to be deferred.
      // Is this what you were thinking, or were you thinking along the lines of static analysis?

      // states:
      // "A".resolve: { foo: fn()...}
      // "A.B".resolve: { }
      // "A.B.C".resolve: { bar: fn(foo)...}

      // from root, $state.go("A.B.C")  resolves 'foo', then resolves 'bar', with foo dependency injected

      // from root, $state.go("A.B")  does not resolve 'foo' because it's not injected in "A" or "A.B".
      // From "A.B", $state.go("A.B.C") must now resolve 'foo' after-the-fact for state "A" in order to resolve 'bar'

      // in 0.2.11, 'foo' is resolved immediately when you transition to "A".

      self.get = function(pathContext) {
        return self.promise || resolve(pathContext);
      };

      // resolve is called from transition
      // ancestorResolvables is an array of Resolvables
      function resolve(pathContext) {
        // Load an assoc-array of all resolvables for this state from the pathContext
        var ancestorsByName = pathContext.getResolvableLocals(self.state.name);

        // Limit the ancestors Resolvables map to only those that the current Resolvable fn's annotations depends on
        var depResolvables = pick(ancestorsByName, self.deps);

        // Get promises (or invoke resolveFn) for deps
        var depPromises = map(depResolvables, function(resolvable) {
          return resolvable.get(pathContext);
        });

        // Make sure all the dependencies from ancestors have been invoked so we have access to their promises,
        // then invoke our current resolveFn, passing in the ancestors' resolved data
        return $q.all(depPromises).then(function invokeResolve(locals) {
          self.promise = $injector.invoke(self.resolveFn, state, locals);
          return self.promise;
        }).then(function(data) {
          self.data = data;
          return self.promise;
        });
      }
      this.resolve = resolve;
    }

    $transition.Path = Path;
    $transition.PathElement = PathElement;
    $transition.PathContext = PathContext;
    $transition.Resolvable = Resolvable;

    $transition.init = function init(state, params, matcher) {
      from = { state: state, params: params };
      to = { state: null, params: null };
      stateMatcher = matcher;
    };

    $transition.start = function start(state, params, options) {
      to = { state: state, params: params };
      return new Transition(from.state, from.params, state, params, options || {});
    };

    $transition.isActive = function isActive() {
      return !!to.state && !!from.state;
    };

    $transition.isTransition = function isTransition(transition) {
      return transition instanceof Transition;
    };

    return $transition;
  }
}

angular.module('ui.router.state').provider('$transition', $TransitionProvider);