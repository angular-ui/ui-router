
import {IPromise} from "angular";
import {IInjectable, extend, isPromise} from "../common/common";
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

/**
 * This class returns applicable TransitionHooks for a specific Transition instance.
 *
 * Hooks (IEventHook) may be registered globally, e.g., $transitions.onEnter(...), or locally, e.g.
 * myTransition.onEnter(...).  The HookBuilder finds matching IEventHooks (where the match criteria is
 * determined by the type of hook)
 *
 * The HookBuilder also converts IEventHooks objects to TransitionHook objects, which are used to run a Transition.
 *
 * The HookBuilder constructor is given the $transitions service and a Transition instance.  Thus, a HookBuilder
 * instance may only be used for one specific Transition object. (side note: the _treeChanges accessor is private
 * in the Transition class, so we must also provide the Transition's _treeChanges)
 *
 */
export default class HookBuilder {

  transitionOptions: ITransitionOptions;

  toState: IState;
  fromState: IState;

  transitionLocals: {[key: string]: any};

  constructor(private $transitions: ITransitionService, private treeChanges: ITreeChanges, private transition: Transition, private baseHookOptions: ITransitionHookOptions) {
    this.toState            = treeChanges.to.last().state;
    this.fromState          = treeChanges.from.last().state;
    this.transitionOptions  = transition.options();
    this.transitionLocals   = { $transition$: transition };
  }

  // TODO: These get* methods are returning different cardinalities of hooks
  // onBefore/onStart returns an array of hooks
  // onExit/onRetain/onEnter returns an array of arrays of hooks
  // getSuccessHooks and getErrorHooks returns a single callback, like a .then(fn) function

  getOnBeforeHooks  = () => this._getTransitionHooks("onBefore", this._toFrom(), this.treeChanges.from);
  getOnStartHooks   = () => this._getTransitionHooks("onStart",  this._toFrom(), this.treeChanges.to);
  getOnExitHooks    = () => this._getNodeHooks("onExit",   this.treeChanges.exiting.reverse(), (node) => this._toFrom({ from: node.state }));
  getonRetainHooks  = () => this._getNodeHooks("onRetain", this.treeChanges.retained, (node) => this._toFrom());
  getOnEnterHooks   = () => this._getNodeHooks("onEnter",  this.treeChanges.entering, (node) => this._toFrom({ to: node.state }));

  // TODO: refactor _deferred out of these callbacks (using high priority Transition instance hooks in $state)
  getSuccessHooks(_deferreds) {
    return () => {
      trace.traceSuccess(this.toState, this.transition);
      _deferreds.prehooks.resolve(this.treeChanges);

      let onSuccessHooks = this._getTransitionHooks("onSuccess", this._toFrom(), this.treeChanges.to, {}, successErrorOptions);
      this.runSynchronousHooks(onSuccessHooks, true);

      _deferreds.posthooks.resolve(this.treeChanges);
    };
  }

  getErrorHooks(_deferreds) {
    return (error) => {
      trace.traceError(error, this.transition);
      _deferreds.prehooks.reject(error);

      let onErrorHooks = this._getTransitionHooks("onError", this._toFrom(), this.treeChanges.to, {$error$: error}, successErrorOptions);
      this.runSynchronousHooks(onErrorHooks, true);

      _deferreds.posthooks.reject(error);
    };
  }

  private _toFrom(toFromOverride?): IToFrom {
    return extend({ to: this.toState, from: this.fromState }, toFromOverride);
  }

  /**
   * Returns an array of newly built TransitionHook objects.
   *
   * Builds a TransitionHook which cares about the entire Transition, for instance, onActivate
   * Finds all registered IEventHooks which matched the hookType and toFrom criteria.
   * A TransitionHook is then built from each IEventHook with the context, locals, and options provided.
   */
  private _getTransitionHooks(hookType: string, toFrom: IToFrom, context: (ITransPath|IState), locals = {}, options?: ITransitionHookOptions) {
    let data = {toFrom, context, hookType };
    const transitionHook = eventHook =>
        this.buildHook(this.treeChanges.to.last(), eventHook.callback, locals, extend({ data }, options));
    return this._matchingHooks(hookType, toFrom).map(transitionHook);
  }

  /**
   * Returns an 2 dimensional array of newly built TransitionHook objects.
   * Each inner array contains the hooks for a node in the Path.
   *
   * For each Node in the Path:
   * Builds the toFrom criteria
   * Finds all registered IEventHooks which matched the hookType and toFrom criteria.
   * A TransitionHook is then built from each IEventHook with the context, locals, and options provided.
   */
  private _getNodeHooks(hookType: string, path: ITransPath, toFromFn: (node: ITransNode) => IToFrom) {
    const hooksForNode = (node: ITransNode) => {
      let toFrom = toFromFn(node),  locals = { $state$: node.state }, data = { toFrom, hookType, context: node };
      const transitionHook = eventHook =>
          this.buildHook(node, eventHook.callback, locals, { data, context: node });
      return this._matchingHooks(hookType, toFrom).map(transitionHook);
    };
    return path.nodes().map(hooksForNode);
  }

  /**
   * Given an array of TransitionHooks, runs each one synchronously and sequentially.
   *
   * Returns a promise chain composed of any promises returned from each hook.invokeStep() call
   */
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

  /** Builds a TransitionHook which cares about a specific state, for instance, onEnter */
  buildNodeHook(node: ITransNode, fn: IInjectable, locals?, options: ITransitionHookOptions = {}): TransitionHook {
    return this.buildHook(node, fn, extend({ $state$: node.state }, locals), extend({ context: node }, options));
  }

  /** Given a node and a callback function, builds a TransitionHook */
  buildHook(node: ITransNode, fn: IInjectable, moreLocals?, options: ITransitionHookOptions = {}): TransitionHook {
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
    if (!instanceHooks || !globalHooks) throw new Error(`broken event named: ${eventName}`);
    return instanceHooks.concat(globalHooks).filter(matchFilter).sort(prioritySort);
  }

  /** Returns a function which resolves the LAZY Resolvables for a Node in a Path */
  getLazyResolveStateFn() {
    let options = { resolvePolicy: ResolvePolicy[ResolvePolicy.LAZY] };
    let treeChanges = this.treeChanges;
    $lazyResolveEnteringState.$inject = ['$state$', '$transition$'];
    function $lazyResolveEnteringState($state$, $transition$) {
      let node = treeChanges.entering.nodeForState($state$);
      return node.resolveContext.resolvePathElement(node.state, extend({transition: $transition$}, options));
    }
    return $lazyResolveEnteringState;
  }

  /** Returns a function which resolves the EAGER Resolvables for a Path */
  getEagerResolvePathFn() {
    let options: IOptions1 = { resolvePolicy: ResolvePolicy[ResolvePolicy.EAGER] };
    let path = this.treeChanges.to;
    $eagerResolvePath.$inject = ['$transition$'];
    function $eagerResolvePath($transition$) {
      return path.last().resolveContext.resolvePath(extend({transition: $transition$}, options));
    }
    return $eagerResolvePath;
  }
}
