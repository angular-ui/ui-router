/// <reference path='../../typings/angularjs/angular.d.ts' />
import {runtime} from "../common/angular1";
import {IPromise} from "angular";
import trace from "../common/trace";

import {ITransitionOptions, ITreeChanges} from "./interface";
import {$transition, matchState} from "./transitionService";
import TransitionHook from "./transitionHook";
import HookBuilder from "./hookBuilder";
import {RejectFactory} from "./rejectFactory"

import {IParamsNode, ITransNode, IPath, IParamsPath, ITransPath} from "../path/interface";
import Path from "../path/path";

import {IPromises, IResolvables} from "../resolve/interface";
import Resolvable from "../resolve/resolvable";
import ResolveContext from "../resolve/resolveContext";
import PathContext from "../resolve/pathContext";


import {IStateViewConfig, IStateParams} from "../state/interface";
import {StateParams} from "../state/state"
import StateReference from "../state/stateReference"
import {IState, IStateDeclaration} from "../state/interface";

import {IRawParams} from "../params/interface"
import {ParamValues} from "../params/paramValues"

import {defaults, eq, extend, filter, flatten, forEach, identity, invoke, is, isEq, isFunction, isObject, isPromise, isDefined,
    map, mapObj, noop, not, objectKeys, parse, pattern, pipe, pluck, prop, toJson, unnest, unroll, val, pairs} from "../common/common";


var transitionCount = 0, REJECT = new RejectFactory();

const stateSelf = (state: IState) => state.self;

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
export class Transition {
  $id: number;

  _deferreds: any;
  private _treeChanges: ITreeChanges;

  promise: IPromise<any>;
  prepromise: IPromise<any>;
  redirects: IPromise<any>;

  constructor(fromPath: ITransPath, toPath: IParamsPath, private _options: ITransitionOptions = {}) {
    this._treeChanges = this._calcTreeChanges(fromPath, toPath, _options.reloadState);
    this.$id = transitionCount++;
    this._options.current = val(this);

    this._deferreds = {
      prehooks: runtime.$q.defer(), // Resolved when the transition is complete, but success callback not run yet
      posthooks: runtime.$q.defer(), // Resolved when the transition is complete, after success callbacks
      redirects: runtime.$q.defer() // Resolved when any transition redirects are complete
    };
    
    var fromNode = this._treeChanges.from.last();
    var toNode = this._treeChanges.to.last();

    // var fromParams: IStateParams = _fromPath.last().params;
    // var toParams = (_options.inherit && toState) ? fromParams.$inherit(_toPath.last().params, fromState, toState) : _toPath.last().params;
    // toParams = toState ? extend(new StateParams(), toState.params.$$values(toParams)) : toParams;
    // this._to = (toParams && to.params(toParams)) || to;

    // Expose three promises to users of Transition
    this.promise = this._deferreds.posthooks.promise;
    this.prepromise = this._deferreds.prehooks.promise;
    this.redirects = this._deferreds.redirects.promise;
  }

  _calcTreeChanges(fromPath: ITransPath, toPath: IParamsPath, reloadState: IState): ITreeChanges {
    function nonDynamicParams(state) {
      return state.params.$$filter(not(prop('dynamic')));
    }
    
    let fromNodes = fromPath.nodes();
    let toNodes = toPath.nodes();
    let keep = 0, max = Math.min(fromNodes.length, toNodes.length);  
    
    const nodesMatch = (node1: IParamsNode, node2: IParamsNode) =>
      node1.state == node2.state && nonDynamicParams(node1.state).$$equals(node1.ownParams, node2.ownParams)
    
    // if (this._to.valid()) {
    
    while (keep < max && fromNodes[keep].state !== reloadState && nodesMatch(fromNodes[keep], toNodes[keep])) {
      keep++;
    }

    const makeResolvable = (node) =>
        (fn, name: string) => new Resolvable(name, fn, node.state);

    const adaptParamsToTrans = (node: IParamsNode) => {
      let ownResolvables = mapObj(node.state.resolve, makeResolvable(node));
      return <ITransNode> {
        state: node.state,
        ownParams: node.ownParams,
        ownResolvables: ownResolvables
      };
    };


    let from: ITransPath      = fromPath;
    let retained: ITransPath  = from.slice(0, keep);
    let exiting: ITransPath   = from.slice(keep);
    let entering: ITransPath  = toPath.slice(keep).adapt(adaptParamsToTrans);
    let to: ITransPath        = retained.concat(entering);

    return { from, to, retained, exiting, entering };
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
   * @returns {StateReference} The origin state reference of the transition ("from state").
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
   * @returns {StateReference} The state reference the transition is targetting ("to state")
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
  params(): ParamValues {
    return ParamValues.fromPath(this._treeChanges.to);
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
    var exitingStates = this._treeChanges.exiting.states().map(stateSelf);
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
  context(state: IState): PathContext {
    let path = this._treeChanges.to.pathFromRootTo(state);
    return new PathContext(new ResolveContext(path), state, runtime.$injector, this._options);
  }

  /**
   * Returns a list of StateViewConfig objects;
   * Returns one StateViewConfig for each view in each state in a named path of the transition's tree changes
   */
  views(pathname: string = "entering") {
    var path: ITransPath = this._treeChanges[pathname];
    var states: IState[] = states || path.states();
    var params: ParamValues = this.params();

    return unnest(map(states, (state) => {
      var context = state, locals: PathContext = this.context(state);
      const makeViewConfig = ([name, view]) => { return {name, view, context, locals, params} };
      return pairs(state.views).map(makeViewConfig)
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
  redirect(newTo, newOptions): Transition {
    return new Transition(this._treeChanges.from, newTo, extend(newOptions || this.options(), {
      previous: this
    }));
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
    let [toState, fromState]  = [to, from].map((path) => path.last().state)
    let [toParams, fromParams]  = [to, from].map((path) => ParamValues.fromPath(path))
    return !this._options.reload &&
        toState === fromState &&
        toState.params.$$filter(not(prop('dynamic'))).$$equals(toParams, fromParams);
  }

  run () {
    if (this._options.trace) trace.traceTransitionStart(this);
    var baseHookOptions = {
      trace: this._options.trace,
      transition: this,
      current: this._options.current
    };

    var hookBuilder = new HookBuilder($transition, this._treeChanges, this, baseHookOptions);

    if (this.ignored()) {
      if (this._options.trace) trace.traceTransitionIgnored(this);
      $transition.transition = null;
      var ignored = REJECT.ignored();
      forEach(this._deferreds, (def) => def.reject(ignored.reason));
      return ignored;
    }

    $transition.transition = this;

    let {to, from, entering, exiting} = this._treeChanges;
    let [toState, fromState]  = [to, from].map((path) => path.last().state)
    let [toParams, fromParams]  = [to, from].map((path) => ParamValues.fromPath(path))

    var options = this._options;
    var tLocals = { $transition$: this };
    
    var emptyResolveContext = new ResolveContext(new Path<ITransNode>([]))

    // Build a bunch of arrays of promises for each step of the transition
    // TODO: Provide makeSteps with the StateReference, not the $state().
    var onBeforeHooks =     hookBuilder.makeSteps("onBefore",   toState, fromState, tLocals, emptyResolveContext, {async: false});
    var onInvalidHooks =    hookBuilder.makeSteps("onInvalid",  toState, fromState, tLocals, emptyResolveContext);
    var onStartHooks =      hookBuilder.makeSteps("onStart",    toState, fromState, tLocals, emptyResolveContext);
    var transitionOnHooks = hookBuilder.makeSteps("on",         toState, fromState, tLocals, emptyResolveContext);

    var exitingStateHooks = map(exiting.reverse().nodes(), function (node) {
      var stepLocals = {$state$: node.state, $stateParams: node.state.params.$$values(fromParams)};
      var locals = extend({}, tLocals, stepLocals);
      var steps = hookBuilder.makeSteps("exiting", toState, node.state, node, locals, from);
      let resolveContext = new ResolveContext(from.pathFromRootTo(node.state))

      return !node.state.self.onExit ? steps : steps.concat([
        new TransitionHook(node, node.state.self.onExit, locals, resolveContext, baseHookOptions)
      ]);
    });

    var enteringStateHooks = map(entering.nodes(), function (node) {
      var stepLocals = {$state$: node.state, $stateParams: node.state.params.$$values(fromParams)};
      var locals = extend({}, tLocals, stepLocals);
      var lazyResolveStep = hookBuilder.makeLazyResolvePathElementStep(to, node, locals);
      var steps = [lazyResolveStep].concat(hookBuilder.makeSteps("entering", node.state, fromState, node, locals, to));
      let resolveContext = new ResolveContext(from.pathFromRootTo(node.state))
      
      return !node.state.self.onEnter ? steps : steps.concat([
        new TransitionHook(node, node.state.self.onEnter, locals, resolveContext, baseHookOptions)
      ]);
    });

    var eagerResolves = hookBuilder.makeEagerResolvePathStep(to, tLocals);

    // Set up a promise chain. Add the steps' promises in appropriate order to the promise chain.
    // var invalidOrStartHooks = this.$to().valid() ? onStartHooks : onInvalidHooks;
    var invalidOrStartHooks = true ? onStartHooks : onInvalidHooks;
    var asyncSteps = filter(flatten([invalidOrStartHooks, transitionOnHooks, eagerResolves, exitingStateHooks, enteringStateHooks]), identity);

    // -----------------------------------------------------------------------
    // Transition Steps
    // -----------------------------------------------------------------------

    // ---- Synchronous hooks ----
    // Run the "onBefore" hooks and save their promises
    var chain = hookBuilder.runSynchronousHooks(onBeforeHooks);

    // ---- Asynchronous section ----

    // The results of the sync hooks is a promise chain (rejected or otherwise) that begins the async portion of the transition.
    // Build the rest of the chain off the sync promise chain out of all the asynchronous steps
    forEach(asyncSteps, function (step) {
      chain = chain.then(step.invokeStep);
    });

    // When the last step of the chain has resolved or any step has rejected (i.e., the transition is completed),
    // invoke the registered success or error hooks when the transition is completed.
    chain = chain.then(hookBuilder.successHooks()).catch(hookBuilder.errorHooks());

    // Return the overall transition promise, which is resolved/rejected in successHooks/errorHooks
    return this.promise;
  }

  isActive() {
    return isEq(this._options.current, val(this))();
  }

  abort() {
    if (this.isActive()) {
      $transition.transition = null; // TODO
    }
  }

  toString () {
    var fromStateOrName = this.from();
    var toStateOrName = this.to();

    // (X) means the to state is invalid.
    var id = this.$id,
        from = isObject(fromStateOrName) ? fromStateOrName.name : fromStateOrName,
        fromParams = toJson(ParamValues.fromPath(this._treeChanges.from)),
        // toValid = this.$to().valid() ? "" : "(X) ",
        toValid = true ? "" : "(X) ",
        to = isObject(toStateOrName) ? toStateOrName.name : toStateOrName,
        toParams = toJson(this.params());
    return `Transition#${id}( '${from}'${fromParams} -> ${toValid}'${to}'${toParams} )`;
  }
}