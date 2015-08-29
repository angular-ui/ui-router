/// <reference path='../../typings/angularjs/angular.d.ts' />
import {runtime} from "../common/angular1";
import {IPromise} from "angular";
import trace from "../common/trace";

import {ITransitionOptions, ITransitionHookOptions, ITreeChanges, IHookRegistry, IHookRegistration, IHookGetter} from "./interface";
import $transition from "./transitionService";
import {HookRegistry, matchState} from "./hookRegistry";
import HookBuilder from "./hookBuilder";
import {RejectFactory} from "./rejectFactory";

import {IResolvePath, ITransPath} from "../path/interface";
import PathFactory from "../path/pathFactory";

import ResolveContext from "../resolve/resolveContext";
import PathContext from "../resolve/pathContext";

import TargetState from "../state/targetState";
import {IState, IStateDeclaration, IStateViewConfig} from "../state/interface";

import ParamValues from "../params/paramValues";

import {extend, flatten, forEach, identity, isEq, isObject, map, not, prop, toJson, unnest, val,
    pairs, abstractKey} from "../common/common";

let transitionCount = 0, REJECT = new RejectFactory();
const stateSelf: (_state: IState) => IStateDeclaration = prop("self");

/**
 * @ngdoc object
 * @name ui.router.state.type:Transition
 *
 * @description
 * Represents a transition between two states, and contains all contextual information about the
 * to/from states and parameters, as well as the list of states being entered and exited as a
 * result of this transition.
 *
 * @param {Object} from The origin {@link ui.router.state.$stateProvider#state state} from which the transition is leaving.
 * @param {Object} to The target {@link ui.router.state.$stateProvider#state state} being transitioned to.
 * @param {Object} options An object hash of the options for this transition.
 *
 * @returns {Object} New `Transition` object
 */
export class Transition implements IHookRegistry {
  $id: number;

  promise: IPromise<any>;
  prepromise: IPromise<any>;
  redirects: IPromise<any>;

  private _options: ITransitionOptions;
  private _treeChanges: ITreeChanges;
  private _deferreds: any;

  onBefore:   IHookRegistration;
  onStart:    IHookRegistration;
  onEnter:    IHookRegistration;
  onExit:     IHookRegistration;
  onSuccess:  IHookRegistration;
  onError:    IHookRegistration;
  getHooks:   IHookGetter;

  constructor(fromPath: ITransPath, targetState: TargetState) {
    if (targetState.error()) throw new Error(targetState.error());

    this._options = extend({ current: val(this) }, targetState.options());
    this.$id = transitionCount++;
    let toPath = PathFactory.buildToPath(fromPath, targetState);
    this._treeChanges = PathFactory.treeChanges(fromPath, toPath, this._options.reloadState);

    this._deferreds = {
      prehooks: runtime.$q.defer(), // Resolved when the transition is complete, but success callback not run yet
      posthooks: runtime.$q.defer(), // Resolved when the transition is complete, after success callbacks
      redirects: runtime.$q.defer() // Resolved when any transition redirects are complete
    };

    // Expose three promises to users of Transition
    this.prepromise = this._deferreds.prehooks.promise;
    this.promise = this._deferreds.posthooks.promise;
    this.redirects = this._deferreds.redirects.promise;

    let registry: HookRegistry = new HookRegistry();
    HookRegistry.mixin(registry, this);
  }

  $from() {
    return  this._treeChanges.from.last().state;
  }

  $to() {
    return this._treeChanges.to.last().state;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#$from
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Returns the origin state of the current transition, as passed to the `Transition` constructor.
   *
   * @returns {TargetState} The origin state reference of the transition ("from state").
   */
  from() {
    return this.$from().self;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#$to
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Returns the target state of the current transition, as passed to the `Transition` constructor.
   *
   * @returns {TargetState} The state reference the transition is targetting ("to state")
   */
  to() {
    return this.$to().self;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#is
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Determines whether two transitions are equivalent.
   */
  is(compare: (Transition|{to: any, from: any})) {
    if (compare instanceof Transition) {
      // TODO: Also compare parameters
      return this.is({to: compare.$to().name, from: compare.$from().name});
    }
    return !(
        (compare.to && !matchState(this.$to(), compare.to)) ||
        (compare.from && !matchState(this.$from(), compare.from))
    );
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#params
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Gets the calculated StateParams object for the transition target.
   *
   * @returns {StateParams} the StateParams object for the transition.
   */
  // TODO
  params(pathname: string = "to"): ParamValues {
    return this._treeChanges[pathname].last().paramValues;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#previous
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Gets the previous transition from which this transition was redirected.
   *
   * @returns {Object} A `Transition` instance, or `null`.
   */
  previous(): Transition {
    return this._options.previous || null;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#options
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Returns all options passed to the constructor of this `Transition`.
   */
  options() {
    return this._options;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#entering
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Gets the states being entered.
   *
   * @returns {Array} Returns an array of states that will be entered in this transition.
   */
  entering(): IStateDeclaration[] {
    return this._treeChanges.entering.states().map(stateSelf);
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#exiting
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Gets the states being exited.
   *
   * @returns {Array} Returns an array of states that will be exited in this transition.
   */
  exiting(): IStateDeclaration[] {
    let exitingStates = this._treeChanges.exiting.states().map(stateSelf);
    exitingStates.reverse();
    return exitingStates;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#retained
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Gets the states being retained.
   *
   * @returns {Array} Returns an array of states that were entered in a previous transition that
   *           will not be exited.
   */
  retained(): IStateDeclaration[] {
    return this._treeChanges.retained.states().map(stateSelf);
  }

  // TODO
  context(pathname: string, state: IState): PathContext {
    let path = this._treeChanges[pathname].pathFromRootTo(state);
    return new PathContext(new ResolveContext(path), state, runtime.$injector, this._options);
  }

  /**
   * Returns a list of StateViewConfig objects;
   * Returns one StateViewConfig for each view in each state in a named path of the transition's tree changes
   */
  views(pathname: string = "entering", contextPathname: string = "to") {
    let path: IResolvePath = this._treeChanges[pathname];
    let states: IState[] = path.states();
    let params: ParamValues = this.params();

    return unnest(map(states, (state: IState) => {
      let context = state;
      let locals: PathContext = this.context(contextPathname, state);
      const makeViewConfig = ([rawViewName, viewDeclarationObj]) => { return <IStateViewConfig> {
        rawViewName, viewDeclarationObj, context, locals, params};
      };
      return pairs(state.views).map(makeViewConfig);
    }));
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#redirect
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Creates a new transition that is a redirection of the current one. This transition can
   * be returned from a `$transitionProvider` hook, `$state` event, or other method, to
   * redirect a transition to a new state and/or set of parameters.
   *
   * @returns {Transition} Returns a new `Transition` instance.
   */
  redirect(targetState: TargetState): Transition {
    let newOptions = extend({}, this.options(), targetState.options(), { previous: this} );
    targetState = new TargetState(targetState.identifier(), targetState.$state(), targetState.params(), newOptions);
    return new Transition(this._treeChanges.from, targetState);
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#ignored
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Indicates whether the transition should be ignored, based on whether the to and from states are the
   * same, and whether the `reload` option is set.
   *
   * @returns {boolean} Whether the transition should be ignored.
   */
  ignored() {
    let {to, from} = this._treeChanges;
    let [toState, fromState]  = [to, from].map((path) => path.last().state);
    let [toParams, fromParams]  = [to, from].map((path) => path.last().paramValues);
    return !this._options.reload &&
        toState === fromState &&
        toState.params.$$filter(not(prop('dynamic'))).$$equals(toParams, fromParams);
  }

  run () {
    if (this.error()) throw new Error(this.error());
    if (this._options.trace) trace.traceTransitionStart(this);
    let baseHookOptions: ITransitionHookOptions = {
      trace: this._options.trace,
      transition: this,
      current: this._options.current
    };

    let hookBuilder = new HookBuilder($transition, this._treeChanges, this, baseHookOptions);

    if (this.ignored()) {
      if (this._options.trace) trace.traceTransitionIgnored(this);
      let ignored = REJECT.ignored();
      forEach(this._deferreds, (def) => def.reject(ignored.reason));
      return ignored;
    }

    // Build a bunch of arrays of promises for each step of the transition
    let onBeforeHooks       = hookBuilder.getOnBeforeHooks();
    let onStartHooks        = hookBuilder.getOnStartHooks();

    let eagerResolves       = [hookBuilder.getEagerResolvePathHook()];
    let exitingStateHooks   = hookBuilder.getOnExitingHooks();
    let enteringStateHooks  = hookBuilder.getOnEnterHooks();

    // Set up a promise chain. Add the steps' promises in appropriate order to the promise chain.
    let asyncSteps = flatten([onStartHooks, eagerResolves, exitingStateHooks, enteringStateHooks]).filter(identity);

    // -----------------------------------------------------------------------
    // Transition Steps
    // -----------------------------------------------------------------------

    // ---- Synchronous hooks ----
    // Run the "onBefore" hooks and save their promises
    let chain = hookBuilder.runSynchronousHooks(onBeforeHooks);

    // ---- Asynchronous section ----

    // The results of the sync hooks is a promise chain (rejected or otherwise) that begins the async portion of the transition.
    // Build the rest of the chain off the sync promise chain out of all the asynchronous steps
    forEach(asyncSteps, function (step) {
      chain = chain.then(step.invokeStep);
    });

    // When the last step of the chain has resolved or any step has rejected (i.e., the transition is completed),
    // invoke the registered success or error hooks when the transition is completed.
    chain = chain.then(hookBuilder.getSuccessHooks(this._deferreds)).catch(hookBuilder.getErrorHooks(this._deferreds));

    // Return the overall transition promise, which is resolved/rejected in successHooks/errorHooks
    return this.promise;
  }

  isActive() {
    return isEq(this._options.current, val(this))();
  }

  // This doesn't work, and should probably go away.
  // abort() {
  //   if (this.isActive()) {
  //     $transition.transition = null; // TODO
  //   }
  // }

  valid() {
    return !this.error();
  }

  error() {
    let state = this._treeChanges.to.last().state;
    if (state.self[abstractKey])
      return `Cannot transition to abstract state '${state.name}'`;
    if (!state.params.$$validates(this.params()))
      return `Param values not valid for state '${state.name}'`;
  }

  toString () {
    let fromStateOrName = this.from();
    let toStateOrName = this.to();

    // (X) means the to state is invalid.
    let id = this.$id,
        from = isObject(fromStateOrName) ? fromStateOrName.name : fromStateOrName,
        fromParams = toJson(this._treeChanges.from.last().paramValues),
        toValid = this.valid() ? "" : "(X) ",
        to = isObject(toStateOrName) ? toStateOrName.name : toStateOrName,
        toParams = toJson(this.params());

    return `Transition#${id}( '${from}'${fromParams} -> ${toValid}'${to}'${toParams} )`;
  }
}