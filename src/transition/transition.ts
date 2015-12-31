/** @module transition */ /** for typedoc */
/// <reference path='../../typings/angularjs/angular.d.ts' />
import {IPromise} from "angular";
import {trace} from "../common/trace";
import {services} from "../common/coreservices";
import {
    map, find, extend, filter, mergeR, flatten, unnest, tail, forEach, identity,
    omit, isObject, isPromise, not, prop, propEq, toJson, val, abstractKey,
    arrayTuples, allTrueR, Predicate
} from "../common/common";

import {StateDeclaration, StateOrName} from "../state/interface";
import {TransitionOptions, TransitionHookOptions, TreeChanges, IHookRegistry, IHookRegistration, IHookGetter} from "./interface";

import {$transitions, TransitionHook, HookRegistry, matchState, HookBuilder, RejectFactory, TransitionRejection} from "./module";
import {Node, PathFactory} from "../path/module";
import {State, TargetState} from "../state/module";
import {Param} from "../params/module";
import {Resolvable} from "../resolve/module";
import {ViewConfig} from "../view/module";


let transitionCount = 0, REJECT = new RejectFactory();
const stateSelf: (_state: State) => StateDeclaration = prop("self");

/**
 * The representation of a transition between two states.
 *
 * Contains all contextual information about the to/from states, parameters, resolves, as well as the
 * list of states being entered and exited as a result of this transition.
 */
export class Transition implements IHookRegistry {
  $id: number;

  private _deferred = services.$q.defer();
  promise: IPromise<any> = this._deferred.promise;

  private _options: TransitionOptions;
  private _treeChanges: TreeChanges;

  /**
   * Registers a callback function as an `onBefore` Transition Hook
   *
   * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onBefore]]
   *
   * See [[IHookRegistry.onBefore]]
   */
  onBefore:   IHookRegistration;
  /**
   * Registers a callback function as an `onStart` Transition Hook
   *
   * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onStart]]
   *
   * See [[IHookRegistry.onStart]]
   */
  onStart:    IHookRegistration;
  /**
   * Registers a callback function as an `onEnter` State Hook
   *
   * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onEnter]]
   *
   * See [[IHookRegistry.onEnter]]
   */
  onEnter:    IHookRegistration;
  /**
   * Registers a callback function as an `onRetain` State Hook
   *
   * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onRetain]]
   *
   * See [[IHookRegistry.onRetain]]
   */
  onRetain:   IHookRegistration;
  /**
   * Registers a callback function as an `onExit` State Hook
   *
   * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onExit]]
   *
   * See [[IHookRegistry.onExit]]
   */
  onExit:     IHookRegistration;
  /**
   * Registers a callback function as an `onFinish` Transition Hook
   *
   * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onFinish]]
   *
   * See [[IHookRegistry.onFinish]]
   */
  onFinish:   IHookRegistration;
  /**
   * Registers a callback function as an `onSuccess` Transition Hook
   *
   * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onSuccess]]
   *
   * See [[IHookRegistry.onSuccess]]
   */
  onSuccess:  IHookRegistration;
  /**
   * Registers a callback function as an `onError` Transition Hook
   *
   * The hook is only registered for this specific `Transition`.  For global hooks, use [[TransitionService.onError]]
   *
   * See [[IHookRegistry.onError]]
   */
  onError:    IHookRegistration;
  getHooks:   IHookGetter;

  /**
   * Creates a new Transition object.
   *
   * If the target state is not valid, an error is thrown.
   *
   * @param fromPath The path of [[Node]]s from which the transition is leaving.  The last node in the `fromPath`
   *        encapsulates the "from state".
   * @param targetState The target state and parameters being transitioned to (also, the transition options)
   */
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
    PathFactory.bindTransitionResolve(this._treeChanges, this);
  }

  $from() {
    return  tail(this._treeChanges.from).state;
  }

  $to() {
    return tail(this._treeChanges.to).state;
  }

  /**
   * Returns the "from state"
   *
   * @returns The state object for the Transition's "from state".
   */
  from(): StateDeclaration {
    return this.$from().self;
  }

  /**
   * Returns the "to state"
   *
   * @returns The state object for the Transition's target state ("to state").
   */
  to() {
    return this.$to().self;
  }

  /**
   * Determines whether two transitions are equivalent.
   */
  is(compare: (Transition|{to: any, from: any})): boolean {
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
   * Gets transition parameter values
   *
   * @param pathname Pick which treeChanges path to get parameters for:
   *   (`'to'`, `'from'`, `'entering'`, `'exiting'`, `'retained'`)
   * @returns transition parameter values for the desired path.
   */
  params(pathname: string = "to"): { [key: string]: any } {
    return this._treeChanges[pathname].map(prop("values")).reduce(mergeR, {});
  }

  /**
   * Get resolved data
   *
   * @returns an object (key/value pairs) where keys are resolve names and values are any settled resolve data,
   *    or `undefined` for pending resolve data
   */
  resolves(): { [resolveName: string]: any } {
    return map(tail(this._treeChanges.to).resolveContext.getResolvables(), res => res.data);
  }

  /**
   * Adds new resolves to this transition.
   *
   * @param resolves an [[ResolveDeclarations]] object which describes the new resolves
   * @param state the state in the "to path" which should receive the new resolves (otherwise, the root state)
   */
  addResolves(resolves: { [key: string]: Function }, state: StateOrName = ""): void {
    let stateName: string = (typeof state === "string") ? state : state.name;
    let topath = this._treeChanges.to;
    let targetNode = find(topath, node => node.state.name === stateName);
    tail(topath).resolveContext.addResolvables(Resolvable.makeResolvables(resolves), targetNode.state);
  }

  /**
   * Gets the previous transition, from which this transition was redirected.
   *
   * @returns The previous Transition, or null if this Transition is not the result of a redirection
   */
  previous(): Transition {
    return this._options.previous || null;
  }

  /**
   * Get the transition options
   *
   * @returns the options for this Transition.
   */
  options(): TransitionOptions {
    return this._options;
  }

  /**
   * Gets the states being entered.
   *
   * @returns an array of states that will be entered during this transition.
   */
  entering(): StateDeclaration[] {
    return map(this._treeChanges.entering, prop('state')).map(stateSelf);
  }

  /**
   * Gets the states being exited.
   *
   * @returns an array of states that will be exited during this transition.
   */
  exiting(): StateDeclaration[] {
    return map(this._treeChanges.exiting, prop('state')).map(stateSelf).reverse();
  }

  /**
   * Gets the states being retained.
   *
   * @returns an array of states that are already entered from a previous Transition, that will not be
   *    exited during this Transition
   */
  retained(): StateDeclaration[] {
    return map(this._treeChanges.retained, prop('state')).map(stateSelf);
  }

  /**
   * Get the [[ViewConfig]]s associated with this Transition
   *
   * Each state can define one or more views (template/controller), which are encapsulated as `ViewConfig` objects.
   * This method fetches the `ViewConfigs` for a given path in the Transition (e.g., "to" or "entering").
   *
   * @param pathname the name of the path to fetch views for:
   *   (`'to'`, `'from'`, `'entering'`, `'exiting'`, `'retained'`)
   * @param state If provided, only returns the `ViewConfig`s for a single state in the path
   *
   * @returns a list of ViewConfig objects for the given path.
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
    let matching: Node[] = Node.matching(redirectTo.treeChanges().to, redirectedPath);
    const includeResolve = (resolve, key) => ['$stateParams', '$transition$'].indexOf(key) === -1;
    matching.forEach((node, idx) => extend(node.resolves, filter(redirectedPath[idx].resolves, includeResolve)));

    return redirectTo;
  }

  /**
   * Checks if the transition will be ignored.
   *
   * Indicates whether the transition should be ignored, based on whether the to and from states are the
   * same, whether the parameters are equal (or dynamic), and whether the `reload` option is set.
   *
   * @returns true if the Transition should be ignored.
   */
  ignored(): boolean {
    let {to, from} = this._treeChanges;
    if (this._options.reload || tail(to).state !== tail(from).state) return false;

    let nodeSchemas: Param[][] = to.map(node => node.schema.filter(not(prop('dynamic'))));
    let [toValues, fromValues] = [to, from].map(path => path.map(prop('values')));
    let tuples = arrayTuples(nodeSchemas, toValues, fromValues);

    return tuples.map(([schema, toVals, fromVals]) => Param.equals(schema, toVals, fromVals)).reduce(allTrueR, true);
  }

  /**
   * @hidden
   */
  hookBuilder(): HookBuilder {
    return new HookBuilder($transitions, this, <TransitionHookOptions> {
      transition: this,
      current: this._options.current
    });
  }

  /**
   * Runs the transition
   *
   * This method is generally called from the [[StateService.transitionTo]]
   *
   * @returns a promise for a successful transition.
   */
  run (): IPromise<any> {
    let hookBuilder = this.hookBuilder();
    let runSynchronousHooks = TransitionHook.runSynchronousHooks;
    // TODO: nuke these in favor of chaining off the promise, i.e.,
    // $transitions.onBefore({}, $transition$ => {$transition$.promise.then()}
    const runSuccessHooks = () => runSynchronousHooks(hookBuilder.getOnSuccessHooks(), {}, true);
    const runErrorHooks = ($error$) => runSynchronousHooks(hookBuilder.getOnErrorHooks(), { $error$ }, true);
    // Run the success/error hooks *after* the Transition promise is settled.
    this.promise.then(runSuccessHooks, runErrorHooks);

    let syncResult = runSynchronousHooks(hookBuilder.getOnBeforeHooks());

    if (TransitionHook.isRejection(syncResult)) {
      let rejectReason = (<any> syncResult).reason;
      this._deferred.reject(rejectReason);
      return this.promise;
    }

    if (!this.valid()) {
      let error = new Error(this.error());
      this._deferred.reject(error);
      return this.promise;
    }

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
      return services.$q.reject(error);
    };

    trace.traceTransitionStart(this);

    let chain = hookBuilder.asyncHooks().reduce((_chain, step) => _chain.then(step.invokeStep), syncResult);
    chain.then(resolve, reject);

    return this.promise;
  }

  isActive = () => this === this._options.current();

  /**
   * Checks if the Transition is valid
   *
   * @returns true if the Transition is valid
   */
  valid() {
    return !this.error();
  }

  /**
   * The reason the Transition is invalid
   *
   * @returns an error message explaining why the transition is invalid
   */
  error() {
    let state = this.$to();

    if (state.self[abstractKey])
      return `Cannot transition to abstract state '${state.name}'`;
    if (!Param.validates(state.parameters(), this.params()))
      return `Param values not valid for state '${state.name}'`;
  }

  /**
   * A string representation of the Transition
   *
   * @returns A string representation of the Transition
   */
  toString () {
    let fromStateOrName = this.from();
    let toStateOrName = this.to();

    const avoidEmptyHash = (params) =>
      (params["#"] !== null && params["#"] !== undefined) ? params : omit(params, "#");

    // (X) means the to state is invalid.
    let id = this.$id,
        from = isObject(fromStateOrName) ? fromStateOrName.name : fromStateOrName,
        fromParams = toJson(avoidEmptyHash(this._treeChanges.from.map(prop('values')).reduce(mergeR, {}))),
        toValid = this.valid() ? "" : "(X) ",
        to = isObject(toStateOrName) ? toStateOrName.name : toStateOrName,
        toParams = toJson(avoidEmptyHash(this.params()));

    return `Transition#${id}( '${from}'${fromParams} -> ${toValid}'${to}'${toParams} )`;
  }
}