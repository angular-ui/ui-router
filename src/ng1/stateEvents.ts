/**
 * This file provides implementation of the deprecated UI-Router 0.2.x state events:
 *
 * @deprecated $stateChangeStart See: [[TransitionService.onStart]]
 * @deprecated $stateChangeSuccess See: [[TransitionService.onSuccess]]
 * @deprecated $stateChangeError See: [[TransitionService.onError]]
 * @deprecated $stateNotFound See: [[StateProvider.onInvalid]]
 *
 * @module ng1
 */

/** for typedoc */
/// <reference path='../../typings/angularjs/angular.d.ts' />

import {IServiceProviderFactory} from "angular";
import {StateService, StateProvider} from "../state/interface";
import {TargetState} from "../state/module";
import {Transition} from "../transition/transition";

(function() {
  let {extend, isFunction, isString} = angular;

  function applyPairs(memo, keyValTuple:any[]) {
    let key, value;
    if (Array.isArray(keyValTuple)) [key, value] = keyValTuple;
    if (!isString(key)) throw new Error("invalid parameters to applyPairs");
    memo[key] = value;
    return memo;
  }

  stateChangeStartHandler.$inject = ['$transition$', '$stateEvents', '$rootScope', '$urlRouter'];
  function stateChangeStartHandler($transition$:Transition, $stateEvents, $rootScope, $urlRouter) {
    if (!$transition$.options().notify || !$transition$.valid() || $transition$.ignored())
      return;

    let enabledEvents = $stateEvents.provider.enabled();

    /**
     * @ngdoc event
     * @name ui.router.state.$state#$stateChangeStart
     * @eventOf ui.router.state.$state
     * @eventType broadcast on root scope
     * @description
     * Fired when the state transition **begins**. You can use `event.preventDefault()`
     * to prevent the transition from happening and then the transition promise will be
     * rejected with a `'transition prevented'` value.
     *
     * @param {Object} event Event object.
     * @param {Transition} Transition An object containing all contextual information about
     * the current transition, including to and from states and parameters.
     *
     * @example
     *
     * <pre>
     * $rootScope.$on('$stateChangeStart', function(event, transition) {
   *   event.preventDefault();
   *   // transitionTo() promise will be rejected with
   *   // a 'transition prevented' error
   * })
     * </pre>
     */

    let toParams = $transition$.params("to");
    let fromParams = $transition$.params("from");

    if (enabledEvents.$stateChangeSuccess) {
      var startEvent = $rootScope.$broadcast('$stateChangeStart', $transition$.to(), toParams, $transition$.from(), fromParams, $transition$);

      if (startEvent.defaultPrevented) {
        if (enabledEvents.$stateChangeCancel) {
          $rootScope.$broadcast('$stateChangeCancel', $transition$.to(), toParams, $transition$.from(), fromParams, $transition$);
        }
        $urlRouter.update();
        return false;
      }

      $transition$.promise.then(function () {
        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeSuccess
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired once the state transition is **complete**.
         *
         * @param {Object} event Event object.
         * @param to
         * @param toParams
         * @param from
         * @param fromParams
         */
        $rootScope.$broadcast('$stateChangeSuccess', $transition$.to(), toParams, $transition$.from(), fromParams);
      });
    }

    if (enabledEvents.$stateChangeError) {
      $transition$.promise["catch"](function (error) {
        if (error && (error.type === 2 /* RejectType.SUPERSEDED */ || error.type === 3 /* RejectType.ABORTED */))
          return;

        /**
         * @ngdoc event
         * @name ui.router.state.$state#$stateChangeError
         * @eventOf ui.router.state.$state
         * @eventType broadcast on root scope
         * @description
         * Fired when an **error occurs** during transition. It's important to note that if you
         * have any errors in your resolve functions (javascript errors, non-existent services, etc)
         * they will not throw traditionally. You must listen for this $stateChangeError event to
         * catch **ALL** errors.
         *
         * @param {Object} event Event object.
         * @param {State} toState The state being transitioned to.
         * @param {Object} toParams The params supplied to the `toState`.
         * @param {State} fromState The current state, pre-transition.
         * @param {Object} fromParams The params supplied to the `fromState`.
         * @param {Error} error The resolve error object.
         */
        let evt = $rootScope.$broadcast('$stateChangeError', $transition$.to(), toParams, $transition$.from(), fromParams, error);

        if (!evt.defaultPrevented) {
          $urlRouter.update();
        }
      });
    }
  }

  stateNotFoundHandler.$inject = ['$to$', '$from$', '$state', '$rootScope', '$urlRouter'];
  function stateNotFoundHandler($to$:TargetState, $from$:TargetState, $state:StateService, $rootScope, $urlRouter) {
    /**
     * @ngdoc event
     * @name ui.router.state.$state#$stateNotFound
     * @eventOf ui.router.state.$state
     * @eventType broadcast on root scope
     * @description
     * Fired when a requested state **cannot be found** using the provided state name during transition.
     * The event is broadcast allowing any handlers a single chance to deal with the error (usually by
     * lazy-loading the unfound state). A `TargetState` object is passed to the listener handler,
     * you can see its properties in the example. You can use `event.preventDefault()` to abort the
     * transition and the promise returned from `transitionTo()` will be rejected with a
     * `'transition aborted'` error.
     *
     * @param {Object} event Event object.
     * @param {Object} unfoundState Unfound State information. Contains: `to, toParams, options` properties.
     * @param {State} fromState Current state object.
     * @param {Object} fromParams Current state params.
     * @example
     *
     * <pre>
     * // somewhere, assume lazy.state has not been defined
     * $state.go("lazy.state", { a: 1, b: 2 }, { inherit: false });
     *
     * // somewhere else
     * $scope.$on('$stateNotFound', function(event, transition) {
   * function(event, unfoundState, fromState, fromParams){
   *     console.log(unfoundState.to); // "lazy.state"
   *     console.log(unfoundState.toParams); // {a:1, b:2}
   *     console.log(unfoundState.options); // {inherit:false} + default options
   * });
   * </pre>
   */
    let redirect = {to: $to$.identifier(), toParams: $to$.params(), options: $to$.options()};
    let e = $rootScope.$broadcast('$stateNotFound', redirect, $from$.state(), $from$.params());

    if (e.defaultPrevented || e.retry)
      $urlRouter.update();

    function redirectFn():TargetState {
      return $state.target(redirect.to, redirect.toParams, redirect.options);
    }

    if (e.defaultPrevented) {
      return false;
    } else if (e.retry || $state.get(redirect.to)) {
      return e.retry && isFunction(e.retry.then) ? e.retry.then(redirectFn) : redirectFn();
    }
  }

  $StateEventsProvider.$inject = ['$stateProvider'];
  function $StateEventsProvider($stateProvider:StateProvider) {
    $StateEventsProvider.prototype.instance = this;

    interface IEventsToggle {
      $stateChangeStart: boolean;
      $stateNotFound: boolean;
      $stateChangeSuccess: boolean;
      $stateChangeError: boolean;
    }

    let runtime = false;
    let allEvents = ['$stateChangeStart', '$stateNotFound', '$stateChangeSuccess', '$stateChangeError'];
    let enabledStateEvents:IEventsToggle = <IEventsToggle> allEvents.map(e => [e, true]).reduce(applyPairs, {});

    function assertNotRuntime() {
      if (runtime) throw new Error("Cannot enable events at runtime (use $stateEventsProvider");
    }

    /**
     * Enables the deprecated UI-Router 0.2.x State Events
     * [ '$stateChangeStart', '$stateNotFound', '$stateChangeSuccess', '$stateChangeError' ]
     */
    this.enable = function (...events:string[]) {
      assertNotRuntime();
      if (!events || !events.length) events = allEvents;
      events.forEach(event => enabledStateEvents[event] = true);
    };

    /**
     * Disables the deprecated UI-Router 0.2.x State Events
     * [ '$stateChangeStart', '$stateNotFound', '$stateChangeSuccess', '$stateChangeError' ]
     */
    this.disable = function (...events:string[]) {
      assertNotRuntime();
      if (!events || !events.length) events = allEvents;
      events.forEach(event => delete enabledStateEvents[event]);
    };

    this.enabled = () => enabledStateEvents;

    this.$get = $get;
    $get.$inject = ['$transitions'];
    function $get($transitions) {
      runtime = true;

      if (enabledStateEvents["$stateNotFound"])
        $stateProvider.onInvalid(stateNotFoundHandler);
      if (enabledStateEvents.$stateChangeStart)
        $transitions.onBefore({}, stateChangeStartHandler, {priority: 1000});

      return {
        provider: $StateEventsProvider.prototype.instance
      };
    }
  }


  angular.module('ui.router.state.events', ['ui.router.state'])
      .provider("$stateEvents", <IServiceProviderFactory> $StateEventsProvider)
      .run(['$stateEvents', function ($stateEvents) { /* Invokes $get() */
      }]);
})();