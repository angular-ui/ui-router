/** @module transition */ /** for typedoc */

import {IPromise} from "angular";
import {IInjectable, extend, tail, isPromise, isArray, assertPredicate, unnestR, flatten, identity} from "../common/common";

import {TransitionOptions, TransitionHookOptions, IHookRegistry, TreeChanges, IEventHook, ITransitionService} from "./interface";

import {Transition, TransitionHook} from "./module";
import {State} from "../state/module";
import {Node} from "../path/module";

interface IToFrom {
  to:   State;
  from: State;
}

let successErrorOptions: TransitionHookOptions = {
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
export class HookBuilder {

  treeChanges: TreeChanges;
  transitionOptions: TransitionOptions;

  toState: State;
  fromState: State;


  constructor(private $transitions: ITransitionService, private transition: Transition, private baseHookOptions: TransitionHookOptions) {
    this.treeChanges        = transition.treeChanges();
    this.toState            = tail(this.treeChanges.to).state;
    this.fromState          = tail(this.treeChanges.from).state;
    this.transitionOptions  = transition.options();
  }

  // TODO: These get* methods are returning different cardinalities of hooks
  // onBefore/onStart/onFinish/onSuccess/onError returns an array of hooks
  // onExit/onRetain/onEnter returns an array of arrays of hooks

  getOnBeforeHooks  = () => this._buildTransitionHooks("onBefore", {}, { async: false });
  getOnStartHooks   = () => this._buildTransitionHooks("onStart");
  getOnExitHooks    = () => this._buildNodeHooks("onExit",          this.treeChanges.exiting.reverse(), (node) => this._toFrom({ from: node.state }));
  getOnRetainHooks  = () => this._buildNodeHooks("onRetain",        this.treeChanges.retained,          (node) => this._toFrom());
  getOnEnterHooks   = () => this._buildNodeHooks("onEnter",         this.treeChanges.entering,          (node) => this._toFrom({ to: node.state }));
  getOnFinishHooks  = () => this._buildTransitionHooks("onFinish", { $treeChanges$: this.treeChanges });
  getOnSuccessHooks = () => this._buildTransitionHooks("onSuccess", {}, {async: false, rejectIfSuperseded: false});
  getOnErrorHooks   = () => this._buildTransitionHooks("onError", {}, {async: false, rejectIfSuperseded: false});


  asyncHooks() {
    let onStartHooks    = this.getOnStartHooks();
    let onExitHooks     = this.getOnExitHooks();
    let onRetainHooks   = this.getOnRetainHooks();
    let onEnterHooks    = this.getOnEnterHooks();
    let onFinishHooks   = this.getOnFinishHooks();

    return flatten([onStartHooks, onExitHooks, onRetainHooks, onEnterHooks, onFinishHooks]).filter(identity);
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
  private _buildTransitionHooks(hookType: string, locals = {}, options: TransitionHookOptions = {}) {
    let context = this.treeChanges.to, node = tail(context);
    options.traceData = { hookType, context };

    const transitionHook = eventHook => this.buildHook(node, eventHook.callback, locals, options);
    return this._matchingHooks(hookType, this._toFrom()).map(transitionHook);
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
  private _buildNodeHooks(hookType: string, path: Node[], toFromFn: (node: Node) => IToFrom, locals: any = {}, options: TransitionHookOptions = {}) {
    const hooksForNode = (node: Node) => {
      let toFrom = toFromFn(node);
      options.traceData = { hookType, context: node };
      locals.$state$ = node.state;

      const transitionHook = eventHook => this.buildHook(node, eventHook.callback, locals, options);
      return this._matchingHooks(hookType, toFrom).map(transitionHook);
    };

    return path.map(hooksForNode);
  }

  /** Given a node and a callback function, builds a TransitionHook */
  buildHook(node: Node, fn: IInjectable, locals?, options: TransitionHookOptions = {}): TransitionHook {
    let _options = extend({}, this.baseHookOptions, options);
    return new TransitionHook(fn, extend({}, locals), node.resolveContext, _options);
  }


  /**
   * returns an array of the IEventHooks from:
   * - The Transition object instance hook registry
   * - The TransitionService ($transitions) global hook registry
   * which matched:
   * - the eventType
   * - the matchCriteria to state
   * - the matchCriteria from state
   */
  private _matchingHooks(hookName: string, matchCriteria: IToFrom): IEventHook[] {
    const matchFilter   = hook => hook.matches(matchCriteria.to, matchCriteria.from);
    const prioritySort  = (l, r) => r.priority - l.priority;

    return [ this.transition, this.$transitions ]                             // Instance and Global hook registries
        .map((reg: IHookRegistry) => reg.getHooks(hookName))                  // Get named hooks from registries
        .filter(assertPredicate(isArray, `broken event named: ${hookName}`))  // Sanity check
        .reduce(unnestR)                                                      // Un-nest IEventHook[][] to IEventHook[] array
        .filter(matchFilter)                                                  // Only those satisfying matchCriteria
        .sort(prioritySort);                                                  // Order them by .priority field
  }
}
