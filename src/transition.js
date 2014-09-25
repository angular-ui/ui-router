

/**
 * @ngdoc object
 * @name ui.router.state.$transitionProvider
 */
$TransitionProvider.$inject = [];
function $TransitionProvider() {

  var $transition = {}, stateMatcher = angular.noop, abstractKey = 'abstract';
  var transitionEvents = { on: [], entering: [], exiting: [], success: [], error: [] };

  function matchState(state, globStrings) {
    var toMatch = angular.isArray(globStrings) ? globStrings : [globStrings];

    for (var i = 0; i < toMatch.length; i++) {
      var glob = GlobBuilder.fromString(toMatch[i]);

      if ((glob && glob.matches(state.name)) || (!glob && toMatch[i] === state.name)) {
        return true;
      }
    }
    return false;
  }

  // Return a registration function of the requested type.
  function registerEventHook(eventType) {
    return function(stateGlobs, callback) {
      transitionEvents[eventType].push(new EventHook(stateGlobs, callback));
    };
  }

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#on
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition between the matched 'to' and 'from' states
   * starts.
   *
   * @param {object} transitionCriteria An object that specifies which transitions to invoke the callback for.
   *
   * - **`to`** - {string} - A glob string that matches the 'to' state's name.
   * - **`from`** - {string|RegExp} - A glob string that matches the 'from' state's name.
   *
   * @param {function} callback The function which will be injected and invoked, when a matching transition is started.
   *
   * @return {boolean|object|array} May optionally return:
   * - **`false`** to abort the current transition
   * - **A promise** to suspend the current transition until the promise resolves
   * - **Array of Resolvable objects** to add additional resolves to the current transition, which will be available
   *           for injection to further steps in the transition.
   */
  this.on = registerEventHook("on");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#entering
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked during a transition between the matched 'to' and 'from' states,
   * when the matched 'to' state is being entered. This function is in injected with the entering state's resolves.
   * @param {object} transitionCriteria See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   *
   * @return {boolean|object|array} May optionally return:
   * - **`false`** to abort the current transition
   * - **A promise** to suspend the current transition until the promise resolves
   * - **Array of Resolvable objects** to add additional resolves to the current transition, which will be available
   *           for injection to further steps in the transition.
   */
  this.entering = registerEventHook("entering");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#exiting
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked during a transition between the matched 'to' and 'from states,
   * when the matched 'from' state is being exited. This function is in injected with the exiting state's resolves.
   * @param {object} transitionCriteria See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   *
   * @return {boolean|object|array} May optionally return:
   * - **`false`** to abort the current transition
   * - **A promise** to suspend the current transition until the promise resolves
   * - **Array of Resolvable objects** to add additional resolves to the current transition, which will be available
   *           for injection to further steps in the transition.
   */
  this.exiting = registerEventHook("exiting");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#onSuccess
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition has successfully completed between the matched
   * 'to' and 'from' state is being exited.
   * This function is in injected with the 'to' state's resolves.
   * @param {object} transitionCriteria See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   */
  this.onSuccess = registerEventHook("success");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#onError
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition has failed for any reason between the matched
   * 'to' and 'from' state is being exited. This function is in injected with the 'to' state's resolves. The transition
   * rejection reason is injected as `$transitionError$`.
   * @param {object} transitionCriteria See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   */
  this.onError = registerEventHook("error");

  function EventHook(stateGlobs, callback) {
    this.callback = callback;
    this.matches = function matches(to, from) {
      return matchState(to, stateGlobs.to) && matchState(from, stateGlobs.from);
    };
  }

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
    var _fromPath = null; // contains resolved data

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
      var transition = this; // Transition() object

      // grab $transition's current path
      var toPath, fromPath = _fromPath; // Path() objects
      var retained, entering, exiting; // Path() objects
      var keep = 0, state, hasRun = false, hasCalculated = false;

      var states = {
        to: stateMatcher(toState, options),
        from: stateMatcher(fromState, options)
      };
      toState = states.to; fromState = states.from;

      if (!toState || !fromState) {
        throw new Error("To or from state not valid for transition: " + angular.toJson({
          to: toState, from: fromState
        }));
      }

      function isTargetStateValid() {
        var state = states.to;

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
          keep++;
          state = toState.path[keep];
        }

        // fromPath contains previously resolved data; emptyToPath has nothing resolved yet.
        retained = fromPath.slice(0, keep);
        exiting = fromPath.slice(keep);
        entering = new Path(toState.path).slice(keep);
        toPath = retained.concat(entering);

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

        is: function(compare) {
          if (compare instanceof Transition) {
            // TODO: Also compare parameters
            return this.is({ to: compare.to.$state().name, from: compare.from.$state().name });
          }
          return !(
            (compare.to && !matchState(this.to.$state(), compare.to)) ||
            (compare.from && !matchState(this.from.$state(), compare.from))
          );
        },

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
          return entering;
        },

        exiting: function() {
          calculateTreeChanges();
          return exiting;
        },

        retained: function() {
          calculateTreeChanges();
          return retained;
        },

        // Should this return views for `retained.concat(entering).states()` ?
        // As it stands, it will only return views for the entering states
        views: function() {
          return map(entering.states(), function(state) {
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
          calculateTreeChanges();

          function TransitionStep(pathElement, fn, locals, resolveContext, otherData) {
            this.state = pathElement.state;
            this.otherData = otherData;
            this.fn = fn;

            this.invokeStep = function invokeStep() {
              if ($transition.transition !== transition) return transition.SUPERSEDED;

              /** Returns a map containing any Resolvables found in result as an object or Array */
              function resolvablesFromResult(result) {
                var resolvables = [];
                if (result instanceof Resolvable) {
                  resolvables.push(result);
                } else if (angular.isArray(result)) {
                  resolvables.push(filter(result, function(obj) { return obj instanceof Resolvable; }));
                }
                return indexBy(resolvables, 'name');
              }

              /** Adds any returned resolvables to the resolveContext for the current state */
              function handleHookResult(result) {
                var newResolves = resolvablesFromResult(result);
                extend(resolveContext.$$resolvablesByState[pathElement.state.name], newResolves);
                return result === false ? transition.ABORTED : result;
              }

              return pathElement.invokeLater(fn, locals, resolveContext).then(handleHookResult);
            };
          }

          /**
           * returns an array of transition steps (promises) that matched
           * 1) the eventType
           * 2) the to state
           * 3) the from state
           */
          function makeSteps(eventType, to, from, pathElement, locals, resolveContext) {
            var extraData = { eventType: eventType, to: to, from: from, pathElement: pathElement, locals: locals, resolveContext: resolveContext }; // internal debugging stuff
            var hooks = transitionEvents[eventType];
            var matchingHooks = filter(hooks, function(hook) { return hook.matches(to, from); });
            return map(matchingHooks, function(hook) {
              return new TransitionStep(pathElement, hook.callback, locals, resolveContext, extraData);
            });
          }

          var tLocals = { $transition$: transition };
          var rootPE = new PathElement(stateMatcher("", {}));
          var rootPath = new Path([rootPE]);
          var exitingElements = transition.exiting().slice(0).reverse().elements;
          var enteringElements = transition.entering().elements;
          var to = transition.to(),  from = transition.from();

          // Build a bunch of arrays of promises for each step of the transition
          var transitionOnHooks = makeSteps("on", to, from, rootPE, tLocals, rootPath.resolveContext());

          var exitingStateHooks = map(exitingElements, function(elem) {
            var enterLocals = extend({}, tLocals, { $stateParams: $stateParams.$localize(elem.state, $stateParams) });
            return makeSteps("exiting", to, from, elem, enterLocals, fromPath.resolveContext(elem));
          });
          var enteringStateHooks = map(enteringElements, function(elem) {
            var exitLocals = extend({}, tLocals, { $stateParams: $stateParams.$localize(elem.state, $stateParams) });
            return makeSteps("entering", to, from, elem, exitLocals, toPath.resolveContext(elem));
          });

          var successHooks = makeSteps("onSuccess", to, from, rootPE, tLocals, rootPath.resolveContext());
          var errorHooks = makeSteps("onError", to, from, rootPE, tLocals, rootPath.resolveContext());

          var eagerResolves = function () { return toPath.resolve(toPath.resolveContext(), { policy: "eager" }); };

          var allSteps = flatten(transitionOnHooks, eagerResolves, exitingStateHooks, enteringStateHooks, successHooks);


          // Set up a promise chain. Add the promises in appropriate order to the promise chain.
          var chain = $q.when(true);
          forEach(allSteps, function (step) {
            chain.then(step.invokeStep);
          });

          // TODO: call errorHooks.

          return chain;
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
          // Save the Path which contains the Resolvables data
          paths.from = toPath;
        }
      });
    }

    Transition.prototype.SUPERSEDED = 2;
    Transition.prototype.ABORTED    = 3;
    Transition.prototype.INVALID    = 4;


    $transition.init = function init(state, params, matcher) {
      _fromPath = new Path(state.path);
      from = { state: state, params: params };
      to = { state: null, params: null };
      stateMatcher = matcher;
    };

    $transition.start = function start(state, params, options) {
      to = { state: state, params: params || {} };
      this.transition = new Transition(from.state, from.params, state, params || {}, options || {});
      return this.transition;
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