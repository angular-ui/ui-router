/**
 * # Angular 1 injectable services
 *
 * This is a list of the objects which can be injected using angular's injector.
 *
 * There are three different kind of injectable objects:
 *
 * ## **Provider** objects
 * #### injectable into a `.config()` block during configtime
 *
 * - [[$uiRouterProvider]]: The UI-Router instance
 * - [[$stateProvider]]: State registration
 * - [[$urlRouterProvider]]: Url matching rules
 * - [[$urlMatcherFactoryProvider]]: Url parsing config
 * - [[$transitionsProvider]]: Transition hooks
 * - [[$uiViewScrollProvider]]: Disable ui-router view scrolling
 *
 * ## **Service** objects
 * #### injectable globally during runtime
 *
 * - [[$uiRouter]]: The UI-Router instance
 * - [[$trace]]: Enable transition trace/debug
 * - [[$transitions]]: Transition hooks
 * - [[$state]]: Imperative state related APIs
 * - [[$stateRegistry]]: State registration
 * - [[$urlRouter]]: URL synchronization (mainly internal)
 * - [[$urlMatcherFactory]]: URL parsing config
 * - [[$uiRouterGlobals]]: Global variables
 * - [[$uiViewScroll]]: Scroll an element into view
 * - [[$stateParams]]: Global state param values (deprecated)
 *
 * ## **Per-Transition** objects
 *
 * - injectable into:
 *   - Resolves ([[Ng1StateDeclaration.resolve]]),
 *   - Transition Hooks ([[TransitionService.onStart]], etc),
 *   - Routed Controllers ([[Ng1ViewDeclaration.controller]])
 *
 * #### different instances are injected based on the [[Transition]]
 *
 * - [[$transition$]]: The current Transition object
 * - [[$stateParams]]: State param values for pending Transition (deprecated)
 * - Any resolve data defined using [[Ng1StateDeclaration.resolve]]
 *
 * @ng1api @preferred @module injectables
 */ /** */

import { StateProvider } from "./stateProvider";
import {
    StateService, TransitionService, Transition, UrlRouter, UrlRouterProvider, UrlMatcherFactory,
    StateParams, StateRegistry, UIRouterGlobals, UIRouter, Trace
} from "ui-router-core";
import { UIViewScrollProvider } from "./viewScroll";

/**
 * The current (or pending) State Parameters
 *
 * An injectable global **Service Object** which holds the state parameters for the latest **SUCCESSFUL** transition.
 *
 * The values are not updated until *after* a `Transition` successfully completes.
 *
 * **Also:** an injectable **Per-Transition Object** object which holds the pending state parameters for the pending `Transition` currently running.
 *
 * ## Deprecation warning:
 *
 * The value injected for `$stateParams` is different depending on where it is injected.
 *
 * - When injected into an angular service, the object injected is the global **Service Object** with the parameter values for the latest successful `Transition`.
 * - When injected into transition hooks, resolves, or view controllers, the object is the **Per-Transition Object** with the parameter values for the running `Transition`.
 *
 * Because of these confusing details, this service is deprecated.
 *
 * @deprecated Instead of using the global `$stateParams` service object,
 * inject [[$uiRouterGlobals]] and use [[UIRouterGlobals.params]]
 *
 * ```js
 * MyService.$inject = ['$uiRouterGlobals'];
 * function MyService($uiRouterGlobals) {
 *   return {
 *     paramValues: function () {
 *       return $uiRouterGlobals.params;
 *     }
 *   }
 * }
 * ```
 *
 * @deprecated Instead of using the per-transition `$stateParams` object,
 * inject the current `Transition` (as [[$transition$]]) and use [[Transition.params]]
 *
 * ```js
 * MyController.$inject = ['$transition$'];
 * function MyController($transition$) {
 *   var username = $transition$.params().username;
 *   // .. do something with username
 * }
 * ```
 *
 * ---
 *
 * This object can be injected into other services.
 *
 * #### Deprecated Example:
 * ```js
 * SomeService.$inject = ['$http', '$stateParams'];
 * function SomeService($http, $stateParams) {
 *   return {
 *     getUser: function() {
 *       return $http.get('/api/users/' + $stateParams.username);
 *     }
 *   }
 * };
 * angular.service('SomeService', SomeService);
 * ```
 */
var $stateParams: StateParams;

/**
 * Global UI-Router variables
 *
 * An injectable global **Service Object** which holds global variables.
 *
 * This object contains globals such as the current state and current parameter values.
 */
var $uiRouterGlobals: UIRouterGlobals;

/**
 * The UI-Router instance
 *
 * The UI-Router instance as an injectable global **Service Object**.
 *
 * This object is the UI-Router singleton instance, created by angular dependency injection during application bootstrap.
 * It has references to the other UI-Router services
 *
 * The same object is also exposed as [[$uiRouterProvider]] for injection during angular config time.
 */
let $uiRouter: UIRouter ;

/**
 * The UI-Router instance
 *
 * The UI-Router instance as an injectable global **Service Object**.
 *
 * This object is the UI-Router singleton instance, created by angular dependency injection during application bootstrap.
 * It has references to the other UI-Router services
 *
 * The same object is also exposed as [[$uiRouter]] for injection during angular config time.
 */
var $uiRouterProvider: UIRouter;

/**
 * Transition debug/tracing
 *
 * Enables or disables Transition tracing which can help to debug issues.
 */
var $trace: Trace;

/**
 * The Transition Service
 *
 * An injectable **Service Object** primarily used to register transition hooks
 *
 * This angular service exposes the [[TransitionService]] singleton, which is used to register global transition hooks.
 *
 * The same object is also exposed as [[$transitionsProvider]] for injection during angular config time.
 */
var $transitions: TransitionService;

/**
 * The current [[Transition]] object
 *
 * An injectable **Per-Transition Object** which is the currently running [[Transition]].
 *
 * This object returns information about the current transition, including:
 *
 * - To/from states
 * - To/from parameters
 * - Transition options
 * - States being entered, exited, and retained
 * - Resolve data
 * - A Promise for the transition
 * - Any transition failure information
 * - An injector for both Service and Per-Transition Objects
 */
var $transition$: Transition;

/**
 * The Transition Service
 *
 * An injectable **Provider Object** primarily used to register transition hooks
 *
 * This angular provider exposes the [[TransitionService]] singleton, which is used to register global transition hooks.
 *
 * The same object is also exposed as [[$transitions]] for injection during runtime.
 */
var $transitionsProvider: TransitionService;

/**
 * The State Service
 *
 * An injectable global **Service Object** used to manage and query information on registered states.
 *
 * This service exposes state related APIs including:
 *
 * - Start a [[Transition]]
 * - Imperatively lazy load states
 * - Check if a state is currently active
 * - Look up states by name
 * - Build URLs for a state+parameters
 * - Configure the global Transition error handler
 *
 * This angular service exposes the [[StateService]] singleton.
 */
var $state: StateService;

/**
 * The State Registry
 *
 * An injectable global **Service Object** used to register/deregister states
 *
 * This service exposes the [[StateRegistry]] singleton which has state registration related APIs including:
 *
 * - Register/deregister states
 * - Listen for state registration/deregistration
 * - Get states by name
 * - Add state decorators (to customize the state creation process)
 */
var $stateRegistry: StateRegistry;

/**
 * The View Scroll provider
 *
 * An injectable **Provider Object** used to disable UI-Router's scroll behavior.
 *
 * This angular service exposes the [[UIViewScrollProvider]] singleton.
 */
var $uiViewScrollProvider: UIViewScrollProvider;

/**
 * Scrolls an element into view
 *
 * This is a function that scrolls an element into view.
 * The element is scrolled after a `$timeout` so the DOM has time to refresh.
 *
 * If you prefer to rely on `$anchorScroll` to scroll the view to the anchor,
 * this can be enabled by calling [[UIViewScrollProvider.useAnchorScroll]].
 *
 * Note: this function is used by the [[uiView]] when the `autoscroll` expression evaluates to true.
 */
var $uiViewScroll: ($element: JQuery) => void;

/**
 * The StateProvider
 *
 * An angular1 only injectable **Provider Object** used to register states.
 *
 * This angular service exposes the [[StateProvider]] singleton.
 *
 * The `StateProvider` is primarily used to register states or add custom state decorators.
 *
 * ##### Note: This provider is a ng1 vestige.
 * It is a passthrough to [[$stateRegistry]] and [[$state]].
 */
var $stateProvider: StateProvider;

/**
 * The URL Router Provider
 *
 * An injectable **Provider Object** used to add URL rules.
 *
 * This angular provider exposes the [[UrlRouterProvider]] singleton.
 * It is used to add URL rules, configure behavior when no url matches, and delay initial URL synchronization.
 */
var $urlRouterProvider: UrlRouterProvider;

/**
 * The Url Router
 *
 * An injectable global **Service Object** used to configure URL redirects.
 *
 * This angular service exposes the [[UrlRouter]] singleton.
 * It is used (mainly internally) to manage interaction with the URL.
 */
var $urlRouter: UrlRouter;

/**
 * The URL Matcher Factory
 *
 * An injectable global **Service Object** used to configure how the URL.
 *
 * This service is used to set url mapping options, and create [[UrlMatcher]] objects.
 *
 * This angular service exposes the [[UrlMatcherFactory]] singleton.
 * The singleton is also exposed at config-time as the [[$urlMatcherFactoryProvider]].
 */
var $urlMatcherFactory: UrlMatcherFactory;

/**
 * An injectable **Service Object** used to configure how the URL is matched.
 *
 * This angular service exposes the [[UrlMatcherFactory]] singleton at config-time.
 * It is used to set url mapping options, define custom parameter types, and create [[UrlMatcher]] objects.
 *
 * The singleton is also exposed at runtime as the [[$urlMatcherFactory]].
 */
var $urlMatcherFactoryProvider: UrlMatcherFactory;



