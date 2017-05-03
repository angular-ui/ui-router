/** @module ng1 */ /** for typedoc */
import { BuilderFunction, StateRegistry, StateService, OnInvalidCallback } from "@uirouter/core";
import { Ng1StateDeclaration } from "./interface";
/**
 * The Angular 1 `StateProvider`
 *
 * The `$stateProvider` works similar to Angular's v1 router, but it focuses purely
 * on state.
 *
 * A state corresponds to a "place" in the application in terms of the overall UI and
 * navigation. A state describes (via the controller / template / view properties) what
 * the UI looks like and does at that place.
 *
 * States often have things in common, and the primary way of factoring out these
 * commonalities in this model is via the state hierarchy, i.e. parent/child states aka
 * nested states.
 *
 * The `$stateProvider` provides interfaces to declare these states for your app.
 */
export declare class StateProvider {
    private stateRegistry;
    private stateService;
    constructor(stateRegistry: StateRegistry, stateService: StateService);
    /**
     * Decorates states when they are registered
     *
     * Allows you to extend (carefully) or override (at your own peril) the
     * `stateBuilder` object used internally by [[StateRegistry]].
     * This can be used to add custom functionality to ui-router,
     * for example inferring templateUrl based on the state name.
     *
     * When passing only a name, it returns the current (original or decorated) builder
     * function that matches `name`.
     *
     * The builder functions that can be decorated are listed below. Though not all
     * necessarily have a good use case for decoration, that is up to you to decide.
     *
     * In addition, users can attach custom decorators, which will generate new
     * properties within the state's internal definition. There is currently no clear
     * use-case for this beyond accessing internal states (i.e. $state.$current),
     * however, expect this to become increasingly relevant as we introduce additional
     * meta-programming features.
     *
     * **Warning**: Decorators should not be interdependent because the order of
     * execution of the builder functions in non-deterministic. Builder functions
     * should only be dependent on the state definition object and super function.
     *
     *
     * Existing builder functions and current return values:
     *
     * - **parent** `{object}` - returns the parent state object.
     * - **data** `{object}` - returns state data, including any inherited data that is not
     *   overridden by own values (if any).
     * - **url** `{object}` - returns a {@link ui.router.util.type:UrlMatcher UrlMatcher}
     *   or `null`.
     * - **navigable** `{object}` - returns closest ancestor state that has a URL (aka is
     *   navigable).
     * - **params** `{object}` - returns an array of state params that are ensured to
     *   be a super-set of parent's params.
     * - **views** `{object}` - returns a views object where each key is an absolute view
     *   name (i.e. "viewName@stateName") and each value is the config object
     *   (template, controller) for the view. Even when you don't use the views object
     *   explicitly on a state config, one is still created for you internally.
     *   So by decorating this builder function you have access to decorating template
     *   and controller properties.
     * - **ownParams** `{object}` - returns an array of params that belong to the state,
     *   not including any params defined by ancestor states.
     * - **path** `{string}` - returns the full path from the root down to this state.
     *   Needed for state activation.
     * - **includes** `{object}` - returns an object that includes every state that
     *   would pass a `$state.includes()` test.
     *
     * #### Example:
     * Override the internal 'views' builder with a function that takes the state
     * definition, and a reference to the internal function being overridden:
     * ```js
     * $stateProvider.decorator('views', function (state, parent) {
     *   let result = {},
     *       views = parent(state);
     *
     *   angular.forEach(views, function (config, name) {
     *     let autoName = (state.name + '.' + name).replace('.', '/');
     *     config.templateUrl = config.templateUrl || '/partials/' + autoName + '.html';
     *     result[name] = config;
     *   });
     *   return result;
     * });
     *
     * $stateProvider.state('home', {
     *   views: {
     *     'contact.list': { controller: 'ListController' },
     *     'contact.item': { controller: 'ItemController' }
     *   }
     * });
     * ```
     *
     *
     * ```js
     * // Auto-populates list and item views with /partials/home/contact/list.html,
     * // and /partials/home/contact/item.html, respectively.
     * $state.go('home');
     * ```
     *
     * @param {string} name The name of the builder function to decorate.
     * @param {object} func A function that is responsible for decorating the original
     * builder function. The function receives two parameters:
     *
     *   - `{object}` - state - The state config object.
     *   - `{object}` - super - The original builder function.
     *
     * @return {object} $stateProvider - $stateProvider instance
     */
    decorator(name: string, func: BuilderFunction): Function | this | BuilderFunction[];
    /**
     * Registers a state
     *
     * ### This is a passthrough to [[StateRegistry.register]].
     *
     * Registers a state configuration under a given state name.
     * The stateConfig object has the following acceptable properties.
     *
     * <a id='template'></a>
     *
     * - **`template`** - {string|function=} - html template as a string or a function that returns
     *   an html template as a string which should be used by the uiView directives. This property
     *   takes precedence over templateUrl.
     *
     *   If `template` is a function, it will be called with the following parameters:
     *
     *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by
     *     applying the current state
     *
     * <a id='templateUrl'></a>
     *
     * - **`templateUrl`** - {string|function=} - path or function that returns a path to an html
     *   template that should be used by uiView.
     *
     *   If `templateUrl` is a function, it will be called with the following parameters:
     *
     *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by
     *     applying the current state
     *
     * <a id='templateProvider'></a>
     *
     * - **`templateProvider`** - {function=} - Provider function that returns HTML content
     *   string.
     *
     * <a id='controller'></a>
     *
     * - **`controller`** - {string|function=} -  Controller fn that should be associated with newly
     *   related scope or the name of a registered controller if passed as a string.
     *
     * <a id='controllerProvider'></a>
     *
     * - **`controllerProvider`** - {function=} - Injectable provider function that returns
     *   the actual controller or string.
     *
     * <a id='controllerAs'></a>
     *
     * - **`controllerAs`** – {string=} – A controller alias name. If present the controller will be
     *   published to scope under the controllerAs name.
     *
     * <a id='resolve'></a>
     *
     * - **`resolve`** - {object.&lt;string, function&gt;=} - An optional map of dependencies which
     *   should be injected into the controller. If any of these dependencies are promises,
     *   the router will wait for them all to be resolved or one to be rejected before the
     *   controller is instantiated. If all the promises are resolved successfully, the values
     *   of the resolved promises are injected and $stateChangeSuccess event is fired. If any
     *   of the promises are rejected the $stateChangeError event is fired. The map object is:
     *
     *   - key - {string}: name of dependency to be injected into controller
     *   - factory - {string|function}: If string then it is alias for service. Otherwise if function,
     *     it is injected and return value it treated as dependency. If result is a promise, it is
     *     resolved before its value is injected into controller.
     *
     * <a id='url'></a>
     *
     * - **`url`** - {string=} - A url with optional parameters. When a state is navigated or
     *   transitioned to, the `$stateParams` service will be populated with any
     *   parameters that were passed.
     *
     * <a id='params'></a>
     *
     * - **`params`** - {object=} - An array of parameter names or regular expressions. Only
     *   use this within a state if you are not using url. Otherwise you can specify your
     *   parameters within the url. When a state is navigated or transitioned to, the
     *   $stateParams service will be populated with any parameters that were passed.
     *
     * <a id='views'></a>
     *
     * - **`views`** - {object=} - Use the views property to set up multiple views or to target views
     *   manually/explicitly.
     *
     * <a id='abstract'></a>
     *
     * - **`abstract`** - {boolean=} - An abstract state will never be directly activated,
     *   but can provide inherited properties to its common children states.
     *
     * <a id='onEnter'></a>
     *
     * - **`onEnter`** - {object=} - Callback function for when a state is entered. Good way
     *   to trigger an action or dispatch an event, such as opening a dialog.
     * If minifying your scripts, make sure to use the `['injection1', 'injection2', function(injection1, injection2){}]` syntax.
     *
     * <a id='onExit'></a>
     *
     * - **`onExit`** - {object=} - Callback function for when a state is exited. Good way to
     *   trigger an action or dispatch an event, such as opening a dialog.
     * If minifying your scripts, make sure to use the `['injection1', 'injection2', function(injection1, injection2){}]` syntax.
     *
     * <a id='reloadOnSearch'></a>
     *
     * - **`reloadOnSearch = true`** - {boolean=} - If `false`, will not retrigger the same state
     *   just because a search/query parameter has changed (via $location.search() or $location.hash()).
     *   Useful for when you'd like to modify $location.search() without triggering a reload.
     *
     * <a id='data'></a>
     *
     * - **`data`** - {object=} - Arbitrary data object, useful for custom configuration.
     *
     * #### Example:
     * Some state name examples
     * ```js
     * // stateName can be a single top-level name (must be unique).
     * $stateProvider.state("home", {});
     *
     * // Or it can be a nested state name. This state is a child of the
     * // above "home" state.
     * $stateProvider.state("home.newest", {});
     *
     * // Nest states as deeply as needed.
     * $stateProvider.state("home.newest.abc.xyz.inception", {});
     *
     * // state() returns $stateProvider, so you can chain state declarations.
     * $stateProvider
     *   .state("home", {})
     *   .state("about", {})
     *   .state("contacts", {});
     * ```
     *
     * @param {string} name A unique state name, e.g. "home", "about", "contacts".
     * To create a parent/child state use a dot, e.g. "about.sales", "home.newest".
     * @param {object} definition State configuration object.
     */
    state(name: string, definition: Ng1StateDeclaration): StateProvider;
    state(definition: Ng1StateDeclaration): StateProvider;
    /**
     * Registers an invalid state handler
     *
     * This is a passthrough to [[StateService.onInvalid]] for ng1.
     */
    onInvalid(callback: OnInvalidCallback): Function;
}
