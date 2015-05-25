var TransitionRejection;

/**
 * @ngdoc object
 * @name ui.router.state.$transitionProvider
 */
$TransitionProvider.$inject = [];
function $TransitionProvider() {
  $TransitionProvider.instance = this;

  var $transition = {};
  var transitionEvents = { onBefore: [], onInvalid: [], onStart: [], on: [], entering: [], exiting: [], onSuccess: [], onError: [] };

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
   * @name ui.router.state.$transitionProvider#onBefore
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked before a Transition begins.
   *
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
   *   The function which will be injected and invoked, before a matching transition is started.
   *   The function may optionally return a {boolean|Transition|object} value which will affect the current transition:
   *
   * @return
   *     - **`false`** to abort the current transition
   *     - **{Transition}** A Transition object from the $transition$.redirect() factory. If returned, the
   *        current transition will be aborted and the returned Transition will supersede it.
   *     - **{object}** A map of resolve functions to be added to the current transition. These resolves will be made
   *        available for injection to further steps in the transition.  The object should have {string}s for keys and
   *        {function}s for values, like the `resolve` object in {@link ui.router.state.$stateProvider#state $stateProvider.state}.
   */
  this.onBefore = registerEventHook("onBefore");

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
   * @name ui.router.state.$transitionProvider#onStart
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition has entered the async portion.
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
  this.onStart = registerEventHook("onStart");

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
    $TransitionProvider.instance.on({}, function($transition$) {
      if (!$transition$.to.valid())
        throw new Error($transition$.to.error());
    });

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

      var deferreds = {
        prehooks: $q.defer(), // Resolved when the transition is complete, but success callback not run yet
        posthooks: $q.defer(), // Resolved when the transition is complete, after success callbacks
        redirects: $q.defer() // Resolved when any transition redirects are complete
      };

      // grab $transition's current path
      var toPath, fromPath, retained, entering, exiting; // Path() objects
      var keep = 0, state, hasCalculated = false;

      var fromState = from.$state();
      var fromParams = extend(new StateParams(), from.params());
      var toState = to.$state();
      var toParams = (options.inherit && to.valid()) ? fromParams.$inherit(to.params(), fromState, toState) : to.params();
      toParams = toState ? extend(new StateParams(), toState.params.$$values(toParams)) : toParams;

      fromPath = new Path(fromState.path);

      function calculateTreeChanges() {
        if (hasCalculated) return;

        if (to.valid()) {
          state = toState.path[keep];
          while (state && state === fromState.path[keep] && state.params.$$equals(toParams, fromParams)) {
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
         * Gets the calculated StateParams object for the transition target.
         *
         * @returns {StateParams} the StateParams object for the transition.
         */
        params: function() {
          return toParams;
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
          return !options.reload && toState === fromState && toState.params.$$equals(toParams, fromParams);
        },

        run: function() {
          calculateTreeChanges();
          if (transition.ignored()) {
            $transition.transition = null;
            var ignored = REJECT.ignored();
            forEach(deferreds, function(def) { def.reject(ignored.reason); });
            return ignored;
          }

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

              // TODO: Need better integration of returned promises in synchronous code.
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
               * to the resolveContext for the current state.  If the transition is rejected, then a rejected
               * promise is returned here, otherwise undefined is returned.
               */
              function handleHookResult(result) {
                if ($transition.transition !== transition) {
                  return REJECT.superseded($transition.transition);
                }

                // If the hook returns false, abort the current Transition
                if (result === false)
                  return REJECT.aborted("Hook aborted transition");
                // If the hook returns a Transition, halt the current Transition and redirect to that Transition.
                if (result instanceof Transition)
                  return REJECT.redirected(result);
                if (result && angular.isFunction(result.then))
                  return result.then(handleHookResult);

                // If the hook returns any new resolves, add them to the ResolveContext
                registerNewResolves(result, resolveContext.$$resolvablesByState[pathElement.state.name]);
              }
            };
          }

          function runSynchronousHooks(hooks, swallowExceptions) {
            var promises = [];
            for (var i = 0; i < hooks.length; i++) {
              try {
                var hookResult = hooks[i].invokeStep();
                // If a hook returns a promise, that promise is added to an array to be resolved asynchronously.
                if (hookResult && angular.isFunction(hookResult.then))
                  promises.push(hookResult);
              } catch (ex) {
                if (!swallowExceptions) throw ex;
                console.log("Swallowed exception during synchronous hook handler: " + ex); // TODO: What to do here?
              }
            }

            return promises.reduce(function(memo, val) {
              return memo.then(function() { return val; })
            }, $q.when(true));
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
          // TODO: Provide makeSteps with the StateReference, not the $state().
          var onBeforeHooks = makeSteps("onBefore", to, from, rootPE, tLocals, rootPath.resolveContext(), { async: false });

          var onInvalidHooks = makeSteps("onInvalid", to, from, rootPE, tLocals, rootPath.resolveContext(), { async: true });

          var onStartHooks = makeSteps("onStart", to, from, rootPE, tLocals, rootPath.resolveContext(), { async: true });

          var transitionOnHooks = makeSteps("on", to, from, rootPE, tLocals, rootPath.resolveContext());

          var exitingStateHooks = map(exitingElements, function(elem) {
            var stepLocals = { $state$: elem.state,  $stateParams: elem.state.params.$$values(fromParams) };
            var locals = extend({},  tLocals, stepLocals);
            var steps = makeSteps("exiting", to, elem.state, elem, locals, fromPath.resolveContext(elem));
            return !elem.state.self.onExit ? steps : steps.concat([ new TransitionStep(elem, elem.state.self.onExit, locals, fromPath.resolveContext(elem), {}) ]);
          });

          var enteringStateHooks = map(enteringElements, function(elem) {
            var stepLocals = { $state$: elem.state,  $stateParams: elem.state.params.$$values(fromParams) };
            var locals = extend({}, tLocals, stepLocals);
            var steps = makeSteps("entering", elem.state, from, elem, locals, toPath.resolveContext(elem));
            return !elem.state.self.onEnter ? steps : steps.concat([ new TransitionStep(elem, elem.state.self.onEnter, locals, toPath.resolveContext(elem), {}) ]);
          });

          function successHooks(outcome) {
            var result = transition.to.state();
            deferreds.prehooks.resolve(result);
            var onSuccessHooks = makeSteps("onSuccess", to, from, rootPE, tLocals, rootPath.resolveContext(), { async: false, rejectIfSuperseded: false });
            runSynchronousHooks(onSuccessHooks, true);
            deferreds.posthooks.resolve(result);
          }

          function errorHooks(error) {
            deferreds.prehooks.reject(error);
            var onErrorLocals = extend({}, tLocals, { $error$: error });
            var onErrorHooks = makeSteps("onError", to, from, rootPE, onErrorLocals, rootPath.resolveContext(), { async: false, rejectIfSuperseded: false });
            runSynchronousHooks(onErrorHooks, true);
            deferreds.posthooks.reject(error);
          }

          var eagerResolves = {
            invokeStep: function () {
              return toPath.elements.length == 0 ? $q.when({}) : toPath.resolve(toPath.resolveContext(), { policy: "eager" });
            }
          };

          // Set up a promise chain. Add the steps' promises in appropriate order to the promise chain.
          var invalidOrStartHooks = transition.to.valid() ? onStartHooks : onInvalidHooks;
          var asyncSteps = flatten([invalidOrStartHooks, transitionOnHooks, eagerResolves, exitingStateHooks, enteringStateHooks]);

          // -----------------------------------------------------------------------
          // Transition Steps
          // -----------------------------------------------------------------------

          // ---- Synchronous hooks ----
          // Run the "onBefore" hooks and save their promises
          var chain = runSynchronousHooks(onBeforeHooks);

          // ---- Asynchronous section ----

          // The results of the sync hooks is a promise chain (rejected or otherwise) that begins the async portion of the transition.
          // Build the rest of the chain off the sync promise chain out of all the asynchronous steps
          forEach(asyncSteps, function (step) {
            chain = chain.then(step.invokeStep);
          });

          // When the last step of the chain has resolved or any step has rejected (i.e., the transition is completed),
          // invoke the registered success or error hooks when the transition is completed.
          chain = chain.then(successHooks).catch(errorHooks);

          // Finally, when the transition is done and the hooks invoked, clear the current $transition.transition
          // pointer (but only if this is still the current transition)
          chain.finally(transition.stop);

          // Return the overall transition promise, which is resolved/rejected in successHooks/errorHooks
          return transition.promise;
        },

        isActive: function() {
          return $transition.transition === transition;
        },

        abort: function() {
          if (transition.isActive()) {
            $transition.transition = null;
          }
        },

        // Expose three promises to users of Transition
        promise: deferreds.posthooks.promise,
        prepromise: deferreds.prehooks.promise,
        redirects: deferreds.redirects.promise,

        toString: function() {
          var fromStateOrName = transition.from();
          var toStateOrName = transition.to();
          // Transition( fromstate{fromparams} -> (X) tostate{toparams} )
          // (X) means the to state is invalid.
          return "Transition( " +
            (angular.isObject(fromStateOrName) ? fromStateOrName.name : fromStateOrName) +
            angular.toJson(transition.from.params()) +
            " -> "
            + (transition.to.valid() ? "" : "(X) ") +
            (angular.isObject(toStateOrName) ? toStateOrName.name : toStateOrName) +
            angular.toJson(transition.params()) + " )";
        }
      });
    }

    Transition.prototype.SUPERSEDED = 2;
    Transition.prototype.ABORTED    = 3;
    Transition.prototype.INVALID    = 4;
    Transition.prototype.IGNORED    = 5;

    TransitionRejection = function TransitionRejection(type, message, detail) {
      this.type = type;
      this.message = message;
      this.detail = detail;
    };

    var REJECT = {
      superseded: function (detail, options) {
        var message = "The transition has been superseded by a different transition (see detail).";
        var reason = new TransitionRejection(Transition.prototype.SUPERSEDED, message, detail);
        if (options && options.redirected) { reason.redirected = true; }
        return extend($q.reject(reason), { reason: reason });
      },
      redirected: function (detail) {
        return REJECT.superseded(detail, { redirected: true } );
      },
      invalid: function(detail) {
        var reason = new TransitionRejection(Transition.prototype.INVALID, message, detail);
        return extend($q.reject(reason), { reason: reason });
      },
      ignored: function(detail) {
        var reason = new TransitionRejection(Transition.prototype.IGNORED, "The transition was ignored.", detail);
        return extend($q.reject(reason), { reason: reason });
      },
      aborted: function (detail) {
        // TODO think about how to encapsulate an Error() object
        var message = "The transition has been aborted.";
        var reason = new TransitionRejection(Transition.prototype.ABORTED, message, detail);
        return extend($q.reject(reason), { reason: reason });
      }
    };

    // TODO: Hide this from public API
    $transition.init = function init(state, params) {
      from = { state: state, params: params };
      to = { state: null, params: null };
    };

    $transition.create = function create(from, to, options) {
      return new Transition(from, to, options || {});
    };

    $transition.isActive = function isActive() {
      return !!$transition.transition;
    };

    $transition.isTransition = function isTransition(transition) {
      return transition instanceof Transition;
    };

    $transition.provider = $TransitionProvider.instance;

    return $transition;
  }
}

angular.module('ui.router.state')
  .provider('$transition', $TransitionProvider);