"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
var angular_1 = require("../angular");
(function () {
    var isFunction = angular_1.ng.isFunction, isString = angular_1.ng.isString;
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
    angular_1.ng.module('ui.router.state.events', ['ui.router.state'])
        .provider("$stateEvents", $StateEventsProvider)
        .run(['$stateEvents', function ($stateEvents) {
        }]);
})();
//# sourceMappingURL=stateEvents.js.map