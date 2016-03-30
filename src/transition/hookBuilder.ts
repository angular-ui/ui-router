/** @module transition */ /** for typedoc */

import {IInjectable, extend, tail, assertPredicate, unnestR, flatten, identity} from "../common/common";
import {isArray} from "../common/predicates";

import {TransitionOptions, TransitionHookOptions, IHookRegistry, TreeChanges, IEventHook, ITransitionService, IMatchingNodes} from "./interface";

import {Transition, TransitionHook} from "./module";
import {State} from "../state/module";
import {Node} from "../path/module";

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

  getOnBeforeHooks  = () => this._buildNodeHooks("onBefore",  "to",       tupleSort(), undefined, { async: false });
  getOnStartHooks   = () => this._buildNodeHooks("onStart",   "to",       tupleSort());
  getOnExitHooks    = () => this._buildNodeHooks("onExit",    "exiting",  tupleSort(true), (node) => ({ $state$: node.state }));
  getOnRetainHooks  = () => this._buildNodeHooks("onRetain",  "retained", tupleSort(), (node) => ({ $state$: node.state }));
  getOnEnterHooks   = () => this._buildNodeHooks("onEnter",   "entering", tupleSort(), (node) => ({ $state$: node.state }));
  getOnFinishHooks  = () => this._buildNodeHooks("onFinish",  "to",       tupleSort(), (node) => ({ $treeChanges$: this.treeChanges }));
  getOnSuccessHooks = () => this._buildNodeHooks("onSuccess", "to",       tupleSort(), undefined, { async: false, rejectIfSuperseded: false });
  getOnErrorHooks   = () => this._buildNodeHooks("onError",   "to",       tupleSort(), undefined, { async: false, rejectIfSuperseded: false });

  asyncHooks() {
    let onStartHooks    = this.getOnStartHooks();
    let onExitHooks     = this.getOnExitHooks();
    let onRetainHooks   = this.getOnRetainHooks();
    let onEnterHooks    = this.getOnEnterHooks();
    let onFinishHooks   = this.getOnFinishHooks();

    let asyncHooks = [onStartHooks, onExitHooks, onRetainHooks, onEnterHooks, onFinishHooks];
    return asyncHooks.reduce(unnestR, []).filter(identity);
  }

  /**
   * Returns an array of newly built TransitionHook objects.
   *
   * - Finds all IEventHooks registered for the given `hookType` which matched the transition's [[TreeChanges]].
   * - Finds [[Node]] (or `Node[]`) to use as the TransitionHook context(s)
   * - For each of the [[Node]]s, creates a TransitionHook
   *
   * @param hookType the name of the hook registration function, e.g., 'onEnter', 'onFinish'.
   * @param matchingNodesProp selects which [[Node]]s from the [[IMatchingNodes]] object to create hooks for.
   * @param getLocals a function which accepts a [[Node]] and returns additional locals to provide to the hook as injectables
   * @param sortHooksFn a function which compares two HookTuple and returns <1, 0, or >1
   * @param options any specific Transition Hook Options
   */
  private _buildNodeHooks(hookType: string,
                          matchingNodesProp: string,
                          sortHooksFn: (l: HookTuple, r: HookTuple) => number,
                          getLocals: (node: Node) => any = (node) => ({}),
                          options?: TransitionHookOptions): TransitionHook[] {

    // Find all the matching registered hooks for a given hook type
    let matchingHooks = this._matchingHooks(hookType, this.treeChanges);
    if (!matchingHooks) return [];

     const makeTransitionHooks = (hook: IEventHook) => {
      // Fetch the Nodes that caused this hook to match.
      let matches: IMatchingNodes = hook.matches(this.treeChanges);
      // Select the Node[] that will be used as TransitionHook context objects
      let nodes: Node[] = matches[matchingNodesProp];

      // Return an array of HookTuples
      return nodes.map(node => {
        let _options = extend({ bind: hook.bind, traceData: { hookType, context: node} }, this.baseHookOptions, options);
        let transitionHook = new TransitionHook(hook.callback, getLocals(node), node.resolveContext, _options);
        return <HookTuple> { hook, node, transitionHook };
      });
    };

    return matchingHooks.map(makeTransitionHooks)
        .reduce(unnestR, [])
        .sort(sortHooksFn)
        .map(tuple => tuple.transitionHook);
  }

  /**
   * Finds all IEventHooks from:
   * - The Transition object instance hook registry
   * - The TransitionService ($transitions) global hook registry
   *
   * which matched:
   * - the eventType
   * - the matchCriteria (to, from, exiting, retained, entering)
   *
   * @returns an array of matched [[IEventHook]]s
   */
  private _matchingHooks(hookName: string, treeChanges: TreeChanges): IEventHook[] {
    return [ this.transition, this.$transitions ]                             // Instance and Global hook registries
        .map((reg: IHookRegistry) => reg.getHooks(hookName))                  // Get named hooks from registries
        .filter(assertPredicate(isArray, `broken event named: ${hookName}`))  // Sanity check
        .reduce(unnestR, [])                                                  // Un-nest IEventHook[][] to IEventHook[] array
        .filter(hook => hook.matches(treeChanges));                           // Only those satisfying matchCriteria
  }
}

interface HookTuple { hook: IEventHook, node: Node, transitionHook: TransitionHook }

/**
 * A factory for a sort function for HookTuples.
 *
 * The sort function first compares the Node depth (how deep in the state tree a node is), then compares
 * the EventHook priority.
 *
 * @param reverseDepthSort a boolean, when true, reverses the sort order for the node depth
 * @returns a tuple sort function
 */
function tupleSort(reverseDepthSort = false) {
  return function nodeDepthThenPriority(l: HookTuple, r: HookTuple): number {
    let factor = reverseDepthSort ? -1 : 1;
    let depthDelta = (l.node.state.path.length - r.node.state.path.length) * factor;
    return depthDelta !== 0 ? depthDelta : r.hook.priority - l.hook.priority;
  }
}