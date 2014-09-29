

/**
 * @ngdoc object
 * @name ui.router.state.$transitionProvider
 */
$TransitionProvider.$inject = [];
function $TransitionProvider() {

  var $transition = {}, stateMatcher = angular.noop, abstractKey = 'abstract';
  var transitionEvents = { on: [], entering: [], exiting: [], success: [], error: [] };

  /**
   * Determines if the given state matches the matchCriteria
   * @param state a State Object to test against
   * @param matchCriteria {string|array|function}
   * - If a string, matchState uses the string as a glob-matcher against the state name
   * - If an array (of strings), matchState uses each string in the array as a glob-matchers against the state name
   *   and returns a positive match if any of the globs match.
   * - If a function, matchState calls the function with the state and returns true if the function's result is truthy.
   * @returns {boolean}
   */
  function matchState(state, matchCriteria) {
    var toMatch = angular.isString(matchCriteria) ? [matchCriteria] : matchCriteria;
    var matchFn = angular.isFunction(toMatch) ? toMatch : matchGlobs;

    function matchGlobs(state) {
      for (var i = 0; i < toMatch.length; i++) {
        var glob = GlobBuilder.fromString(toMatch[i]);

        if ((glob && glob.matches(state.name)) || (!glob && toMatch[i] === state.name)) {
          return true;
        }
      }
      return false;
    }

    return matchFn(state) ? true : false;
  }

  // Return a registration function of the requested type.
  function registerEventHook(eventType) {
    return function(matchObject, callback) {
      transitionEvents[eventType].push(new EventHook(matchObject, callback));
    };
  }

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#on
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition between the matched 'to' and 'from' states
   * starts.  This function can be injected with one additional special value:
   * - **`$transition$`**: The current transition
   *
   * @param {object} matchObject An object that specifies which transitions to invoke the callback for.
   *
   * - **`to`** - {string|function=} - A glob string that matches the 'to' state's name.
   *    Or, a function with the signature `function(state) {}` which should return a boolean to indicate if the state matches.
   * - **`from`** - {string|function=} - A glob string that matches the 'from' state's name.
   *    Or, a function with the signature `function(state) {}` which should return a boolean to indicate if the state matches.
   *
   * @param {function} callback
   *   The function which will be injected and invoked, when a matching transition is started.
   *   The function may optionally return a {boolean|Transition|object} value which will affect the current transition:
   *
   *     - **`false`** to abort the current transition
   *     - **{Transition}** A Transition object from the $transition$.redirect() factory. If returned, the
   *        current transition will be aborted and the returned Transition will supersede it.
   *     - **{object}** A map of resolve functions to be added to the current transition. These resolves will be made
   *        available for injection to further steps in the transition.  The object should have {string}s for keys and
   *        {function}s for values, like the `resolve` object in {@link ui.router.state.$stateProvider#state $stateProvider.state}.
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
   *
   * This function can be injected with two additional special value:
   * - **`$transition$`**: The current transition
   * - **`$state$`**: The state being entered
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
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
   *
   * This function can be injected with two additional special value:
   * - **`$transition$`**: The current transition
   * - **`$state$`**: The state being entered
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
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
   * This function is in injected with the 'to' state's resolves (note: `JIT` resolves are not injected).
   *
   * This function can be injected with two additional special value:
   * - **`$transition$`**: The current transition
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback The function which will be injected and invoked, when a matching transition is started.
   *   The function's return value is ignored.
  */
  this.onSuccess = registerEventHook("success");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#onError
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition has failed for any reason between the matched
   * 'to' and 'from' state. The transition rejection reason is injected as `$error$`.
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback The function which will be injected and invoked, when a matching transition is started.
   *   The function's return value is ignored.
   */
  this.onError = registerEventHook("error");

  function trueFn() { return true; }
  function EventHook(matchCriteria, callback) {
    matchCriteria = extend({to: trueFn, from: trueFn}, matchCriteria);
    this.callback = callback;
    this.matches = function matches(to, from) {
      return matchState(to, matchCriteria.to) && matchState(from, matchCriteria.from);
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
  $get.$inject = ['$q', '$injector', '$resolve', '$stateParams', '$timeout'];
  function $get(   $q,   $injector,   $resolve,   $stateParams,   $timeout) {
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
      var deferred = $q.defer();

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
          return pluck(entering.elements, 'state');
        },

        exiting: function() {
          calculateTreeChanges();
          return pluck(exiting.elements, 'state');
        },

        retained: function() {
          calculateTreeChanges();
          return pluck(retained.elements, 'state');
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
          $transition.transition = transition;

          function TransitionStep(pathElement, fn, locals, resolveContext, otherData) {
            this.state = pathElement.state;
            this.otherData = otherData;
            this.invokeStep = function invokeStep() {
              if ($transition.transition !== transition) return transition.SUPERSEDED;

              /**
               * Validates the result map as a "resolve:" style object.
               * Creates Resolvable objects from the result object and adds them to the target object
               */
              function registerNewResolves(result, target) {
                if (angular.isObject(result)) {
                  // If result is an object, it should be a map of strings to functions.
                  angular.forEach(result, function(value, key) {
                    if (!angular.isString(key) || !angular.isFunction(value)) {
                      throw new Error("Invalid resolve key/value: " + key + "/", value);
                    }
                    // Add a new Resolvable to the target map
                    target[key] = new Resolvable(key, value, pathElement.state);
                  });
                }
              }

              /**
               * Handles transition abort and transition redirect. Also adds any returned resolvables
               * to the resolveContext for the current state.
               */
              function handleHookResult(result) {
                if (result === false) return transition.ABORTED;

                // If the hook returns a Transition, halt the current Transition and redirect to that Transition.
                if (result instanceof Transition) {
                  // TODO: Do the redirect using new API.
                  // We need to run some logic in $state too, however, so we can't just
                  // call result.run(); We might need to reorganize some stuff for this to happen.

                  $timeout(function() { // For now, punting via $state.transitionTo(
                    $state.transitionTo(transition.to(), transition.params().to, transition.options());
                  });

                  return transition.ABORTED;
                }

                registerNewResolves(result, resolveContext.$$resolvablesByState[pathElement.state.name]);

                return result;
              }

              return pathElement.invokeLater(fn, locals, resolveContext).then(handleHookResult);
            };

            this.invokeStepSynchronously = function invokeStepSynchronously() {
              return pathElement.invokeNow(fn, locals, resolveContext);
            };
          }

          /**
           * returns an array of transition steps (promises) that matched
           * 1) the eventType
           * 2) the to state
           * 3) the from state
           */
          function makeSteps(eventType, to, from, pathElement, locals, resolveContext) {
            // internal debugging stuff
            var extraData = { eventType: eventType, to: to, from: from, pathElement: pathElement, locals: locals, resolveContext: resolveContext };
            var hooks = transitionEvents[eventType];
            var matchingHooks = filter(hooks, function(hook) { return hook.matches(to, from); });
            return map(matchingHooks, function(hook) {
              return new TransitionStep(pathElement, hook.callback, locals, resolveContext, extraData);
            });
          }

          var tLocals = { $transition$: transition };
          var rootPE = new PathElement(stateMatcher("", {}));
          var rootPath = new Path([rootPE]);
          var exitingElements = exiting.slice(0).reverse().elements;
          var enteringElements = entering.elements;
          var to = transition.to(),  from = transition.from();

          // Build a bunch of arrays of promises for each step of the transition
          var transitionOnHooks = makeSteps("on", to, from, rootPE, tLocals, rootPath.resolveContext());

          var exitingStateHooks = map(exitingElements, function(elem) {
            var stepLocals = { $state$: elem.state,  $stateParams: $stateParams.$localize(elem.state, $stateParams) };
            var locals = extend({},  tLocals, stepLocals);
            return makeSteps("exiting", to, elem.state, elem, locals, fromPath.resolveContext(elem));
          });

          var enteringStateHooks = map(enteringElements, function(elem) {
            var stepLocals = { $state$: elem.state,  $stateParams: $stateParams.$localize(elem.state, $stateParams) };
            var locals = extend({}, tLocals, stepLocals);
            return makeSteps("entering", elem.state, from, elem, locals, toPath.resolveContext(elem));
          });

          var eagerResolves = {
            invokeStep: function () { return toPath.resolve(toPath.resolveContext(), { policy: "eager" }); }
          };

          var asyncSteps = flatten([transitionOnHooks, eagerResolves, exitingStateHooks, enteringStateHooks]);

          // Set up a promise chain. Add the promises in appropriate order to the promise chain.
          var chain = $q.when(true);
          forEach(asyncSteps, function (step) {
            chain = chain.then(step.invokeStep);
          });

          function runSynchronousHooks(hookName, locals) {
            var hooks = makeSteps(hookName, to, from, rootPE, locals, rootPath.resolveContext());
            forEach(hooks, function (hook) {
              try {
                hook.invokeStepSynchronously();
              } catch (ex) {
                // return $q.reject(ex);
                // TODO: to catch, or not to catch?
                console.log("Error thrown during " + hookName + " handler:", ex);
              }
            });
          }
          function successHooks() { runSynchronousHooks("onSuccess", tLocals);  }
          function errorHooks(error) { runSynchronousHooks("onError", extend({}, tLocals, { $error$: error })); }

          chain.then(successHooks).catch(errorHooks);
          chain.then(deferred.resolve).catch(deferred.reject);
//          function yay(data) { console.log("yay!"); return deferred.resolve(data); }
//          function boo(err) { console.log("boo!"); return deferred.reject(err); }
//          chain.then(yay).catch(boo);

          chain.finally(function() { $transition.transition = null; });

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
          _fromPath = toPath;
        },
        promise: deferred.promise
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
      return new Transition(from.state, from.params, state, params || {}, options || {});
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