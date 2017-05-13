/**
 * @ng1api
 * @module ng1
 */ /** */
import { StateDeclaration, _ViewDeclaration, IInjectable, Transition, HookResult } from "@uirouter/core";
/**
 * The signature for Angular 1 State Transition Hooks.
 *
 * State hooks are registered as onEnter/onRetain/onExit in state declarations.
 * State hooks can additionally be injected with $transition$ and $state$ for
 * the current [[Transition]] and [[StateObject]] in the transition.
 *
 * Transition State Hooks are callback functions that hook into the lifecycle events of specific states during a transition.
 * As a transition runs, it may exit some states, retain (keep) states, and enter states.
 * As each lifecycle event occurs, the hooks which are registered for the event and that state are called (in priority order).
 *
 * #### See also:
 *
 * - [[IHookRegistry.onExit]]
 * - [[IHookRegistry.onRetain]]
 * - [[IHookRegistry.onEnter]]
 *
 * #### Example:
 * ```js
 * onEnter: function() { console.log('Entering'); }
 * ```
 *
 * Not minification-safe
 * ```js
 * onRetain: function($state$) { console.log('Retained ' + $state$.name); }
 * ```
 *
 * Annotated for minification-safety
 * ```js
 * onExit: [ '$transition$', '$state', function($transition$, $state) {
 *   // always redirect to 'foo' state when being exited
 *   if ($transition$.to().name !== 'foo') {
 *     return $state.target('foo');
 *   }
 * } ]
 * ```
 *
 * @returns an optional [[HookResult]] which may alter the transition
 */
export interface Ng1StateTransitionHook {
    (...injectables: any[]): HookResult;
}
/**
 * @internalapi
 * an intermediate interface.
 *
 * Used to reset [[StateDeclaration]] typings to `any` so the [[Ng1StateDeclaration]] interface can then narrow them */
export interface _Ng1StateDeclaration extends StateDeclaration {
    onExit?: any;
    onRetain?: any;
    onEnter?: any;
}
/**
 * The StateDeclaration object is used to define a state or nested state.
 * It should be registered with the [[StateRegistry]].
 *
 * #### Example:
 * ```js
 * // StateDeclaration object
 * var foldersState = {
 *   name: 'folders',
 *   url: '/folders',
 *   resolve: {
 *     allfolders: function(FolderService) {
 *       return FolderService.list();
 *     }
 *   },
 *   template: "<ul><li ng-repeat='folder in allfolders'>{{folder.name}}</li></ul>",
 *   controller: function(allfolders, $scope) {
 *     $scope.allfolders = allfolders;
 *   }
 * }
 * ```
 *
 * Since this interface extends [[Ng1ViewDeclaration]], any view declaration properties can be set directly
 * on the state declaration and they will be applied to the view with the name `$default`.  For example:
 *
 * ```js
 * var state = {
 *   name: 'foo',
 *   url: '/foo',
 *   template: '<h1>foo</h1>',
 *   controller: 'FooController'
 * }
 * ```
 *
 * is simply syntactic sugar for:
 *
 * ```js
 * var state = {
 *   name: 'foo',
 *   url: '/foo',
 *   views: {
 *     $default: {
 *       template: '<h1>foo</h1>',
 *       controller: 'FooController
 *     }
 *   }
 * }
 * ```
 *
 * If a state definition contains a `views:` object, any view properties set directly on the state are ignored.
 * Thus, this is an invalid state defintion:
 *
 * ```js
 * var state = {
 *   name: 'foo',
 *   url: '/foo',
 *   controller: 'FooController, // invalid because views: exists
 *   views: {
 *     header: {
 *       template: '<h1>header</h1>'
 *     }
 *   }
 * }
 * ```
 */
export interface Ng1StateDeclaration extends _Ng1StateDeclaration, Ng1ViewDeclaration {
    /**
     * An optional object which defines multiple named views.
     *
     * Each key is the name of a view, and each value is a [[Ng1ViewDeclaration]].
     * Unnamed views are internally renamed to `$default`.
     *
     * A view's name is used to match an active `<ui-view>` directive in the DOM.  When the state
     * is entered, the state's views are activated and matched with active `<ui-view>` directives:
     *
     * - The view's name is processed into a ui-view target:
     *   - ui-view address: an address to a ui-view
     *   - state anchor: the state to anchor the address to
     *
     *  Examples:
     *
     *  Targets three named ui-views in the parent state's template
     *
     * #### Example:
     * ```js
     * views: {
     *   header: {
     *     controller: "headerCtrl",
     *     templateUrl: "header.html"
     *   },
     *   body: {
     *     controller: "bodyCtrl",
     *     templateUrl: "body.html"
     *   },
     *   footer: "footerComponent"
     * }
     * ```
     *
     * #### Example:
     * ```js
     * // Targets named ui-view="header" in the template of the ancestor state 'top'
     * // and the named `ui-view="body" from the parent state's template.
     * views: {
     *   'header@top': {
     *     controller: "msgHeaderCtrl",
     *     templateUrl: "msgHeader.html"
     *   },
     *   'body': {
     *     controller: "messagesCtrl",
     *     templateUrl: "messages.html"
     *   }
     * }
     * ```
     *
     * ## View targeting details
     *
     * There are a few styles of view addressing/targeting.
     * The most common is a simple `ui-view` name
     *
     * #### Simple ui-view name
     *
     * Addresses without an `@` are anchored to the parent state.
     *
     * #### Example:
     * ```js
     * // target the `<div ui-view='foo'></div>` created in the parent state's view
     * views: {
     *   foo: {...}
     * }
     * ```
     *
     * #### View name anchored to a state
     *
     * You can anchor the `ui-view` name to a specific state by including an `@`
     *
     * #### Example:
     * targets the `<div ui-view='foo'></div>` which was created in a view owned by the state `bar.baz`
     * ```js
     * views: {
     *   'foo@bar.baz': {...}
     * }
     * ```
     *
     * #### Absolute addressing
     *
     * You can address a `ui-view` absolutely, using dotted notation, by prefixing the address with a `!`.
     * Dotted addresses traverse the hierarchy of `ui-view`s active in the DOM:
     *
     * #### Example:
     * absolutely targets the `<div ui-view='nested'></div>`
     * ... which was created in the unnamed/$default root `<ui-view></ui-view>`
     * ```js
     * views: {
     *   '!$default.nested': {...}
     * }
     * ```
     *
     * #### Relative addressing
     *
     * Absolute addressing is actually relative addressing, anchored to the unnamed root state (`""`).
     * You can also use relative addressing anchored to *any state*, in order to target a target deeply nested `ui-views`:
     * The `ui-view` is targeted relative to the anchored state by traversing the nested `ui-view` names.
     *
     * #### Example:
     * targets the `<div ui-view='bar'></div>`
     * ... which was created inside the
     * `<div ui-view='foo'></div>`
     * ... which was created inside the parent state's template.
     * ```js
     * views: {
     *   'foo.bar': {...}
     * }
     * ```
     *
     * #### Example:
     * targets the `<div ui-view='bar'></div>`
     * ... which was created in `<div ui-view='foo'></div>`
     * ... which was created in a template from the state `baz.qux`
     * ```js
     * views: {
     *   'foo.bar@baz.qux': {...}
     * }
     * ```
     *
     * #### Example:
     * a view can relatively target a named `ui-view` defined on an ancestor using `^` (meaning "parent")
     * ```js
     * views: {
     *   'foo@^': {...}, // foo@(parent state) (same as simply 'foo')
     *   'bar@^.^': {...}, // bar@(grandparent state)
     *   'baz@^.^.^': {...}, // baz@(great-grandparent state)
     * }
     * ```
     *
     * For additional in-depth details about how `ui-view` addressing works, see the internal api [[ViewService.match]].
     *
     * ---
     *
     * ## State template+controller and `views:` incompatiblity
     *
     * If a state has a `views` object, any state-level view properties ([[Ng1ViewDeclaration]]) are ignored.  Therefore,
     * if _any view_ for a state is declared in the `views` object, then _all of the state's views_ must be defined in
     * the `views` object.  The state declaration must not have any of the following fields:
     * - component
     * - bindings
     * - resolveAs
     * - template
     * - templateUrl
     * - templateProvider
     * - controller
     * - controllerAs
     * - controllerProvider
     */
    views?: {
        [key: string]: Ng1ViewDeclaration;
    };
    /**
     * A state hook invoked when a state is being entered.
     *
     * The hook can inject global services.
     * It can also inject `$transition$` or `$state$` (from the current transition).
     *
     * ### Example:
     * ```js
     * $stateProvider.state({
     *   name: 'mystate',
     *   onEnter: (MyService, $transition$, $state$) => {
     *     return MyService.doSomething($state$.name, $transition$.params());
     *   }
     * });
     * ```
     *
     * #### Example:`
     * ```js
     * $stateProvider.state({
     *   name: 'mystate',
     *   onEnter: [ 'MyService', '$transition$', '$state$', function (MyService, $transition$, $state$) {
     *     return MyService.doSomething($state$.name, $transition$.params());
     *   } ]
     * });
     * ```
     */
    onEnter?: Ng1StateTransitionHook | IInjectable;
    /**
     * A state hook invoked when a state is being exited.
     *
     * The hook can inject global services.
     * It can also inject `$transition$` or `$state$` (from the current transition).
     *
     * ### Example:
     * ```js
     * $stateProvider.state({
     *   name: 'mystate',
     *   onExit: (MyService, $transition$, $state$) => {
     *     return MyService.doSomething($state$.name, $transition$.params());
     *   }
     * });
     * ```
     *
     * #### Example:`
     * ```js
     * $stateProvider.state({
     *   name: 'mystate',
     *   onExit: [ 'MyService', '$transition$', '$state$', function (MyService, $transition$, $state$) {
     *     return MyService.doSomething($state$.name, $transition$.params());
     *   } ]
     * });
     * ```
     */
    onExit?: Ng1StateTransitionHook | IInjectable;
    /**
     * A state hook invoked when a state is being retained.
     *
     * The hook can inject global services.
     * It can also inject `$transition$` or `$state$` (from the current transition).
     *
     * #### Example:
     * ```js
     * $stateProvider.state({
     *   name: 'mystate',
     *   onRetain: (MyService, $transition$, $state$) => {
     *     return MyService.doSomething($state$.name, $transition$.params());
     *   }
     * });
     * ```
     *
     * #### Example:`
     * ```js
     * $stateProvider.state({
     *   name: 'mystate',
     *   onRetain: [ 'MyService', '$transition$', '$state$', function (MyService, $transition$, $state$) {
     *     return MyService.doSomething($state$.name, $transition$.params());
     *   } ]
     * });
     * ```
     */
    onRetain?: Ng1StateTransitionHook | IInjectable;
    /**
     * Makes all search/query parameters `dynamic`
     *
     * ### Deprecation warning: use [[ParamDeclaration.dynamic]] instead
     *
     * @deprecated
     */
    reloadOnSearch?: boolean;
}
export interface Ng1ViewDeclaration extends _ViewDeclaration {
    /**
     * The name of the component to use for this view.
     *
     * A property of [[Ng1StateDeclaration]] or [[Ng1ViewDeclaration]]:
     *
     * The name of an [angular 1.5+ `.component()`](https://docs.angularjs.org/guide/component) (or directive with
     * bindToController and/or scope declaration) which will be used for this view.
     *
     * Resolve data can be provided to the component via the component's `bindings` object (for 1.3+ directives, the
     * `bindToController` is used; for other directives, the `scope` declaration is used).  For each binding declared
     * on the component, any resolve with the same name is set on the component's controller instance.  The binding
     * is provided to the component as a one-time-binding.  In general, components should likewise declare their
     * input bindings as [one-way ("&lt;")](https://docs.angularjs.org/api/ng/service/$compile#-scope-).
     *
     * Note: inside a "views:" block, a bare string `"foo"` is shorthand for `{ component: "foo" }`
     *
     * Note: Mapping from resolve names to component inputs may be specified using [[bindings]].
     *
     * #### Example:
     * ```js
     * .state('profile', {
     *   // Use the <my-profile></my-profile> component for the Unnamed view
     *   component: 'MyProfile',
     * }
     *
     * .state('messages', {
     *   // use the <nav-bar></nav-bar> component for the view named 'header'
     *   // use the <message-list></message-list> component for the view named 'content'
     *   views: {
     *     header: { component: 'NavBar' },
     *     content: { component: 'MessageList' }
     *   }
     * }
     *
     * .state('contacts', {
     *   // Inside a "views:" block, a bare string "NavBar" is shorthand for { component: "NavBar" }
     *   // use the <nav-bar></nav-bar> component for the view named 'header'
     *   // use the <contact-list></contact-list> component for the view named 'content'
     *   views: {
     *     header: 'NavBar',
     *     content: 'ContactList'
     *   }
     * }
     * ```
     *
     *
     * Note: When using `component` to define a view, you may _not_ use any of: `template`, `templateUrl`,
     * `templateProvider`, `controller`, `controllerProvider`, `controllerAs`.
     *
     *
     * See also: Todd Motto's angular 1.3 and 1.4 [backport of .component()](https://github.com/toddmotto/angular-component)
     */
    component?: string;
    /**
     * An object which maps `resolve`s to [[component]] `bindings`.
     *
     * A property of [[Ng1StateDeclaration]] or [[Ng1ViewDeclaration]]:
     *
     * When using a [[component]] declaration (`component: 'myComponent'`), each input binding for the component is supplied
     * data from a resolve of the same name, by default.  You may supply data from a different resolve name by mapping it here.
     *
     * Each key in this object is the name of one of the component's input bindings.
     * Each value is the name of the resolve that should be provided to that binding.
     *
     * Any component bindings that are omitted from this map get the default behavior of mapping to a resolve of the
     * same name.
     *
     * #### Example:
     * ```js
     * $stateProvider.state('foo', {
     *   resolve: {
     *     foo: function(FooService) { return FooService.get(); },
     *     bar: function(BarService) { return BarService.get(); }
     *   },
     *   component: 'Baz',
     *   // The component's `baz` binding gets data from the `bar` resolve
     *   // The component's `foo` binding gets data from the `foo` resolve (default behavior)
     *   bindings: {
     *     baz: 'bar'
     *   }
     * });
     *
     * app.component('Baz', {
     *   templateUrl: 'baz.html',
     *   controller: 'BazController',
     *   bindings: {
     *     foo: '<', // foo binding
     *     baz: '<'  // baz binding
     *   }
     * });
     * ```
     *
     */
    bindings?: {
        [key: string]: string;
    };
    /**
     * Dynamic component provider function.
     *
     * A property of [[Ng1StateDeclaration]] or [[Ng1ViewDeclaration]]:
     *
     * This is an injectable provider function which returns the name of the component to use.
     * The provider will invoked during a Transition in which the view's state is entered.
     * The provider is called after the resolve data is fetched.
     *
     * #### Example:
     * ```js
     * componentProvider: function(MyResolveData, $transition$) {
     *   if (MyResolveData.foo) {
     *     return "fooComponent"
     *   } else if ($transition$.to().name === 'bar') {
     *     return "barComponent";
     *   }
     * }
     * ```
     */
    componentProvider?: IInjectable;
    /**
     * The view's controller function or name
     *
     * A property of [[Ng1StateDeclaration]] or [[Ng1ViewDeclaration]]:
     *
     * The controller function, or the name of a registered controller.  The controller function will be used
     * to control the contents of the [[directives.uiView]] directive.
     *
     * If specified as a string, controllerAs can be declared here, i.e., "FooController as foo" instead of in
     * a separate [[controllerAs]] property.
     *
     * See: [[Ng1Controller]] for information about component-level router hooks.
     */
    controller?: (IInjectable | string);
    /**
     * A controller alias name.
     *
     * A property of [[Ng1StateDeclaration]] or [[Ng1ViewDeclaration]]:
     *
     * If present, the controller will be published to scope under the `controllerAs` name.
     * See: https://docs.angularjs.org/api/ng/directive/ngController
     */
    controllerAs?: string;
    /**
     * Dynamic controller provider function.
     *
     * A property of [[Ng1StateDeclaration]] or [[Ng1ViewDeclaration]]:
     *
     * This is an injectable provider function which returns the actual controller function, or the name
     * of a registered controller.  The provider will invoked during a Transition in which the view's state is
     * entered.  The provider is called after the resolve data is fetched.
     *
     * #### Example:
     * ```js
     * controllerProvider: function(MyResolveData, $transition$) {
     *   if (MyResolveData.foo) {
     *     return "FooCtrl"
     *   } else if ($transition$.to().name === 'bar') {
     *     return "BarCtrl";
     *   } else {
     *     return function($scope) {
     *       $scope.baz = "Qux";
     *     }
     *   }
     * }
     * ```
     */
    controllerProvider?: IInjectable;
    /**
     * The scope variable name to use for resolve data.
     *
     * A property of [[Ng1StateDeclaration]] or [[Ng1ViewDeclaration]]:
     *
     * When a view is activated, the resolved data for the state which the view belongs to is put on the scope.
     * This property sets the name of the scope variable to use for the resolved data.
     *
     * Defaults to `$resolve`.
     */
    resolveAs?: string;
    /**
     * The HTML template for the view.
     *
     * A property of [[Ng1StateDeclaration]] or [[Ng1ViewDeclaration]]:
     *
     * HTML template as a string, or a function which returns an html template as a string.
     * This template will be used to render the corresponding [[directives.uiView]] directive.
     *
     * This property takes precedence over templateUrl.
     *
     * If `template` is a function, it will be called with the Transition parameters as the first argument.
     *
     * #### Example:
     * ```js
     * template: "<h1>inline template definition</h1><div ui-view></div>"
     * ```
     *
     * #### Example:
     * ```js
     * template: function(params) {
     *   return "<h1>generated template</h1>";
     * }
     * ```
     */
    template?: (Function | string);
    /**
     * The URL for the HTML template for the view.
     *
     * A property of [[Ng1StateDeclaration]] or [[Ng1ViewDeclaration]]:
     *
     * A path or a function that returns a path to an html template.
     * The template will be fetched and used to render the corresponding [[directives.uiView]] directive.
     *
     * If `templateUrl` is a function, it will be called with the Transition parameters as the first argument.
     *
     * #### Example:
     * ```js
     * templateUrl: "/templates/home.html"
     * ```
     *
     * #### Example:
     * ```js
     * templateUrl: function(params) {
     *   return myTemplates[params.pageId];
     * }
     * ```
     */
    templateUrl?: (string | Function);
    /**
     * Injected function which returns the HTML template.
     *
     * A property of [[Ng1StateDeclaration]] or [[Ng1ViewDeclaration]]:
     *
     * Injected function which returns the HTML template.
     * The template will be used to render the corresponding [[directives.uiView]] directive.
     *
     * #### Example:
     * ```js
     * templateProvider: function(MyTemplateService, $transition$) {
     *   return MyTemplateService.getTemplate($transition$.params().pageId);
     * }
     * ```
     */
    templateProvider?: IInjectable;
}
/**
 * The shape of a controller for a view (and/or component), defining the controller callbacks.
 *
 * A view in UI-Router is comprised of either a `component` ([[Ng1ViewDeclaration.component]]) or a combination of a
 * `template` (or `templateProvider`) and a `controller` (or `controllerProvider`).
 *
 * The `controller` object (or the `component`'s controller object) can define component-level controller callbacks,
 * which UI-Router will call at the appropriate times.  These callbacks are similar to Transition Hooks
 * ([[IHookRegistry]]), but are only called if the view is currently active.
 *
 * This interface defines the UI-Router component callbacks.
 *
 */
export interface Ng1Controller {
    /** @hidden */
    $onInit(): void;
    /**
     * This callback is called when parameter values have changed.
     *
     * This callback can be used to respond to changing parameter values in the current state, or in parent/child states.
     * This callback is especially handy when using dynamic parameters ([[ParamDeclaration.dynamic]])
     *
     * Called when:
     * - The view is still active
     * - A new transition has completed successfully
     * - The state for the view (controller) was not reloaded
     * - At least one parameter value was changed
     *
     * Called with:
     * @param newValues an object containing the changed parameter values
     * @param $transition$ the new Transition which triggered this callback
     *
     * #### Example:
     * ```js
     * angular.module('foo').controller('FancyCtrl', function() {
     *   this.uiOnParamsChanged = function(newParams) {
     *     console.log("new params: ", newParams);
     *   }
     * });
     * ```
     */
    uiOnParamsChanged(newValues: any, $transition$: Transition): void;
    /**
     * This callback is called when the view's state is about to be exited.
     *
     * This callback is used to inform a view that it is about to be exited, due to a new [[Transition]].
     * The callback can ask for user confirmation, and cancel or alter the new Transition.  The callback should
     * return a value, or a promise for a value.  If a promise is returned, the new Transition waits until the
     * promise settles.
     *
     *
     * Called when:
     * - The view is still active
     * - A new Transition is about to run
     * - The new Transition will exit the view's state
     *
     * Called with:
     * - The new Transition
     *
     * Relevant return Values:
     * - `false`: The transition is cancelled.
     * - A rejected promise: The transition is cancelled.
     * - [[TargetState]]: The transition is redirected to the new target state.
     * - Anything else: the transition will continue normally (the state and view will be deactivated)
     *
     * #### Example:
     * ```js
     * app.component('myComponent', {
     *   template: '<input ng-model="$ctrl.data" type="text">',
     *   bindings: { 'data': '<' },
     *   controller: function() {
     *
     *     this.originalData = angular.copy(this.data);
     *
     *     this.uiCanExit = function() {
     *       if (!angular.equals(this.data, this.originalData) {
     *         // Note: This could also return a Promise and request async
     *         // confirmation using something like ui-bootstrap $modal
     *         return window.confirm("Data has changed.  Exit anyway and lose changes?");
     *       }
     *     }
     *   }
     * }
     * ```
     *
     * @param transition the new Transition that is about to exit the component's state
     * @return a HookResult, or a promise for a HookResult
     */
    uiCanExit(transition: Transition): HookResult;
}
/**
 * Manages which template-loading mechanism to use.
 *
 * Defaults to `$templateRequest` on Angular versions starting from 1.3, `$http` otherwise.
 */
export interface TemplateFactoryProvider {
    /**
     * Forces $templateFactory to use $http instead of $templateRequest.
     *
     * UI-Router uses `$templateRequest` by default on angular 1.3+.
     * Use this method to choose to use `$http` instead.
     *
     * ---
     *
     * ## Security warning
     *
     * This might cause XSS, as $http doesn't enforce the regular security checks for
     * templates that have been introduced in Angular 1.3.
     *
     * See the $sce documentation, section
     * <a href="https://docs.angularjs.org/api/ng/service/$sce#impact-on-loading-templates">
     * Impact on loading templates</a> for more details about this mechanism.
     *
     * *Note: forcing this to `false` on Angular 1.2.x will crash, because `$templateRequest` is not implemented.*
     *
     * @param useUnsafeHttpService `true` to use `$http` to fetch templates
     */
    useHttpService(useUnsafeHttpService: boolean): any;
}
declare module "@uirouter/core/lib/state/stateRegistry" {
    interface StateRegistry {
        register(state: Ng1StateDeclaration): any;
    }
}
