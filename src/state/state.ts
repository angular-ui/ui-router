/** @module state */ /** for typedoc */
import {
  extend, defaults, copy, equalForKeys, forEach, find, prop,
  propEq, ancestors, noop, isDefined, isObject, isString, values
} from "../common/common";
import {Queue} from "../common/queue";

import {IServiceProviderFactory, IPromise} from "angular";
import {StateService, StateDeclaration, StateOrName, HrefOptions, ViewDeclaration } from "./interface";
import {ITransitionService, TransitionOptions, TreeChanges} from "../transition/interface";
import {RawParams, ParamsOrArray} from "../params/interface";

import {Glob, StateQueueManager, StateBuilder, StateMatcher, State, TargetState, BuilderFunction} from "./module";
import {Transition, RejectFactory, defaultTransOpts} from "../transition/module";
import {PathFactory, Node} from "../path/module";
import {TransitionManager} from "./hooks/transitionManager";
import {paramTypes, Param, Type, StateParams} from "../params/module";
import {UrlMatcher} from "../url/urlMatcher";
import {ViewConfig} from "../view/view";
import {UrlMatcherFactory} from "../url/urlMatcherFactory";

/**
 * @ngdoc object
 * @name ui.router.state.$stateProvider
 *
 * @requires ui.router.router.$urlRouterProvider
 * @requires ui.router.util.$urlMatcherFactoryProvider
 *
 * @description
 * The new `$stateProvider` works similar to Angular's v1 router, but it focuses purely
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
export function $StateProvider($urlRouterProvider, $urlMatcherFactoryProvider: UrlMatcherFactory) {

  let root: State, states: { [key: string]: State } = {};
  let $state: StateService = <any> function $state() {};

  let matcher       = new StateMatcher(states);
  let builder       = new StateBuilder(() => root, matcher, $urlMatcherFactoryProvider);
  let stateQueue    = new StateQueueManager(states, builder, $urlRouterProvider, $state);
  let transQueue    = new Queue<Transition>();
  let treeChangesQueue = new Queue<TreeChanges>();
  let rejectFactory = new RejectFactory();

  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#decorator
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Allows you to extend (carefully) or override (at your own peril) the
   * `stateBuilder` object used internally by `$stateProvider`. This can be used
   * to add custom functionality to ui-router, for example inferring templateUrl
   * based on the state name.
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
   * @example
   * <pre>
   * // Override the internal 'views' builder with a function that takes the state
   * // definition, and a reference to the internal function being overridden:
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
   *
   * // ...
   *
   * $state.go('home');
   * // Auto-populates list and item views with /partials/home/contact/list.html,
   * // and /partials/home/contact/item.html, respectively.
   * </pre>
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
  this.decorator = decorator;
  function decorator(name: string, func: BuilderFunction) {
    /*jshint validthis: true */
    return builder.builder(name, func) || this;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#state
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Registers a state configuration under a given state name. The stateConfig object
   * has the following acceptable properties.
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
   * @example
   * <pre>
   * // Some state name examples
   *
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
   * </pre>
   *
   * @param {string} name A unique state name, e.g. "home", "about", "contacts".
   * To create a parent/child state use a dot, e.g. "about.sales", "home.newest".
   * @param {object} definition State configuration object.
   */
  this.state = state;
  function state(name, definition) {
    if (isObject(name)) {
      definition = name;
    } else {
      definition.name = name;
    }
    stateQueue.register(definition);
    return this;
  }



  let invalidCallbacks: Function[] = [];
  this.onInvalid = onInvalid;

  /**
   * @ngdoc function
   * @name ui.router.state.$stateProvider#onInvalid
   * @methodOf ui.router.state.$stateProvider
   *
   * @description
   * Registers a function to be injected and invoked when transitionTo has been called with an invalid
   * state reference parameter
   *
   * This function can be injected with one some special values:
   * - **`$to$`**: TargetState
   * - **`$from$`**: TargetState
   *
   * @param {function} callback
   *   The function which will be injected and invoked, when a matching transition is started.
   *   The function may optionally return a {TargetState} or a Promise for a TargetState.  If one
   *   is returned, it is treated as a redirect.
   */

  function onInvalid(callback: Function) {
    invalidCallbacks.push(callback);
  }

  /**
   * @ngdoc object
   * @name ui.router.state.$state
   *
   * @requires $q
   * @requires $injector
   * @requires ui.router.state.$view
   * @requires ui.router.state.$stateParams
   * @requires ui.router.router.$urlRouter
   * @requires ui.router.state.$transitions
   *
   * @property {object} params A param object, e.g. {sectionId: section.id)}, that
   * you'd like to test against the current active state.
   * @property {object} current A reference to the state's config object. However
   * you passed it in. Useful for accessing custom data.
   * @property {object} transition Currently pending transition. A promise that'll
   * resolve or reject.
   *
   * @description
   * `$state` service is responsible for representing states as well as transitioning
   * between them. It also provides interfaces to ask for current state or even states
   * you're coming from.
   */
  this.$get = $get;
  $get.$inject = ['$q', '$injector', '$view', '$stateParams', '$urlRouter', '$transitions'];
  function $get(   $q,   $injector,   $view,   $stateParams,   $urlRouter,   _$transition) {

    /**
     * Invokes the onInvalid callbacks, in natural order.  Each callback's return value is checked in sequence
     * until one of them returns an instance of ITargetState.   The results of the callbacks are wrapped
     * in $q.when(), so the callbacks may return promises.
     *
     * If a callback returns an ITargetState, then it is used as arguments to $state.transitionTo() and
     * the result returned.
     */
    function handleInvalidTargetState(fromPath: Node[], $to$: TargetState) {
      const latestThing = () => transQueue.peekTail() || treeChangesQueue.peekTail();
      let latest = latestThing();
      let $from$ = PathFactory.makeTargetState(fromPath);
      let callbackQueue = new Queue<Function>([].concat(invalidCallbacks));

      const invokeCallback = (callback: Function) => $q.when($injector.invoke(callback, null, { $to$, $from$ }));

      function checkForRedirect(result) {
        if (!(result instanceof TargetState)) {
          return;
        }
        let target = <TargetState> result;
        // Recreate the TargetState, in case the state is now defined.
        target = $state.target(target.identifier(), target.params(), target.options());

        if (!target.valid()) return rejectFactory.invalid(target.error());
        if (latestThing() !== latest) return rejectFactory.superseded();

        return $state.transitionTo(target.identifier(), target.params(), target.options());
      }

      function invokeNextCallback() {
        let nextCallback = callbackQueue.dequeue();
        if (nextCallback === undefined) return rejectFactory.invalid($to$.error());
        return invokeCallback(nextCallback).then(checkForRedirect).then(result => result || invokeNextCallback());
      }

      return invokeNextCallback();
    }

    let $transitions: ITransitionService = <any> _$transition;
    // Implicit root state that is always active
    let rootStateDef: StateDeclaration = {
      name: '',
      url: '^',
      views: null,
      params: {
        '#': { value: null, type: 'hash' }
      },
      abstract: true
    };
    root = stateQueue.register(rootStateDef, true);

    root.navigable = null;
    const rootPath = () => PathFactory.bindTransNodesToPath([new Node(root, {})]);

    $view.rootContext(root);

    extend($state, {
      params: new StateParams(),
      current: root.self,
      $current: root,
      transition: null
    });

    stateQueue.flush($state);
    stateQueue.autoFlush = true; // Autoflush once we are in runtime

    /**
     * @ngdoc function
     * @name ui.router.state.$state#reload
     * @methodOf ui.router.state.$state
     *
     * @description
     * A method that force reloads the current state, or a partial state hierarchy. All resolves are re-resolved,
     * controllers reinstantiated, and events re-fired.
     *
     * @example
     * <pre>
     * let app angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.reload = function(){
     *     $state.reload();
     *   }
     * });
     * </pre>
     *
     * `reload()` is just an alias for:
     * <pre>
     * $state.transitionTo($state.current, $stateParams, {
     *   reload: true, inherit: false, notify: true
     * });
     * </pre>
     *
     * @param {string=|object=} reloadState - A state name or a state object, which is the root of the resolves to be re-resolved.
     * @example
     * <pre>
     * //assuming app application consists of 3 states: 'contacts', 'contacts.detail', 'contacts.detail.item'
     * //and current state is 'contacts.detail.item'
     * let app angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.reload = function(){
     *     //will reload 'contact.detail' and nested 'contact.detail.item' states
     *     $state.reload('contact.detail');
     *   }
     * });
     * </pre>
     *
     * @returns {promise} A promise representing the state of the new transition. See
     * {@link ui.router.state.$state#methods_go $state.go}.
     */
    $state.reload = function reload(reloadState: StateOrName): IPromise<State> {
      return $state.transitionTo($state.current, $stateParams, {
        reload: isDefined(reloadState) ? reloadState : true,
        inherit: false,
        notify: false
      });
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#go
     * @methodOf ui.router.state.$state
     *
     * @description
     * Convenience method for transitioning to a new state. `$state.go` calls
     * `$state.transitionTo` internally but automatically sets options to
     * `{ location: true, inherit: true, relative: $state.$current, notify: true }`.
     * This allows you to easily use an absolute or relative to path and specify
     * only the parameters you'd like to update (while letting unspecified parameters
     * inherit from the currently active ancestor states).
     *
     * @example
     * <pre>
     * let app = angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.go('contact.detail');
     *   };
     * });
     * </pre>
     * <img src='../ngdoc_assets/StateGoExamples.png'/>
     *
     * @param {string} to Absolute state name or relative state path. Some examples:
     *
     * - `$state.go('contact.detail')` - will go to the `contact.detail` state
     * - `$state.go('^')` - will go to a parent state
     * - `$state.go('^.sibling')` - will go to a sibling state
     * - `$state.go('.child.grandchild')` - will go to grandchild state
     *
     * @param {object=} params A map of the parameters that will be sent to the state,
     * will populate $stateParams. Any parameters that are not specified will be inherited from currently
     * defined parameters. This allows, for example, going to a sibling state that shares parameters
     * specified in a parent state. Parameter inheritance only works between common ancestor states, I.e.
     * transitioning to a sibling will get you the parameters for all parents, transitioning to a child
     * will get you all current parameters, etc.
     * @param {object=} options Options object. The options are:
     *
     * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
     *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
     * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'),
     *    defines which state to be relative from.
     * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
     * - **`reload`** (v0.2.5) - {boolean=false}, If `true` will force transition even if the state or params
     *    have not changed, aka a reload of the same state. It differs from reloadOnSearch because you'd
     *    use this when you want to force a reload when *everything* is the same, including search params.
     *
     * @returns {promise} A promise representing the state of the new transition.
     *
     * Possible success values:
     *
     * - $state.current
     *
     * <br/>Possible rejection values:
     *
     * - 'transition superseded' - when a newer transition has been started after this one
     * - 'transition prevented' - when `event.preventDefault()` has been called in a `$stateChangeStart` listener
     * - 'transition aborted' - when `event.preventDefault()` has been called in a `$stateNotFound` listener or
     *   when a `$stateNotFound` `event.retry` promise errors.
     * - 'transition failed' - when a state has been unsuccessfully found after 2 tries.
     * - *resolve error* - when an error has occurred with a `resolve`
     *
     */
    $state.go = function go(to: StateOrName, params: RawParams, options: TransitionOptions): IPromise<State> {
      let defautGoOpts = { relative: $state.$current, inherit: true };
      let transOpts = defaults(options, defautGoOpts, defaultTransOpts);
      return $state.transitionTo(to, params, transOpts);
    };

    /** Factory method for creating a TargetState */
    $state.target = function target(identifier: StateOrName, params: ParamsOrArray, options: TransitionOptions = {}): TargetState {
      let stateDefinition = matcher.find(identifier, options.relative);
      return new TargetState(identifier, stateDefinition, params, options);
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#transitionTo
     * @methodOf ui.router.state.$state
     *
     * @description
     * Low-level method for transitioning to a new state. {@link ui.router.state.$state#methods_go $state.go}
     * uses `transitionTo` internally. `$state.go` is recommended in most situations.
     *
     * @example
     * <pre>
     * let app = angular.module('app', ['ui.router']);
     *
     * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.transitionTo('contact.detail');
     *   };
     * });
     * </pre>
     *
     * @param {string} to State name.
     * @param {object=} toParams A map of the parameters that will be sent to the state,
     * will populate $stateParams.
     * @param {object=} options Options object. The options are:
     *
     * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
     *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
     * - **`inherit`** - {boolean=false}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=}, When transitioning with relative path (e.g '^'),
     *    defines which state to be relative from.
     * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
     * - **`reload`** (v0.2.5) - {boolean=false}, If `true` will force transition even if the state or params
     *    have not changed, aka a reload of the same state. It differs from reloadOnSearch because you'd
     *    use this when you want to force a reload when *everything* is the same, including search params.
     *
     * @returns {promise} A promise representing the state of the new transition. See
     * {@link ui.router.state.$state#methods_go $state.go}.
     */
    $state.transitionTo = function transitionTo(to: StateOrName, toParams: RawParams = {}, options: TransitionOptions = {}): IPromise<State> {
      options = defaults(options, defaultTransOpts);
      options = extend(options, { current: transQueue.peekTail.bind(transQueue)});

      // If we're reloading, find the state object to reload from
      if (isObject(options.reload) && !(<any>options.reload).name)
        throw new Error('Invalid reload state object');
      options.reloadState = options.reload === true ? $state.$current.path[0] : matcher.find(<any> options.reload, options.relative);

      if (options.reload && !options.reloadState)
        throw new Error(`No such reload state '${(isString(options.reload) ? options.reload : (<any>options.reload).name)}'`);

      let ref: TargetState = $state.target(to, toParams, options);
      let latestTreeChanges: TreeChanges = treeChangesQueue.peekTail();
      let currentPath: Node[] = latestTreeChanges ? latestTreeChanges.to : rootPath();

      if (!ref.exists())
        return handleInvalidTargetState(currentPath, ref);
      if (!ref.valid())
        return $q.reject(ref.error());

      let transition = $transitions.create(currentPath, ref);
      let tMgr = new TransitionManager(transition, $transitions, $urlRouter, $view, $state, $stateParams, $q, transQueue, treeChangesQueue);
      let transitionPromise = tMgr.runTransition();
      // Return a promise for the transition, which also has the transition object on it.
      return extend(transitionPromise, { transition });
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#is
     * @methodOf ui.router.state.$state
     *
     * @description
     * Similar to {@link ui.router.state.$state#methods_includes $state.includes},
     * but only checks for the full state name. If params is supplied then it will be
     * tested for strict equality against the current active params object, so all params
     * must match with none missing and no extras.
     *
     * @example
     * <pre>
     * $state.$current.name = 'contacts.details.item';
     *
     * // absolute name
     * $state.is('contact.details.item'); // returns true
     * $state.is(contactDetailItemStateObject); // returns true
     *
     * // relative name (. and ^), typically from a template
     * // E.g. from the 'contacts.details' template
     * <div ng-class="{highlighted: $state.is('.item')}">Item</div>
     * </pre>
     *
     * @param {string|object} stateOrName The state name (absolute or relative) or state object you'd like to check.
     * @param {object=} params A param object, e.g. `{sectionId: section.id}`, that you'd like
     * to test against the current active state.
     * @param {object=} options An options object.  The options are:
     *
     * - **`relative`** - {string|object} -  If `stateOrName` is a relative state name and `options.relative` is set, .is will
     * test relative to `options.relative` state (or name).
     *
     * @returns {boolean} Returns true if it is the state.
     */
    $state.is = function is(stateOrName: StateOrName, params?: RawParams, options?: TransitionOptions): boolean {
      options = defaults(options, { relative: $state.$current });
      let state = matcher.find(stateOrName, options.relative);
      if (!isDefined(state)) return undefined;
      if ($state.$current !== state) return false;
      return isDefined(params) && params !== null ? Param.equals(state.parameters(), $stateParams, params) : true;
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#includes
     * @methodOf ui.router.state.$state
     *
     * @description
     * A method to determine if the current active state is equal to or is the child of the
     * state stateName. If any params are passed then they will be tested for a match as well.
     * Not all the parameters need to be passed, just the ones you'd like to test for equality.
     *
     * @example
     * Partial and relative names
     * <pre>
     * $state.$current.name = 'contacts.details.item';
     *
     * // Using partial names
     * $state.includes("contacts"); // returns true
     * $state.includes("contacts.details"); // returns true
     * $state.includes("contacts.details.item"); // returns true
     * $state.includes("contacts.list"); // returns false
     * $state.includes("about"); // returns false
     *
     * // Using relative names (. and ^), typically from a template
     * // E.g. from the 'contacts.details' template
     * <div ng-class="{highlighted: $state.includes('.item')}">Item</div>
     * </pre>
     *
     * Basic globbing patterns
     * <pre>
     * $state.$current.name = 'contacts.details.item.url';
     *
     * $state.includes("*.details.*.*"); // returns true
     * $state.includes("*.details.**"); // returns true
     * $state.includes("**.item.**"); // returns true
     * $state.includes("*.details.item.url"); // returns true
     * $state.includes("*.details.*.url"); // returns true
     * $state.includes("*.details.*"); // returns false
     * $state.includes("item.**"); // returns false
     * </pre>
     *
     * @param {string} stateOrName A partial name, relative name, or glob pattern
     * to be searched for within the current state name.
     * @param {object=} params A param object, e.g. `{sectionId: section.id}`,
     * that you'd like to test against the current active state.
     * @param {object=} options An options object.  The options are:
     *
     * - **`relative`** - {string|object=} -  If `stateOrName` is a relative state reference and `options.relative` is set,
     * .includes will test relative to `options.relative` state (or name).
     *
     * @returns {boolean} Returns true if it does include the state
     */
    $state.includes = function includes(stateOrName: StateOrName, params?: RawParams, options?: TransitionOptions): boolean {
      options = defaults(options, { relative: $state.$current });
      let glob = isString(stateOrName) && Glob.fromString(<string> stateOrName);

      if (glob) {
        if (!glob.matches($state.$current.name)) return false;
        stateOrName = $state.$current.name;
      }
      let state = matcher.find(stateOrName, options.relative), include = $state.$current.includes;

      if (!isDefined(state)) return undefined;
      if (!isDefined(include[state.name])) return false;
      // @TODO Replace with Param.equals() ?
      return params ? equalForKeys(Param.values(state.parameters(), params), $stateParams, Object.keys(params)) : true;
    };


    /**
     * @ngdoc function
     * @name ui.router.state.$state#href
     * @methodOf ui.router.state.$state
     *
     * @description
     * A url generation method that returns the compiled url for the given state populated with the given params.
     *
     * @example
     * <pre>
     * expect($state.href("about.person", { person: "bob" })).toEqual("/about/bob");
     * </pre>
     *
     * @param {string|object} stateOrName The state name or state object you'd like to generate a url from.
     * @param {object=} params An object of parameter values to fill the state's required parameters.
     * @param {object=} options Options object. The options are:
     *
     * - **`lossy`** - {boolean=true} -  If true, and if there is no url associated with the state provided in the
     *    first parameter, then the constructed href url will be built from the first navigable ancestor (aka
     *    ancestor with a valid url).
     * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
     * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'),
     *    defines which state to be relative from.
     * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
     *
     * @returns {string} compiled state url
     */
    $state.href = function href(stateOrName: StateOrName, params?: RawParams, options?: HrefOptions): string {
      let defaultHrefOpts = {
        lossy:    true,
        inherit:  true,
        absolute: false,
        relative: $state.$current
      };
      options = defaults(options, defaultHrefOpts);

      let state = matcher.find(stateOrName, options.relative);

      if (!isDefined(state)) return null;
      if (options.inherit) params = $stateParams.$inherit(params || {}, $state.$current, state);

      let nav = (state && options.lossy) ? state.navigable : state;

      if (!nav || nav.url === undefined || nav.url === null) {
        return null;
      }
      return $urlRouter.href(nav.url, Param.values(state.parameters(), params), {
        absolute: options.absolute
      });
    };

    /**
     * @ngdoc function
     * @name ui.router.state.$state#get
     * @methodOf ui.router.state.$state
     *
     * @description
     * Returns the state configuration object for any specific state or all states.
     *
     * @param {string|Object=} stateOrName (absolute or relative) If provided, will only get the config for
     * the requested state. If not provided, returns an array of ALL state configs.
     * @param {string|object=} base When stateOrName is a relative state reference, the state will be retrieved relative to context.
     * @returns {Object|Array} State configuration object or array of all objects.
     */
    $state.get = function (stateOrName: StateOrName, base: StateOrName): (StateDeclaration|StateDeclaration[]) {
      if (arguments.length === 0) return Object.keys(states).map(function(name) { return states[name].self; });
      let found = matcher.find(stateOrName, base || $state.$current);
      return found && found.self || null;
    };

    return $state;
  }
}
