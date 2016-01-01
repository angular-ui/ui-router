/** @module state */ /** for typedoc */
import {IPromise} from "angular";

import {TransitionOptions} from "../transition/interface";
import {ParamDeclaration, RawParams, ParamsOrArray} from "../params/interface";

import {State} from "./stateObject";
import {TargetState} from "./targetState";
import {UrlMatcher} from "../url/module";
import {Param} from "../params/module";
import {ViewContext} from "../view/interface";
import {Transition} from "../transition/module";

export type StateOrName = (string|StateDeclaration|State);

/**
 * @hidden
 * Internal Context obj, State-view definition, transition params
 */
export interface StateViewConfig {
  /** A view block from a state config */
  viewDeclarationObj: ViewDeclaration;
  /**  The name of the view block */
  rawViewName: string;
  /**  State params? */
  params: any;
  /**  The context object reference this ViewConfig belongs to */
  context: ViewContext;
}

/** View declaration inside state declaration */
export interface ViewDeclaration {

  /**
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * A Controller function or the name of a registered controller.
   * The controller function will be used to control the corresponding [[ui-view]] directive.
   *
   * If specified as a string, controllerAs can be specified here, i.e., "FooController as foo"
   */
  controller?:          (Function|string);

  /**
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * A controller alias name. If present, the controller will be published to scope under the `controllerAs` name.
   * See: https://docs.angularjs.org/api/ng/directive/ngController
   */
  controllerAs?:         string;

  /**
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * Injectable provider function that returns the actual controller function or name of a registered controller.
   *
   * @example 
   * ```js
   * 
   * controllerProvider: function(MyResolveData) {
   *   if (MyResolveData.foo) {
   *     return "FooCtrl"
   *   } else if (MyResolveData.bar) {
   *     return "BarCtrl";
   *   } else {
   *     return function($scope) {
   *       $scope.baz = "Qux";
   *     }
   *   }
   * }
   * ```
   */
  controllerProvider?:  Function;

  /**
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * HTML template as a string or a function which returns an html template as a string.
   * This template will be used to render the corresponding [[ui-view]] directive.
   *
   * This property takes precedence over templateUrl.
   *
   * If `template` is a function, it will be called with the State Parameters as the first argument.
   *
   * @example
   * ```js
   *
   * template: "<h1>inline template definition</h1><div ui-view></div>"
   * ```
   *
   * @example
   * ```js
   *
   * template: function(params) {
   *   return "<h1>generated template</h1>";
   * }
   * ```
   */
  template?:            (Function|string);

  /**
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * A path or a function that returns a path to an html template.
   * The template will be fetched and used to render the corresponding [[ui-view]] directive.
   *
   * If `templateUrl` is a function, it will be called with the State Parameters as the first argument.
   *
   * @example
   * ```js
   *
   * templateUrl: "/templates/home.html"
   * ```
   *
   * @example
   * ```js
   *
   * templateUrl: function(params) {
   *   return myTemplates[params.pageId];
   * }
   * ```
   */
  templateUrl?:         (string|Function);
  /**
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * Injected function which returns the HTML template.
   * The template will be used to render the corresponding [[ui-view]] directive.
   *
   * @example
   * ```js
   *
   * templateProvider: function(MyTemplateService, params) {
   *   return MyTemplateService.getTemplate(params.pageId);
   * }
   * ```
   */
  templateProvider?:    Function;
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
export interface StateDeclaration extends ViewDeclaration {
  /**
   * A unique state name, e.g. `"home"`, `"about"`, `"contacts"`.
   * To create a parent/child state use a dot, e.g. `"about.sales"`, `"home.newest"`.
   *
   *
   * Note: States require unique names.  If you omit this property, you must provide
   * the state name when you register it with the [[$stateProvider]].
   */
  name?: string;

  /**
   * An abstract state can never be directly activated.  Use an abstract state to provide inherited
   * properties (url, resolve, data, etc) to children states.
   */
  abstract?: boolean;

  /**
   * The parent state of this state can be specified using the [[name]] of the state, e.g., `"parentstate.childstate"`.
   * Alternatively, you can explicitly set the parent state using this property.  This allows shorter state
   * names, e.g., `<a ui-sref="childstate">Child</a>` instead of `<a ui-sref="parentstate.childstate">Child</a>
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
   * A property of [[StateDeclaration]]:
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
   * @TODO document this ;)
   */
  resolvePolicy?: (string|Object);

  /**
   * A property of [[StateDeclaration]]:
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
   * A property of [[StateDeclaration]]:
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
   * A property of [[StateDeclaration]]:
   *
   * An optional object which defines multiple views, or explicitly targets specific ui-views.
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
  views?: { [key: string]: ViewDeclaration; };
  data?: any;
  onEnter?: Function;
  onRetain?: Function;
  onExit?: Function;

  /**
   * @deprecated define individual parameters as [[ParamDeclaration.dynamic]]
   */
  reloadOnSearch?: boolean;
}

export interface StateParams {
  $digest: () => void;
  $inherit: (newParams, $current: State, $to: State) => StateParams;
  $set: (params, url) => boolean;
  $sync: () => StateParams;
  $off: () => StateParams;
  $raw: () => any;
  $localize: () => StateParams;
  $observe: (key, fn) => () => void;
}

export interface HrefOptions {
  relative?:  StateOrName;
  lossy?:     boolean;
  inherit?:   boolean;
  absolute?:  boolean;
}

export interface StateProvider {
  state(state: StateDeclaration): StateProvider;
  state(name: string, state: StateDeclaration): StateProvider;
  onInvalid(callback: Function): void;
  decorator(name: string, func: Function);
}

export interface StateService {
  params:       any; // TODO: StateParams
  current:      StateDeclaration;
  $current:     State;
  transition:   Transition;
  reload        (stateOrName: StateOrName): IPromise<State>;
  target        (identifier: StateOrName, params: ParamsOrArray, options: TransitionOptions): TargetState;
  go            (to: StateOrName, params: RawParams, options: TransitionOptions): IPromise<State>;
  transitionTo  (to: StateOrName, toParams: ParamsOrArray, options: TransitionOptions): IPromise<State>;
  is            (stateOrName: StateOrName, params?: RawParams, options?: TransitionOptions): boolean;
  includes      (stateOrName: StateOrName, params?: RawParams, options?: TransitionOptions): boolean;
  href          (stateOrName: StateOrName, params?: RawParams, options?: HrefOptions): string;
  get           (stateOrName: StateOrName, base?: StateOrName): (StateDeclaration|StateDeclaration[]);
}

