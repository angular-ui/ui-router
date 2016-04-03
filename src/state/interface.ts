/** @module state */ /** for typedoc */
import {TransitionOptions} from "../transition/interface";
import {ParamDeclaration, RawParams, ParamsOrArray} from "../params/interface";

import {Node} from "../path/node";
import {State} from "./stateObject";
import {TargetState} from "./targetState";
import {ViewContext} from "../view/interface";
import {Transition} from "../transition/module";

export type StateOrName = (string|StateDeclaration|State);


/**
 * Base interface for [[Ng1ViewDeclaration]] and [[Ng2ViewDeclaration]]
 *
 * This interface defines the basic data that a normalized view declaration will have on it.
 * Framework-specific implementations may add additional fields (to their interfaces which extend this interface).
 *
 * @hidden
 */
export interface _ViewDeclaration {
  /**
   * The raw name for the view declaration, i.e., the [[StateDeclaration.views]] property name.
   * 
   * @hidden
   */
  $name?: string;

  /**
   * The normalized address for the `ui-view` which this ViewConfig targets.
   *
   * A ViewConfig targets a `ui-view` in the DOM (relative to the `uiViewContextAnchor`) which has
   * a specific name.
   * @example `header` or `$default`
   *
   * The `uiViewName` can also target a _nested view_ by providing a dot-notation address
   * @example `foo.bar` or `foo.$default.bar`
   * 
   * @hidden
   */
  $uiViewName?: string;
  
  /**
   * The normalized context anchor (state name) for the `uiViewName`
   *
   * When targeting a `ui-view`, the `uiViewName` address is anchored to a context name (state name).
   * 
   * @hidden
   */
  $uiViewContextAnchor?: string;

  /**
   * A type identifier for the View
   *
   * This is used when loading prerequisites for the view, before it enters the DOM.  Different types of views
   * may load differently (e.g., templateProvider+controllerProvider vs component class)
   *
   * @hidden
   */
  $type?: string;

  /**
   * The context that this view is declared within.
   * @hidden
   */
  $context?: ViewContext;
}

/**
 * The StateDeclaration object is used to define a state or nested state.
 * It should be registered with the [[$stateProvider]].
 *
 * @example
 * ```js
 *
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
 */
export interface StateDeclaration {
  /**
   * The state name
   *
   * A unique state name, e.g. `"home"`, `"about"`, `"contacts"`.
   * To create a parent/child state use a dot, e.g. `"about.sales"`, `"home.newest"`.
   *
   *
   * Note: States require unique names.  If you omit this property, you must provide
   * the state name when you register it with the [[$stateProvider]].
   */
  name?: string;

  /**
   * abstract state indicator
   *
   * An abstract state can never be directly activated.  Use an abstract state to provide inherited
   * properties (url, resolve, data, etc) to children states.
   */
  abstract?: boolean;

  /**
   * The parent state
   *
   * Normally, a state's parent is implied from the state's [[name]], e.g., `"parentstate.childstate"`.
   *
   * Alternatively, you can explicitly set the parent state using this property.  This allows shorter state
   * names, e.g., `<a ui-sref="childstate">Child</a>` instead of `<a ui-sref="parentstate.childstate">Child</a>
   *
   * When using this property, the state's name should not have any dots in it.
   *
   * @example
   * ```js
   *
   * var parentstate = {
   *   name: 'parentstate'
   * }
   * var childstate = {
   *   name: 'childstate',
   *   parent: 'parentstate'
   *   // or use a JS var which is the parent StateDeclaration, i.e.:
   *   // parent: parentstate
   * }
   * ```
   */
  parent?: (string|StateDeclaration);
  
  /** 
   * Gets the private API portion of the state
   * 
   * @hidden 
   */
  $$state?: () => State;

  /**
   * Resolve - a mechanism to fetch data, which participates in the transition lifecycle
   *
   * An object which defines dynamic dependencies/data that can then be injected into this state (or its children)
   * during a Transition.
   *
   * Define a new dependency by adding a key/value to the `resolve` property of the [[StateDeclaration]].
   * - The key (string) is the name of the dependency.
   * - The value (function) is an injectable function which returns the dependency, or a promise for the dependency.
   *
   * @example
   * ```js
   *
   * resolve: {
   *   // If you inject `myStateDependency` into a controller, you'll get "abc"
   *   myStateDependency: function() {
   *     return "abc";
   *   },
   *   myAsyncData: function($http) {
   *     // Return a promise (async) for the data
   *     return $http.get("/api/v1/data");
   *   }
   * }
   * ```
   *
   * ### Lifecycle
   *
   * Since a resolve function can return a promise, the router will delay entering the state until the  promises
   * are ready.  If any of the promises are rejected, the Transition is aborted with an Error.
   *
   * By default, resolves for a state are fetched just before that state is entered. Note that only states
   * which are being *entered* have their resolves fetched.  States that are "retained" do not have their resolves
   * re-fetched.  If you are currently in a parent state `A` and are transitioning to a child state `A.B`, the
   * previously resolved data for state `A` can be injected into `A.B` without delay.
   *
   * Any resolved data for `A.B` is retained until `A.B` is exited, e.g., by transitioning back to the parent state `A`.
   *
   * Because of this, resolves are a great place to fetch your application's primary data.
   *
   * ### Injecting resolves into other things
   *
   * During a transition, Resolve data can be injected into:
   * - Transition Hooks, e.g., $transitions.onStart/onEnter
   * - ui-view Controllers
   * - TemplateProviders and ControllerProviders
   * - Other resolves
   *
   * ### Injecting other things into resolves
   *
   * Since resolve functions are injected, a common pattern is to inject a custom service such as `UserService`
   * and delegate to a custom service method, such as `UserService.list()`;
   *
   * A resolve function can inject some special values:
   * - `$transition$`: The current [[Transition]] object; information and API about the current transition, such as
   *    "to" and "from" State Parameters and transition options.
   * - Other resolves: This resolve can depend on another resolve, either from the same state, or from any parent state.
   * - `$stateParams`: (deprecated) The parameters for the current state (Note: these parameter values are
   *
   * @example
   * ```js
   *
   * resolve: {
   *   // Define a resolve 'allusers' which delegates to the UserService
   *   allusers: function(UserService) {
   *     return UserService.list(); // list() returns a promise (async) for all the users
   *   },
   *   // Define a resolve 'user' which depends on the allusers resolve.
   *   // This resolve function is not called until 'allusers' is ready.
   *   user: function(allusers, $transition$) {
   *     return _.find(allusers, $transition$.params().userId);
   *   }
   * }
   * ```
   */
  resolve?: { [key: string]: Function; };

  /**
   * Sets the resolve policy for the state
   *
   * This can be either "EAGER" or "LAZY".  When "EAGER", the state's resolves are fetched before any states
   * are entered.  When "LAZY", the resolves are fetched when the state is being entered.
   *
   * The default is "LAZY".
   */
  resolvePolicy?: (string|Object);

  /**
   * The url fragment for the state
   *
   * A URL fragment (with optional parameters) which is used to match the browser location with this state.
   *
   * This fragment will be appended to the parent state's URL in order to build up the overall URL for this state.
   * See [[UrlMatcher]] for details on acceptable patterns.
   *
   * @examples
   * ```js
   *
   * url: "/home"
   * // Define a parameter named 'userid'
   * url: "/users/:userid"
   * // param 'bookid' has a custom regexp
   * url: "/books/{bookid:[a-zA-Z_-]}"
   * // param 'categoryid' is of type 'int'
   * url: "/books/{categoryid:int}"
   * // two parameters for this state
   * url: "/books/{publishername:string}/{categoryid:int}"
   * // Query parameters
   * url: "/messages?before&after"
   * // Query parameters of type 'date'
   * url: "/messages?{before:date}&{after:date}"
   * // Path and query parameters
   * url: "/messages/:mailboxid?{before:date}&{after:date}"
   * ```
   */
  url?: string;

  /**
   * Params configuration
   *
   * An object which optionally configures parameters declared in the url, or defines additional non-url
   * parameters. For each parameter being configured, add a [[ParamDeclaration]] keyed to the name of the parameter.
   *
   * @example
   * ```js
   *
   * params: {
   *   param1: {
   *    type: "int",
   *    array: true,
   *    value: []
   *   },
   *   param2: {
   *     value: "index"
   *   }
   * }
   * ```
   */
  params?: { [key: string]: (ParamDeclaration|any); };

  /**
   * Named views
   *
   * An optional object which defines multiple views, or explicitly targets specific named ui-views.
   *
   * - What is a view config
   * - What is a ui-view
   * - Shorthand controller/template
   * - Incompatible with ^
   *
   *  Examples:
   *
   *  Targets three named ui-views in the parent state's template
   *
   * @example
   * ```js
   *
   * views: {
   *   header: {
   *     controller: "headerCtrl",
   *     templateUrl: "header.html"
   *   }, body: {
   *     controller: "bodyCtrl",
   *     templateUrl: "body.html"
   *   }, footer: {
   *     controller: "footCtrl",
   *     templateUrl: "footer.html"
   *   }
   * }
   * ```
   *
   * @example
   * ```js
   * // Targets named ui-view="header" from ancestor state 'top''s template, and
   * // named `ui-view="body" from parent state's template.
   * views: {
   *   'header@top': {
   *     controller: "msgHeaderCtrl",
   *     templateUrl: "msgHeader.html"
   *   }, 'body': {
   *     controller: "messagesCtrl",
   *     templateUrl: "messages.html"
   *   }
   * }
   * ```
   */
  views?: { [key: string]: _ViewDeclaration; };

  /**
   * An inherited property to store state data
   *
   * This is a spot for you to store inherited state metadata.  Child states' `data` object will
   * prototypically inherit from the parent state .
   *
   * This is a good spot to put metadata such as `requiresAuth`.
   */
  data?: any;
  /**  A Transition Hook called with the state is being entered.  See: [[IHookRegistry.onEnter]]*/
  onEnter?: Function;
  /**  A Transition Hook called with the state is being retained. See: [[IHookRegistry.onRetain]] */
  onRetain?: Function;
  /**  A Transition Hook called with the state is being exited. See: [[IHookRegistry.onExit]] */
  onExit?: Function;

  /**
   * @deprecated define individual parameters as [[ParamDeclaration.dynamic]]
   */
  reloadOnSearch?: boolean;
}

export interface HrefOptions {
  relative?:  StateOrName;
  lossy?:     boolean;
  inherit?:   boolean;
  absolute?:  boolean;
}

