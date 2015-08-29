
import {IPromise} from "angular";
import {extend, isPromise} from "../common/common";
import {runtime} from "../common/angular1";
import trace from "../common/trace";

import {ITransitionOptions, ITransitionHookOptions, ITreeChanges, IEventHook, ITransitionService} from "./interface";
import TransitionHook from "./transitionHook";
import {Transition} from "./transition";

import {IState} from "../state/interface";

import {ITransPath, ITransNode} from "../path/interface";

import {ResolvePolicy, IOptions1} from "../resolve/interface";

interface IToFrom {
  to: IState;
  from: IState;
}

export default class HookBuilder {
  successErrorOptions: ITransitionHookOptions = {
    async: false,
    rejectIfSuperseded: false
  };

  transitionOptions: ITransitionOptions;
  baseResolveOptions: IOptions1;

  toState: IState;
  fromState: IState;

  transitionLocals: {[key: string]: any};


  constructor(private $transition: ITransitionService, private treeChanges: ITreeChanges, private transition: Transition, private baseHookOptions: ITransitionHookOptions) {
    this.toState = treeChanges.to.last().state;
    this.fromState = treeChanges.from.last().state;
    this.transitionOptions = transition.options();
    this.baseResolveOptions = { trace: baseHookOptions.trace };
    this.transitionLocals = { $transition$: transition };
  }

  getOnBeforeHooks() {
    const buildHook = hook => this.buildPathHook(this.treeChanges.from, hook.callback, {}, {async: false});
    let toFrom = { to: this.toState, from: this.fromState };
    return this._findMatchingRegisteredHooks("onBefore", toFrom).map(buildHook);
  }


  getOnStartHooks() {
    const buildHook = hook => this.buildPathHook(this.treeChanges.to, hook.callback);
    let toFrom = { to: this.toState, from: this.fromState };
    return this._findMatchingRegisteredHooks("onStart", toFrom).map(buildHook);
  }

  getEagerResolvePathHook() {
    return this.buildPathHook(this.treeChanges.to, this.makeEagerResolvePathFn(this.treeChanges.to));
  }

  getOnEnterHooks() {
    return this.treeChanges.entering.nodes().map(node => this._getEnterHooksForNode(node));
  }

  getOnExitingHooks() {
    return this.treeChanges.exiting.reverse().nodes().map(node => this._getExitHooksForNode(node));
  }

  getSuccessHooks(_deferreds) {
    let toFrom = { to: this.toState, from: this.fromState };

    return () => {
      if (this.transitionOptions.trace) trace.traceSuccess(this.toState, this.transition);
      _deferreds.prehooks.resolve(this.treeChanges);

      const buildHook = hook => this.buildPathHook(this.treeChanges.to, hook.callback, {}, this.successErrorOptions);
      let onSuccessHooks = this._findMatchingRegisteredHooks("onSuccess", toFrom).map(buildHook);
      this.runSynchronousHooks(onSuccessHooks, true);

      _deferreds.posthooks.resolve(this.treeChanges);
    };
  }

  getErrorHooks(_deferreds) {
    let toFrom = { to: this.toState, from: this.fromState };

    return (error) => {
      if (this.transitionOptions.trace) trace.traceError(error, this.transition);
      _deferreds.prehooks.reject(error);

      const buildHook = hook => this.buildPathHook(this.treeChanges.to, hook.callback, {$error$: error}, this.successErrorOptions);
      let onErrorHooks = this._findMatchingRegisteredHooks("onError", toFrom).map(buildHook);
      this.runSynchronousHooks(onErrorHooks, true);

      _deferreds.posthooks.reject(error);
    };
  }

  runSynchronousHooks(hooks: TransitionHook[], swallowExceptions: boolean = false): IPromise<any> {
    let promises = [];
    for (let i = 0; i < hooks.length; i++) {
      try {
        let hookResult = hooks[i].invokeStep();
        // If a hook returns a promise, that promise is added to an array to be resolved asynchronously.
        if (hookResult && isPromise(hookResult))
          promises.push(hookResult);
      } catch (ex) {
        if (!swallowExceptions) throw ex;
        console.log("Swallowed exception during synchronous hook handler: " + ex); // TODO: What to do here?
      }
    }

    let resolvedPromise = runtime.$q.when(true);
    return promises.reduce((memo, val) => memo.then(() => val), resolvedPromise);
  }

  /** Builds a TransitionHook which cares around a specific state, for instance, onEnter */
  buildNodeHook(node: ITransNode, fn: Function, moreLocals?, options: ITransitionHookOptions = {}): TransitionHook {
    let nodeLocals = { $state$: node.state, $stateParams: node.paramValues };
    let locals = extend({}, this.transitionLocals, nodeLocals, moreLocals);
    let _options = extend({}, this.baseHookOptions, options);
    return new TransitionHook(node.state, fn, locals, node.resolveContext, _options);
  }

  /** Builds a TransitionHook which cares about the entire Transition, for instance, onActivate */
  buildPathHook(path: ITransPath, fn: Function, moreLocals?, options: ITransitionHookOptions = {}): TransitionHook {
    let lastNode: ITransNode = path.last();
    let locals = extend({}, this.transitionLocals, moreLocals);
    let _options = extend({}, this.baseHookOptions, options);
    return new TransitionHook(lastNode.state, fn, locals, lastNode.resolveContext, _options);
  }


  /**
   * returns an array of the registered transition hooks which matched:
   * 1) the eventType
   * 2) the to state
   * 3) the from state
   */
  private _findMatchingRegisteredHooks(eventName: string, matchCriteria: IToFrom): IEventHook[] {
    let hooks = this.$transition.getHooks(eventName);
    return hooks.filter(hook => hook.matches(matchCriteria.to, matchCriteria.from));
  }


  private _getEnterHooksForNode(node: ITransNode) {
    let state: IState = node.state;
    let toFrom: IToFrom = {to: state, from: this.fromState};

    let lazyResolveHook = this.buildNodeHook(node, this._makeLazyResolveEnteringState(node));
    let registeredHooks = this._findMatchingRegisteredHooks("onEnter", toFrom)
        .map(hook => this.buildNodeHook(node, hook.callback));
    let onEnterHook = state.self.onEnter && this.buildNodeHook(node, state.self.onEnter);

    return [lazyResolveHook].concat(registeredHooks).concat([onEnterHook]).filter(angular.identity);
  }

  private _getExitHooksForNode(node: ITransNode) {
    let state: IState = node.state;
    let toFrom: IToFrom = {to: this.toState, from: state};

    let registeredHooks = this._findMatchingRegisteredHooks("onExit", toFrom)
        .map(hook => this.buildNodeHook(node, hook.callback));
    let onExitHook = state.self.onExit && this.buildNodeHook(node, state.self.onExit);

    return registeredHooks.concat([onExitHook]).filter(angular.identity);
  }


  /** Returns a function which resolves the LAZY Resolvables for a Node in a Path */
  private _makeLazyResolveEnteringState(node: ITransNode): () => IPromise<any> {
    let options = extend({resolvePolicy: ResolvePolicy[ResolvePolicy.LAZY]}, this.baseResolveOptions);
    return function $lazyResolveEnteringState() {
      return node.resolveContext.resolvePathElement(node.state, options);
    };
  }

  /** Returns a function which resolves the EAGER Resolvables for a Path */
  private makeEagerResolvePathFn(path: ITransPath): () => IPromise<any> {
    let options: IOptions1 = extend({resolvePolicy: ResolvePolicy[ResolvePolicy.EAGER]}, this.baseResolveOptions);
    return function $eagerResolvePath() {
      return path.last().resolveContext.resolvePath(options);
    };
  }
}
