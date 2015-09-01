
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

let successErrorOptions: ITransitionHookOptions = {
  async: false,
  rejectIfSuperseded: false
};

export default class HookBuilder {

  transitionOptions: ITransitionOptions;
  baseResolveOptions: IOptions1;

  toState: IState;
  fromState: IState;

  transitionLocals: {[key: string]: any};

  constructor(private $transitions: ITransitionService, private treeChanges: ITreeChanges, private transition: Transition, private baseHookOptions: ITransitionHookOptions) {
    this.toState = treeChanges.to.last().state;
    this.fromState = treeChanges.from.last().state;
    this.transitionOptions = transition.options();
    this.baseResolveOptions = { trace: baseHookOptions.trace };
    this.transitionLocals = { $transition$: transition };
  }

  getOnBeforeHooks() {
    const buildHook = hook => this.buildPathHook(this.treeChanges.from, hook.callback, {}, { async: false });
    let toFrom = { to: this.toState, from: this.fromState };
    return this._matchingHooks("onBefore", toFrom).map(buildHook);
  }

  getOnStartHooks() {
    const buildHook = hook => this.buildPathHook(this.treeChanges.to, hook.callback);
    let toFrom = { to: this.toState, from: this.fromState };
    return this._matchingHooks("onStart", toFrom).map(buildHook);
  }

  getOnEnterHooks() {
    const enterHooksForNode = (node: ITransNode) => {
      let toFrom: IToFrom = {to: node.state, from: this.fromState};
      return this._matchingHooks("onEnter", toFrom).map(hook => this.buildNodeHook(node, hook.callback));
    };
    return this.treeChanges.entering.nodes().map(node => enterHooksForNode(node));
  }

  getOnExitHooks() {
    const exitHooksForNode = (node: ITransNode) => {
      let toFrom: IToFrom = {to: this.toState, from: node.state};
      return this._matchingHooks("onExit", toFrom).map(hook => this.buildNodeHook(node, hook.callback));
    };
    return this.treeChanges.exiting.reverse().nodes().map(node => exitHooksForNode(node));
  }

  // TODO: refactor these success/error hooks
  getSuccessHooks(_deferreds) {
    let toFrom = { to: this.toState, from: this.fromState };

    return () => {
      if (this.transitionOptions.trace) trace.traceSuccess(this.toState, this.transition);
      _deferreds.prehooks.resolve(this.treeChanges);

      const buildHook = hook => this.buildPathHook(this.treeChanges.to, hook.callback, {}, successErrorOptions);
      let onSuccessHooks = this._matchingHooks("onSuccess", toFrom).map(buildHook);
      this.runSynchronousHooks(onSuccessHooks, true);

      _deferreds.posthooks.resolve(this.treeChanges);
    };
  }

  getErrorHooks(_deferreds) {
    let toFrom = { to: this.toState, from: this.fromState };

    return (error) => {
      if (this.transitionOptions.trace) trace.traceError(error, this.transition);
      _deferreds.prehooks.reject(error);

      const buildHook = hook => this.buildPathHook(this.treeChanges.to, hook.callback, {$error$: error}, successErrorOptions);
      let onErrorHooks = this._matchingHooks("onError", toFrom).map(buildHook);
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
  buildNodeHook(node: ITransNode, fn: Function, locals?, options: ITransitionHookOptions = {}): TransitionHook {
    return this.buildHook(node, fn, extend({ $state$: node.state }, locals), options);
  }

  /** Builds a TransitionHook which cares about the entire Transition, for instance, onActivate */
  buildPathHook(path: ITransPath, fn: Function, locals?, options: ITransitionHookOptions = {}): TransitionHook {
    return this.buildHook(path.last(), fn, locals, options);
  }

  /** Builds a Hook for a Node */
  buildHook(node: ITransNode, fn: Function, moreLocals?, options: ITransitionHookOptions = {}): TransitionHook {
    let nodeLocals = { $stateParams: node.paramValues };
    let locals = extend({}, this.transitionLocals, nodeLocals, moreLocals);
    let _options = extend({}, this.baseHookOptions, options);

    return new TransitionHook(node.state, fn, locals, node.resolveContext, _options);
  }


  /**
   * returns an array of the transition hooks from:
   * 1) The Transition object instance hook registry
   * 2) The TransitionService ($transitions) global hook registry
   * which matched:
   * 1) the eventType
   * 2) the to state
   * 3) the from state
   */
  private _matchingHooks(eventName: string, matchCriteria: IToFrom): IEventHook[] {
    const matchFilter   = hook => hook.matches(matchCriteria.to, matchCriteria.from);
    const prioritySort  = (l, r) => l.priority - r.priority;

    let instanceHooks = this.transition.getHooks(eventName);
    let globalHooks   = this.$transitions.getHooks(eventName);
    return instanceHooks.concat(globalHooks).filter(matchFilter).sort(prioritySort);
  }

  /** Returns a function which resolves the LAZY Resolvables for a Node in a Path */
  getLazyResolveStateFn(): (IState) => IPromise<any> {
    let options = extend({resolvePolicy: ResolvePolicy[ResolvePolicy.LAZY]}, this.baseResolveOptions);
    let treeChanges = this.treeChanges;

    return function $lazyResolveEnteringState($state$) {
      let node = treeChanges.entering.nodeForState($state$);
      return node.resolveContext.resolvePathElement(node.state, options);
    };
  }

  /** Returns a function which resolves the EAGER Resolvables for a Path */
  getEagerResolvePathFn(): () => IPromise<any> {
    let options: IOptions1 = extend({resolvePolicy: ResolvePolicy[ResolvePolicy.EAGER]}, this.baseResolveOptions);
    let path = this.treeChanges.to;
    return function $eagerResolvePath() {
      return path.last().resolveContext.resolvePath(options);
    };
  }
}
