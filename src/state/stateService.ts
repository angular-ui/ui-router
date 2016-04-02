/** @module state */ /** */
import {extend, defaults } from "../common/common";
import {isDefined, isObject, isString} from "../common/predicates";
import {Queue} from "../common/queue";
import {services} from "../common/coreservices";

import {PathFactory} from "../path/pathFactory";
import {Node} from "../path/node";

import {ViewService} from "../view/view";

import {StateParams} from "../params/stateParams";

import {UrlRouter} from "../url/urlRouter";

import {TransitionOptions} from "../transition/interface";
import {TransitionService, defaultTransOpts} from "../transition/transitionService";
import {RejectFactory} from "../transition/rejectFactory";
import {Transition} from "../transition/transition";

import {StateOrName, StateDeclaration} from "./interface";
import {StateRegistry} from "./stateRegistry";
import {State} from "./stateObject";
import {TargetState} from "./targetState";

import {RawParams} from "../params/interface";
import {ParamsOrArray} from "../params/interface";
import {TransitionManager} from "./hooks/transitionManager";
import {Param} from "../params/param";
import {Glob} from "../common/glob";
import {equalForKeys} from "../common/common";
import {HrefOptions} from "./interface";
import {StateProvider} from "./state";
import {bindFunctions} from "../common/common";
import {UIRouterGlobals} from "../globals";

export class StateService {
  get transition()  { return this.globals.transition; }
  get params()      { return this.globals.params; }
  get current()     { return this.globals.current; }
  get $current()    { return this.globals.$current; }

  private rejectFactory = new RejectFactory();

  constructor(private $view: ViewService,
              private $urlRouter: UrlRouter,
              private $transitions: TransitionService,
              private stateRegistry: StateRegistry,
              private stateProvider: StateProvider,
              private globals: UIRouterGlobals) {
    let getters = ['current', '$current', 'params', 'transition'];
    let boundFns = Object.keys(StateService.prototype).filter(key => getters.indexOf(key) === -1);
    bindFunctions(StateService.prototype, this, this, boundFns);
  }

  /**
   * Invokes the onInvalid callbacks, in natural order.  Each callback's return value is checked in sequence
   * until one of them returns an instance of TargetState.   The results of the callbacks are wrapped
   * in $q.when(), so the callbacks may return promises.
   *
   * If a callback returns an TargetState, then it is used as arguments to $state.transitionTo() and
   * the result returned.
   */
  private _handleInvalidTargetState(fromPath: Node[], $to$: TargetState) {
    const latestThing = () => this.globals.transitionHistory.peekTail();
    let latest = latestThing();
    let $from$ = PathFactory.makeTargetState(fromPath);
    let callbackQueue = new Queue<Function>([].concat(this.stateProvider.invalidCallbacks));
    let rejectFactory = this.rejectFactory;
    let {$q, $injector} = services;

    const invokeCallback = (callback: Function) => $q.when($injector.invoke(callback, null, { $to$, $from$ }));

    const checkForRedirect = (result) => {
      if (!(result instanceof TargetState)) {
        return;
      }
      let target = <TargetState> result;
      // Recreate the TargetState, in case the state is now defined.
      target = this.target(target.identifier(), target.params(), target.options());

      if (!target.valid()) return rejectFactory.invalid(target.error());
      if (latestThing() !== latest) return rejectFactory.superseded();

      return this.transitionTo(target.identifier(), target.params(), target.options());
    };

    function invokeNextCallback() {
      let nextCallback = callbackQueue.dequeue();
      if (nextCallback === undefined) return rejectFactory.invalid($to$.error());
      return invokeCallback(nextCallback).then(checkForRedirect).then(result => result || invokeNextCallback());
    }

    return invokeNextCallback();
  }

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
  reload(reloadState: StateOrName): Promise<State> {
    return this.transitionTo(this.current, this.params, {
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
  go(to: StateOrName, params: RawParams, options: TransitionOptions): Promise<State> {
    let defautGoOpts = { relative: this.$current, inherit: true };
    let transOpts = defaults(options, defautGoOpts, defaultTransOpts);
    return this.transitionTo(to, params, transOpts);
  };

  /** Factory method for creating a TargetState */
  target(identifier: StateOrName, params: ParamsOrArray, options: TransitionOptions = {}): TargetState {
    // If we're reloading, find the state object to reload from
    if (isObject(options.reload) && !(<any>options.reload).name)
      throw new Error('Invalid reload state object');
    options.reloadState = options.reload === true ? this.stateRegistry.root() : this.stateRegistry.matcher.find(<any> options.reload, options.relative);

    if (options.reload && !options.reloadState)
      throw new Error(`No such reload state '${(isString(options.reload) ? options.reload : (<any>options.reload).name)}'`);

    let stateDefinition = this.stateRegistry.matcher.find(identifier, options.relative);
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
  transitionTo(to: StateOrName, toParams: RawParams = {}, options: TransitionOptions = {}): Promise<State> {
    let transHistory = this.globals.transitionHistory;
    options = defaults(options, defaultTransOpts);
    options = extend(options, { current: transHistory.peekTail.bind(transHistory)});

    let ref: TargetState = this.target(to, toParams, options);
    let latestSuccess: Transition = this.globals.successfulTransitions.peekTail();
    const rootPath = () => PathFactory.bindTransNodesToPath([new Node(this.stateRegistry.root())]);
    let currentPath: Node[] = latestSuccess ? latestSuccess.treeChanges().to : rootPath();

    if (!ref.exists())
      return this._handleInvalidTargetState(currentPath, ref);
    if (!ref.valid())
      return services.$q.reject(ref.error());

    let transition = this.$transitions.create(currentPath, ref);
    let tMgr = new TransitionManager(transition, this.$transitions, this.$urlRouter, this.$view, <StateService> this, this.globals);
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
  is(stateOrName: StateOrName, params?: RawParams, options?: TransitionOptions): boolean {
    options = defaults(options, { relative: this.$current });
    let state = this.stateRegistry.matcher.find(stateOrName, options.relative);
    if (!isDefined(state)) return undefined;
    if (this.$current !== state) return false;
    return isDefined(params) && params !== null ? Param.equals(state.parameters(), this.params, params) : true;
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
  includes(stateOrName: StateOrName, params?: RawParams, options?: TransitionOptions): boolean {
    options = defaults(options, { relative: this.$current });
    let glob = isString(stateOrName) && Glob.fromString(<string> stateOrName);

    if (glob) {
      if (!glob.matches(this.$current.name)) return false;
      stateOrName = this.$current.name;
    }
    let state = this.stateRegistry.matcher.find(stateOrName, options.relative), include = this.$current.includes;

    if (!isDefined(state)) return undefined;
    if (!isDefined(include[state.name])) return false;
    // @TODO Replace with Param.equals() ?
    return params ? equalForKeys(Param.values(state.parameters(), params), this.params, Object.keys(params)) : true;
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
  href(stateOrName: StateOrName, params?: RawParams, options?: HrefOptions): string {
    let defaultHrefOpts = {
      lossy:    true,
      inherit:  true,
      absolute: false,
      relative: this.$current
    };
    options = defaults(options, defaultHrefOpts);

    let state = this.stateRegistry.matcher.find(stateOrName, options.relative);

    if (!isDefined(state)) return null;
    if (options.inherit) params = <any> this.params.$inherit(params || {}, this.$current, state);

    let nav = (state && options.lossy) ? state.navigable : state;

    if (!nav || nav.url === undefined || nav.url === null) {
      return null;
    }
    return this.$urlRouter.href(nav.url, Param.values(state.parameters(), params), {
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
  get(): StateDeclaration[];
  get(stateOrName: StateOrName): StateDeclaration;
  get(stateOrName: StateOrName, base: StateOrName): StateDeclaration;
  get(stateOrName?: StateOrName, base?: StateOrName): any {
    if (arguments.length === 0) return this.stateRegistry.get();
    return this.stateRegistry.get(stateOrName, base || this.$current);
  }
}
