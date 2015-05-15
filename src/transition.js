var TransitionRejection;

/**
 * @ngdoc object
 * @name ui.router.state.$transitionProvider
 */
$TransitionProvider.$inject = [];
function $TransitionProvider() {

  var $transition = {};
  var transitionEvents = { onInvalid: [], onStart: [], on: [], entering: [], exiting: [], onSuccess: [], onError: [] };

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
    return function(matchObject, callback, options) {
      options = options || {};
      transitionEvents[eventType].push(new EventHook(matchObject, callback, options));
      transitionEvents[eventType].sort(function(a,b) {
        return a.priority - b.priority;
      })
    };
  }

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#onInvalid
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition to an invalid state reference has been started.
   * This function can be injected with one additional special value:
   * - **`$transition$`**: The current transition
   *
   * @param {object} matchObject An object that specifies which transitions to invoke the callback for (typically this
   * value will be {} for this callback, to match all invalid transitions)
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
  this.onInvalid = registerEventHook("onInvalid");

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
  this.onSuccess = registerEventHook("onSuccess");

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
  this.onError = registerEventHook("onError");

  function trueFn() { return true; }
  function EventHook(matchCriteria, callback, options) {
    matchCriteria = extend({to: trueFn, from: trueFn}, matchCriteria);
    this.callback = callback;
    this.priority = options.priority || 0;
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
     * @param {Object} from The origin {@link ui.router.state.$stateProvider#state state} from which the transition is leaving.
     * @param {Object} to The target {@link ui.router.state.$stateProvider#state state} being transitioned to.
     * @param {Object} options An object hash of the options for this transition.
     *
     * @returns {Object} New `Transition` object
     */
    function Transition(from, to, options) {
      var transition = this; // Transition() object
      var deferred = $q.defer();

      // grab $transition's current path
      var toPath, fromPath, retained, entering, exiting; // Path() objects
      var keep = 0, state, hasRun = false, hasCalculated = false;

      var fromState = from.$state();
      var fromParams = extend(new StateParams(), from.params());
      var toState = to.$state();
      var toParams = options.inherit && to.valid() ?
        fromParams.$inherit(to.params(), fromState, toState) :
        extend(new StateParams(), to.params());

      fromPath = new Path(fromState.path);

      function calculateTreeChanges() {
        if (hasCalculated) return;

        if (to.valid()) {
          state = toState.path[keep];
          while (state && state === fromState.path[keep] && equalForKeys(toParams, fromParams, state.ownParams)) {
            keep++;
            state = toState.path[keep];
          }
        }

        // fromPath contains previously resolved data; emptyToPath has nothing resolved yet.
        retained = fromPath.slice(0, keep);
        exiting = fromPath.slice(keep);
        entering = to.valid() ? new Path(toState.path).slice(keep) : new Path([]);
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
         * @returns {StateReference} The origin state reference of the transition ("from state").
         */
        from: from,

        /**
         * @ngdoc function
         * @name ui.router.state.type:Transition#to
         * @methodOf ui.router.state.type:Transition
         *
         * @description
         * Returns the target state of the current transition, as passed to the `Transition` constructor.
         *
         * @returns {StateReference} The state reference the transition is targetting ("to state")
         */
        to: to,

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

        previous: function() {
          options.previous || null;
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
          var exitingStates = pluck(exiting.elements, 'state');
          exitingStates.reverse();
          return exitingStates;
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

        redirect: function(to, options) {
          if (to === toState && params === toParams) return false;
          // The following line doesn't work because StateReference contructor returns inner 'var ref'
//          if (!(to instanceof StateReference)) throw new Error("to must be a StateReference");
          return new Transition(from, to, options || this.options());
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
          return (!options.reload && toState === fromState && equalForKeys(toParams, fromParams, objectKeys(toState.params || {})));
        },

        run: function() {
          calculateTreeChanges();
          $transition.transition = transition;

          function TransitionStep(pathElement, fn, locals, resolveContext, options) {
            options = defaults(options, { async: true, rejectIfSuperseded: true, data: {} });
            extend(this, {
              async: options.async,
              rejectIfSuperseded: options.rejectIfSuperseded,
              state: pathElement.state,
              data:  options.data,
              toString: function() {
                return tpl("Step( .{event}({ from: {from}, to: {to} }) (state: {state}) )", {
                  event: options.data.eventType,
                  from:  options.data.from.name,
                  to:    options.data.to.name,
                  state: options.data.pathElement.state.name
                });
              }
            });

            this.invokeStep = function invokeStep() {
              if (options.rejectIfSuperseded && $transition.transition !== transition) {
                return REJECT.superseded($transition.transition);
              }

              if (options.async)
                return pathElement.invokeLater(fn, locals, resolveContext).then(handleHookResult);
              else
                return handleHookResult(pathElement.invokeNow(fn, locals, resolveContext));

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
                if ($transition.transition !== transition) {
                  return REJECT.superseded($transition.transition);
                }

                // If the hook returns false, abort the current Transition
                if (result === false) return REJECT.aborted("Hook aborted transition");
                // If the hook returns a Transition, halt the current Transition and redirect to that Transition.
                if (result instanceof Transition) return REJECT.redirected(result);
                // If the hook returns any new resolves, add them to the ResolveContext
                registerNewResolves(result, resolveContext.$$resolvablesByState[pathElement.state.name]);
                return result;
              }
            };
          }

          function runSynchronousHooks(hooks, swallowExceptions) {
            var result = undefined;
            forEach(hooks, function (hook) {
              try {
                // Last one in wins, if multiple callbacks are registered
                // TODO: Determine if this is a good idea (last-in-wins)
                result = hook.invokeStep();
                // TODO: I think first-in should win instead? how to be consistent?
                //if (result !== undefined)
                //  return result;
              } catch (ex) {
                if (!swallowExceptions) throw ex;
                console.log("Swallowed exception during synchronous hook handler: " + ex); // TODO: What to do here?
              }
            });
            return result;
          }


          /**
           * returns an array of transition steps (promises) that matched
           * 1) the eventType
           * 2) the to state
           * 3) the from state
           */
          function makeSteps(eventType, to, from, pathElement, locals, resolveContext, options) {
            // internal debugging stuff
            options = options || {};
            options.data = { eventType: eventType, to: to, from: from, pathElement: pathElement, locals: locals, resolveContext: resolveContext };;

            var hooks = transitionEvents[eventType];

            function hookMatches(hook) { return hook.matches(to, from); }
            var matchingHooks = filter(hooks, hookMatches);

            return map(matchingHooks, function(hook) {
              return new TransitionStep(pathElement, hook.callback, locals, resolveContext, options);
            });
          }

          var tLocals = { $transition$: transition };
          var rootPE = new PathElement(fromState.root());
          var rootPath = new Path([rootPE]);
          var exitingElements = exiting.slice(0).reverse().elements;
          var enteringElements = entering.elements;
          var to = transition.to.$state(),  from = transition.from.$state();

          // Build a bunch of arrays of promises for each step of the transition
          var onInvalidHooks = makeSteps("onInvalid", to, from, rootPE, tLocals, rootPath.resolveContext(), { async: false });

          var onStartHooks = makeSteps("onStart", to, from, rootPE, tLocals, rootPath.resolveContext(), { async: false });

          var transitionOnHooks = makeSteps("on", to, from, rootPE, tLocals, rootPath.resolveContext());

          var exitingStateHooks = map(exitingElements, function(elem) {
            var stepLocals = { $state$: elem.state,  $stateParams: fromParams.$localize(elem.state) };
            var locals = extend({},  tLocals, stepLocals);
            return makeSteps("exiting", to, elem.state, elem, locals, fromPath.resolveContext(elem));
          });

          var enteringStateHooks = map(enteringElements, function(elem) {
            var stepLocals = { $state$: elem.state,  $stateParams: fromParams.$localize(elem.state) };
            var locals = extend({}, tLocals, stepLocals);
            return makeSteps("entering", elem.state, from, elem, locals, toPath.resolveContext(elem));
          });

          function successHooks() {
            var onSuccessHooks = makeSteps("onSuccess", to, from, rootPE, tLocals, rootPath.resolveContext(), { async: false, rejectIfSuperseded: false });
            return runSynchronousHooks(onSuccessHooks, true);
          }

          function errorHooks(error) {
            var onErrorLocals = extend({}, tLocals, { $error$: error });
            var onErrorHooks = makeSteps("onError", to, from, rootPE, onErrorLocals, rootPath.resolveContext(), { async: false, rejectIfSuperseded: false });
            return runSynchronousHooks(onErrorHooks, true);
          }

          var eagerResolves = {
            invokeStep: function () { return toPath.resolve(toPath.resolveContext(), { policy: "eager" }); }
          };

          // Set up a promise chain. Add the steps' promises in appropriate order to the promise chain.
          var asyncSteps = flatten([transitionOnHooks, eagerResolves, exitingStateHooks, enteringStateHooks]);

          // -----------------------------------------------------------------------

          // Run the steps.
          // First, run the synchronous onInvalid and onStart steps.
          var result = !transition.to.valid() ? runSynchronousHooks(onInvalidHooks) : $q.when(true);
          // TODO: change behavior based on synchronous hook result(s)
          // TODO: Decide what to do with multiple sync hooks.
          result = result && angular.isFunction(result.then) ? result :  runSynchronousHooks(onStartHooks);

          var chain = result && angular.isFunction(result.then) ? result : $q.when(true);

          // Then, run the async steps
          forEach(asyncSteps, function (step) {
            chain = chain.then(step.invokeStep);
          });

          // When the transition is done, resolve the transition deferred
          chain.then(deferred.resolve).catch(deferred.reject);
          // Finally, when the transition is done, update the current transition object (if this is still the current transition)
          // When the transition is done, run the success or error hooks
          chain.then(successHooks).catch(errorHooks).finally(function() {
            if ($transition.transition === transition)
              $transition.transition = null;
          });

          return transition.promise;
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

        promise: deferred.promise,

        toString: function() {
          return "Transition( " + transition.from.state().name + angular.toJson(transition.params().from) + " -> " +
            transition.to.state().name + angular.toJson(transition.params().to) + " )";
        }
      });
    }

    Transition.prototype.SUPERSEDED = 2;
    Transition.prototype.ABORTED    = 3;
    Transition.prototype.INVALID    = 4;

    TransitionRejection = function TransitionRejection(type, message, detail) {
      this.type = type;
      this.message = message;
      this.detail = detail;
    };

    var REJECT = {
      superseded: function (detail, options) {
        var message = "The transition has been superseded by a different transition (see detail).";
        var rejection = new TransitionRejection(Transition.prototype.SUPERSEDED, message, detail);
        if (options && options.redirected) { rejection.redirected = true; }
        return $q.reject(rejection);
      },
      redirected: function (detail) {
        return REJECT.superseded(detail, { redirected: true } );
      },
      invalid: function(detail) {
        var rejection = new TransitionRejection(Transition.prototype.INVALID, message, detail);
        return $q.reject(rejection);
      },
      aborted: function (detail) {
        // TODO think about how to encapsulate an Error() object
        var message = "The transition has been aborted.";
        return $q.reject(new TransitionRejection(Transition.prototype.ABORTED, message, detail));
      }
    };

    $transition.init = function init(state, params) {
      _fromPath = new Path(state.path);
      from = { state: state, params: params };
      to = { state: null, params: null };
    };

    $transition.create = function create(from, to, options) {
      return new Transition(from, to, options || {});
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