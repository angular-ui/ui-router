/// <reference path='../../typings/angularjs/angular.d.ts' />
import {runtime} from "../common/angular1";
import {IPromise} from "angular";
import trace from "../common/trace";

import {ITransitionOptions, ITransitionHookOptions, ITreeChanges, IHookRegistry, IHookRegistration, IHookGetter} from "./interface";
import $transitions from "./transitionService";
import {HookRegistry, matchState} from "./hookRegistry";
import HookBuilder from "./hookBuilder";
import TransitionRunner from "./transitionRunner";
import {RejectFactory} from "./rejectFactory";

import Node from "../path/node";
import PathFactory from "../path/pathFactory";

import {State} from "../state/state";
import TargetState from "../state/targetState";
import {IStateDeclaration} from "../state/interface";

import Param from "../params/param";

import {ViewConfig} from "../view/view";

import {
  map, find, extend, flatten, unnest, tail, forEach, identity,
  omit, isObject, not, prop, propEq, toJson, val, abstractKey
} from "../common/common";

let transitionCount = 0, REJECT = new RejectFactory();
const stateSelf: (_state: State) => IStateDeclaration = prop("self");

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

  private _deferred = runtime.$q.defer();
  promise: IPromise<any> = this._deferred.promise;

  private _options: ITransitionOptions;
  private _treeChanges: ITreeChanges;

  onBefore:   IHookRegistration;
  onStart:    IHookRegistration;
  onEnter:    IHookRegistration;
  onRetain:   IHookRegistration;
  onExit:     IHookRegistration;
  onFinish:   IHookRegistration;
  onSuccess:  IHookRegistration;
  onError:    IHookRegistration;
  getHooks:   IHookGetter;

  constructor(fromPath: Node[], targetState: TargetState) {
    if (!targetState.valid()) {
      throw new Error(targetState.error());
    }

    // Makes the Transition instance a hook registry (onStart, etc)
    HookRegistry.mixin(new HookRegistry(), this);

    // current() is assumed to come from targetState.options, but provide a naive implementation otherwise.
    this._options = extend({ current: val(this) }, targetState.options());
    this.$id = transitionCount++;
    let toPath = PathFactory.buildToPath(fromPath, targetState);
    this._treeChanges = PathFactory.treeChanges(fromPath, toPath, this._options.reloadState);
  }

  $from() {
    return  tail(this._treeChanges.from).state;
  }

  $to() {
    return tail(this._treeChanges.to).state;
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
      return this.is({ to: compare.$to().name, from: compare.$from().name });
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
  params(pathname: string = "to"): { [key: string]: any } {
    return tail(this._treeChanges[pathname]).values;
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
    return map(this._treeChanges.entering, prop('state')).map(stateSelf);
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
    return map(this._treeChanges.exiting, prop('state')).map(stateSelf).reverse();
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
    return map(this._treeChanges.retained, prop('state')).map(stateSelf);
  }

  /**
   * Returns a list of ViewConfig objects for a given path. Returns one ViewConfig for each view in
   * each state in a named path of the transition's tree changes. Optionally limited to a given state in that path.
   */
  views(pathname: string = "entering", state?: State): ViewConfig[] {
    let path = this._treeChanges[pathname];
    return state ? find(path, propEq('state', state)).views : unnest(path.map(prop("views")));
  }

  treeChanges = () => this._treeChanges;

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#redirect
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Creates a new transition that is a redirection of the current one. This transition can
   * be returned from a `$transitionsProvider` hook, `$state` event, or other method, to
   * redirect a transition to a new state and/or set of parameters.
   *
   * @returns {Transition} Returns a new `Transition` instance.
   */
  redirect(targetState: TargetState): Transition {
    let newOptions = extend({}, this.options(), targetState.options(), { previous: this });
    targetState = new TargetState(targetState.identifier(), targetState.$state(), targetState.params(), newOptions);

    let redirectTo = new Transition(this._treeChanges.from, targetState);

    // If the current transition has already resolved any resolvables which are also in the redirected "to path", then
    // add those resolvables to the redirected transition.  Allows you to define a resolve at a parent level, wait for
    // the resolve, then redirect to a child state based on the result, and not have to re-fetch the resolve.
    let redirectedPath = this.treeChanges().to;
    let matching = Node.matching(redirectTo.treeChanges().to, redirectedPath);
    matching.forEach((node, idx) => node.resolves = redirectedPath[idx].resolves);

    return redirectTo;
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
    let [toState, fromState]  = [to, from].map(path => tail(path).state);
    let [toParams, fromParams]  = [to, from].map(path => tail(path).values);

    return (
      !this._options.reload &&
      toState === fromState &&
      Param.equals(toState.parameters().filter(not(prop('dynamic'))), toParams, fromParams)
    );
  }

  hookBuilder(): HookBuilder {
    return new HookBuilder($transitions, this, <ITransitionHookOptions> {
      transition: this,
      current: this._options.current
    });
  }

  run () {
    if (!this.valid()) {
      let error = new Error(this.error());
      this._deferred.reject(error);
      throw error;
    }

    trace.traceTransitionStart(this);

    if (this.ignored()) {
      trace.traceTransitionIgnored(this);
      let ignored = REJECT.ignored();
      this._deferred.reject(ignored.reason);
      return this.promise;
    }

    // When the chain is complete, then resolve or reject the deferred
    const resolve = () => {
      this._deferred.resolve(this);
      trace.traceSuccess(this.$to(), this);
    };

    const reject = (error) => {
      this._deferred.reject(error);
      trace.traceError(error, this);
      return runtime.$q.reject(error);
    };

    new TransitionRunner(this, resolve, reject).run();

    return this.promise;
  }

  isActive = () => this === this._options.current();

  valid() {
    return !this.error();
  }

  error() {
    let state = this.$to();

    if (state.self[abstractKey])
      return `Cannot transition to abstract state '${state.name}'`;
    if (!Param.validates(state.parameters(), this.params()))
      return `Param values not valid for state '${state.name}'`;
  }

  toString () {
    let fromStateOrName = this.from();
    let toStateOrName = this.to();

    const avoidEmptyHash = (params) =>
      (params["#"] !== null && params["#"] !== undefined) ? params : omit(params, "#");

    // (X) means the to state is invalid.
    let id = this.$id,
        from = isObject(fromStateOrName) ? fromStateOrName.name : fromStateOrName,
        fromParams = toJson(avoidEmptyHash(tail(this._treeChanges.from).values)),
        toValid = this.valid() ? "" : "(X) ",
        to = isObject(toStateOrName) ? toStateOrName.name : toStateOrName,
        toParams = toJson(avoidEmptyHash(this.params()));

    return `Transition#${id}( '${from}'${fromParams} -> ${toValid}'${to}'${toParams} )`;
  }
}