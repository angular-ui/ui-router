/// <reference path='../../bower_components/DefinitelyTyped/angularjs/angular.d.ts' />

import {extend, forEach, isFunction} from "../common/common";
import {RejectType} from "../transition/rejectFactory";
import {StateParams} from "./state";
import {IServiceProviderFactory} from "angular";


stateChangeStartHandler.$inject = ['$transition$', '$stateEvents', '$rootScope', '$urlRouter'];
function stateChangeStartHandler($transition$, $stateEvents, $rootScope, $urlRouter) {
  if (!$transition$.$to().valid() || !$transition$.options().notify)
    return;

  var enabledEvents = $stateEvents.provider.enabledEvents();

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

  if (enabledEvents.$stateChangeStart && $rootScope.$broadcast('$stateChangeStart', $transition$.to(), $transition$.params(), $transition$.from(), $transition$.$from().params(), $transition$).defaultPrevented) {
    if (enabledEvents.$stateChangeCancel) {
      $rootScope.$broadcast('$stateChangeCancel', $transition$.to(), $transition$.params(), $transition$.from(), $transition$.$from().params(), $transition$);
    }
    $urlRouter.update();
    return false;
  }

  if (enabledEvents.$stateChangeSuccess) {
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
      $rootScope.$broadcast('$stateChangeSuccess',
        $transition$.to(), extend(new StateParams(), $transition$.params()).$raw(),
        $transition$.from(), extend(new StateParams(), $transition$.$from().params()).$raw());
    });
  }

  if (enabledEvents.$stateChangeError) {
    $transition$.promise["catch"](function (error) {
      if (error && (error.type == RejectType.SUPERSEDED || error.type == RejectType.ABORTED))
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
      var evt = $rootScope.$broadcast('$stateChangeError',
        $transition$.to(), extend(new StateParams(), $transition$.params()).$raw(),
        $transition$.from(), extend(new StateParams(), $transition$.$from().params()).$raw(), error);

      if (!evt.defaultPrevented) {
        $urlRouter.update();
      }
    });
  }
}

stateNotFoundHandler.$inject = ['$transition$', '$state', '$rootScope', '$urlRouter'];
function stateNotFoundHandler($transition$, $state, $rootScope, $urlRouter) {
  if ($transition$.$to().valid())
    return;

  /**
   * @ngdoc event
   * @name ui.router.state.$state#$stateNotFound
   * @eventOf ui.router.state.$state
   * @eventType broadcast on root scope
   * @description
   * Fired when a requested state **cannot be found** using the provided state name during transition.
   * The event is broadcast allowing any handlers a single chance to deal with the error (usually by
   * lazy-loading the unfound state). A `StateReference` object is passed to the listener handler,
   * you can see its properties in the example. You can use `event.preventDefault()` to abort the
   * transition and the promise returned from `transitionTo()` will be rejected with a
   * `'transition aborted'` error.
   *
   * @param {Object} event Event object.
   * @param {Object} unfoundState Unfound State information. Contains: `to, toParams, options` properties.
   * @param {State} fromState Current state object.
   * @param {Object} fromParams Current state params.
   * @param {Transition} transition Current transition object
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
  var options = $transition$.options();
  var redirect = { to: $transition$.to(), toParams: $transition$.params(), options: options };
  var e = $rootScope.$broadcast('$stateNotFound', redirect, $transition$.from(), $transition$.$from().params(), $transition$);

  if (e.defaultPrevented || e.retry)
    $urlRouter.update();

  function redirectFn() {
    return $state.redirect($transition$)
      .to(redirect.to, redirect.toParams, extend({ $isRetrying: true }, options));
  }

  if (e.defaultPrevented) {
    return false;
  } else if (e.retry || $state.get(redirect.to)) {
    return e.retry && isFunction(e.retry.then) ? e.retry.then(redirectFn) : redirectFn();
  }

  throw new Error($transition$.$to().error());
}


$StateEventsProvider.$inject = [];
function $StateEventsProvider() {
  $StateEventsProvider.prototype.instance = this;

  var runtime = false;
  var enabledStateEvents = { $stateNotFound: false, $stateChangeStart: false};

  /**
   * Enables a set of State Events by name.
   * @param eventNameArray An array of UI-Router 0.2.x State Event Names, e.g.,
   *    [ '$stateChangeStart', '$stateChangeSuccess', '$stateChangeError' ]
   *    or, the literal string "*" to enable all 0.2.x events
   */
  this.enabledEvents = function(eventNameArray) {
    if (eventNameArray && runtime)
      throw new Error("Cannot enable events at runtime (use $stateEventsProvider");

    if (eventNameArray == "*")
      eventNameArray = [ '$stateChangeStart', '$stateNotFound', '$stateChangeSuccess', '$stateChangeError' ];

    forEach(eventNameArray || [], function(name) {
      enabledStateEvents[name] = true;
    });

    return enabledStateEvents;
  };

  this.$get = [ '$transition', function($transition) {
    runtime = true;

    if (enabledStateEvents.$stateNotFound)
      $transition.provider.onBefore({}, stateNotFoundHandler, { priority: 1000 });
    if (enabledStateEvents. $stateChangeStart)
      $transition.provider.onBefore({}, stateChangeStartHandler, { priority: 1000 });

    return {
      provider: $StateEventsProvider.prototype.instance
    };
  }];
}



angular.module('ui.router.state.events', ['ui.router.state'])
  .provider("$stateEvents", <IServiceProviderFactory> $StateEventsProvider)
  .run([ '$stateEvents', function($stateEvents) { /* Invokes $get() */ }]);