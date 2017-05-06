/**
 * State-based routing for AngularJS 1.x
 * @version v1.0.1
 * @link https://ui-router.github.io
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('angular')) :
    typeof define === 'function' && define.amd ? define(['exports', 'angular'], factory) :
    (factory((global['@uirouter/angularjs-state-events'] = global['@uirouter/angularjs-state-events'] || {}),global.angular));
}(this, (function (exports,ng_from_import) { 'use strict';

var ng_from_global = angular;
var ng = (ng_from_import && ng_from_import.module) ? ng_from_import : ng_from_global;

/**
 * # Legacy state events
 *
 * Polyfill implementation of the UI-Router 0.2.x state events.
 *
 * The 0.2.x state events are deprecated.  We recommend moving to Transition Hooks instead, as they
 * provide much more flexibility, support async, and provide the context (the Transition, etc) necessary
 * to implement meaningful application behaviors.
 *
 * To enable these state events, include the `stateEvents.js` file in your project, e.g.,
 * ```
 * <script src="stateEvents.js"></script>
 * ```
 * and also make sure you depend on the `ui.router.state.events` angular module, e.g.,
 * ```
 * angular.module("myApplication", ['ui.router', 'ui.router.state.events']
 * ```
 *
 * @module ng1_state_events
 */ /** */
/**
 * An event broadcast on `$rootScope` when the state transition **begins**.
 *
 * ### Deprecation warning: use [[TransitionService.onStart]] instead
 *
 * You can use `event.preventDefault()`
 * to prevent the transition from happening and then the transition promise will be
 * rejected with a `'transition prevented'` value.
 *
 * Additional arguments to the event handler are provided:
 * - `toState`: the Transition Target state
 * - `toParams`: the Transition Target Params
 * - `fromState`: the state the transition is coming from
 * - `fromParams`: the parameters from the state the transition is coming from
 * - `options`: any Transition Options
 * - `$transition$`: the [[Transition]]
 *
 * #### Example:
 * ```js
 * $rootScope.$on('$stateChangeStart', function(event, transition) {
 *   event.preventDefault();
 *   // transitionTo() promise will be rejected with
 *   // a 'transition prevented' error
 * })
 * ```
 *
 * @event $stateChangeStart
 * @deprecated
 */
var $stateChangeStart;
/**
 * An event broadcast on `$rootScope` if a transition is **cancelled**.
 *
 * ### Deprecation warning: use [[TransitionService.onStart]] instead
 *
 * Additional arguments to the event handler are provided:
 * - `toState`: the Transition Target state
 * - `toParams`: the Transition Target Params
 * - `fromState`: the state the transition is coming from
 * - `fromParams`: the parameters from the state the transition is coming from
 * - `options`: any Transition Options
 * - `$transition$`: the [[Transition]] that was cancelled
 *
 * @event $stateChangeCancel
 * @deprecated
 */
var $stateChangeCancel;
/**
 * An event broadcast on `$rootScope` once the state transition is **complete**.
 *
 * ### Deprecation warning: use [[TransitionService.onStart]] and [[Transition.promise]], or [[Transition.onSuccess]]
 *
 * Additional arguments to the event handler are provided:
 * - `toState`: the Transition Target state
 * - `toParams`: the Transition Target Params
 * - `fromState`: the state the transition is coming from
 * - `fromParams`: the parameters from the state the transition is coming from
 * - `options`: any Transition Options
 * - `$transition$`: the [[Transition]] that just succeeded
 *
 * @event $stateChangeSuccess
 * @deprecated
 */
var $stateChangeSuccess;
/**
 * An event broadcast on `$rootScope` when an **error occurs** during transition.
 *
 * ### Deprecation warning: use [[TransitionService.onStart]] and [[Transition.promise]], or [[Transition.onError]]
 *
 * It's important to note that if you
 * have any errors in your resolve functions (javascript errors, non-existent services, etc)
 * they will not throw traditionally. You must listen for this $stateChangeError event to
 * catch **ALL** errors.
 *
 * Additional arguments to the event handler are provided:
 * - `toState`: the Transition Target state
 * - `toParams`: the Transition Target Params
 * - `fromState`: the state the transition is coming from
 * - `fromParams`: the parameters from the state the transition is coming from
 * - `error`: The reason the transition errored.
 * - `options`: any Transition Options
 * - `$transition$`: the [[Transition]] that errored
 *
 * @event $stateChangeError
 * @deprecated
 */
var $stateChangeError;
/**
 * An event broadcast on `$rootScope` when a requested state **cannot be found** using the provided state name.
 *
 * ### Deprecation warning: use [[StateService.onInvalid]] instead
 *
 * The event is broadcast allowing any handlers a single chance to deal with the error (usually by
 * lazy-loading the unfound state). A `TargetState` object is passed to the listener handler,
 * you can see its properties in the example. You can use `event.preventDefault()` to abort the
 * transition and the promise returned from `transitionTo()` will be rejected with a
 * `'transition aborted'` error.
 *
 * Additional arguments to the event handler are provided:
 * - `unfoundState` Unfound State information. Contains: `to, toParams, options` properties.
 * - `fromState`: the state the transition is coming from
 * - `fromParams`: the parameters from the state the transition is coming from
 * - `options`: any Transition Options
 *
 * #### Example:
 * ```js
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
 * ```
 *
 * @event $stateNotFound
 * @deprecated
 */
var $stateNotFound;
(function () {
    var isFunction = ng.isFunction, isString = ng.isString;
    function applyPairs(memo, keyValTuple) {
        var key, value;
        if (Array.isArray(keyValTuple))
            key = keyValTuple[0], value = keyValTuple[1];
        if (!isString(key))
            throw new Error("invalid parameters to applyPairs");
        memo[key] = value;
        return memo;
    }
    function stateChangeStartHandler($transition$) {
        if (!$transition$.options().notify || !$transition$.valid() || $transition$.ignored())
            return;
        var $injector = $transition$.injector();
        var $stateEvents = $injector.get('$stateEvents');
        var $rootScope = $injector.get('$rootScope');
        var $state = $injector.get('$state');
        var $urlRouter = $injector.get('$urlRouter');
        var enabledEvents = $stateEvents.provider.enabled();
        var toParams = $transition$.params("to");
        var fromParams = $transition$.params("from");
        if (enabledEvents.$stateChangeSuccess) {
            var startEvent = $rootScope.$broadcast('$stateChangeStart', $transition$.to(), toParams, $transition$.from(), fromParams, $transition$.options(), $transition$);
            if (startEvent.defaultPrevented) {
                if (enabledEvents.$stateChangeCancel) {
                    $rootScope.$broadcast('$stateChangeCancel', $transition$.to(), toParams, $transition$.from(), fromParams, $transition$.options(), $transition$);
                }
                //Don't update and resync url if there's been a new transition started. see issue #2238, #600
                if ($state.transition == null)
                    $urlRouter.update();
                return false;
            }
            // right after global state is updated
            var successOpts = { priority: 9999 };
            $transition$.onSuccess({}, function () {
                $rootScope.$broadcast('$stateChangeSuccess', $transition$.to(), toParams, $transition$.from(), fromParams, $transition$.options(), $transition$);
            }, successOpts);
        }
        if (enabledEvents.$stateChangeError) {
            $transition$.promise["catch"](function (error) {
                if (error && (error.type === 2 /* RejectType.SUPERSEDED */ || error.type === 3 /* RejectType.ABORTED */))
                    return;
                var evt = $rootScope.$broadcast('$stateChangeError', $transition$.to(), toParams, $transition$.from(), fromParams, error, $transition$.options(), $transition$);
                if (!evt.defaultPrevented) {
                    $urlRouter.update();
                }
            });
        }
    }
    stateNotFoundHandler.$inject = ['$to$', '$from$', '$state', '$rootScope', '$urlRouter'];
    function stateNotFoundHandler($to$, $from$, injector) {
        var $state = injector.get('$state');
        var $rootScope = injector.get('$rootScope');
        var $urlRouter = injector.get('$urlRouter');
        var redirect = { to: $to$.identifier(), toParams: $to$.params(), options: $to$.options() };
        var e = $rootScope.$broadcast('$stateNotFound', redirect, $from$.state(), $from$.params());
        if (e.defaultPrevented || e.retry)
            $urlRouter.update();
        function redirectFn() {
            return $state.target(redirect.to, redirect.toParams, redirect.options);
        }
        if (e.defaultPrevented) {
            return false;
        }
        else if (e.retry || !!$state.get(redirect.to)) {
            return e.retry && isFunction(e.retry.then) ? e.retry.then(redirectFn) : redirectFn();
        }
    }
    $StateEventsProvider.$inject = ['$stateProvider'];
    function $StateEventsProvider($stateProvider) {
        $StateEventsProvider.prototype.instance = this;
        var runtime = false;
        var allEvents = ['$stateChangeStart', '$stateNotFound', '$stateChangeSuccess', '$stateChangeError'];
        var enabledStateEvents = allEvents.map(function (e) { return [e, true]; }).reduce(applyPairs, {});
        function assertNotRuntime() {
            if (runtime)
                throw new Error("Cannot enable events at runtime (use $stateEventsProvider");
        }
        /**
         * Enables the deprecated UI-Router 0.2.x State Events
         * [ '$stateChangeStart', '$stateNotFound', '$stateChangeSuccess', '$stateChangeError' ]
         */
        this.enable = function () {
            var events = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                events[_i] = arguments[_i];
            }
            assertNotRuntime();
            if (!events || !events.length)
                events = allEvents;
            events.forEach(function (event) { return enabledStateEvents[event] = true; });
        };
        /**
         * Disables the deprecated UI-Router 0.2.x State Events
         * [ '$stateChangeStart', '$stateNotFound', '$stateChangeSuccess', '$stateChangeError' ]
         */
        this.disable = function () {
            var events = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                events[_i] = arguments[_i];
            }
            assertNotRuntime();
            if (!events || !events.length)
                events = allEvents;
            events.forEach(function (event) { return delete enabledStateEvents[event]; });
        };
        this.enabled = function () { return enabledStateEvents; };
        this.$get = $get;
        $get.$inject = ['$transitions'];
        function $get($transitions) {
            runtime = true;
            if (enabledStateEvents["$stateNotFound"])
                $stateProvider.onInvalid(stateNotFoundHandler);
            if (enabledStateEvents.$stateChangeStart)
                $transitions.onBefore({}, stateChangeStartHandler, { priority: 1000 });
            return {
                provider: $StateEventsProvider.prototype.instance
            };
        }
    }
    ng.module('ui.router.state.events', ['ui.router.state'])
        .provider("$stateEvents", $StateEventsProvider)
        .run(['$stateEvents', function ($stateEvents) {
        }]);
})();

exports.$stateChangeStart = $stateChangeStart;
exports.$stateChangeCancel = $stateChangeCancel;
exports.$stateChangeSuccess = $stateChangeSuccess;
exports.$stateChangeError = $stateChangeError;
exports.$stateNotFound = $stateNotFound;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=stateEvents.js.map
