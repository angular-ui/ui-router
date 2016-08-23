/** @module transition */ /** for typedoc */
import {extend, removeFrom, allTrueR, tail} from "../common/common";
import {isString, isFunction} from "../common/predicates";
import {PathNode} from "../path/node";
import {TransitionStateHookFn, TransitionHookFn} from "./interface"; // has or is using

import {
    HookRegOptions, HookMatchCriteria, IEventHook, IHookRegistry, IHookRegistration, TreeChanges,
    HookMatchCriterion, IMatchingNodes, HookFn
} from "./interface";
import {Glob} from "../common/glob";
import {State} from "../state/stateObject";

/**
 * Determines if the given state matches the matchCriteria
 *
 * @hidden
 *
 * @param state a State Object to test against
 * @param criterion
 * - If a string, matchState uses the string as a glob-matcher against the state name
 * - If an array (of strings), matchState uses each string in the array as a glob-matchers against the state name
 *   and returns a positive match if any of the globs match.
 * - If a function, matchState calls the function with the state and returns true if the function's result is truthy.
 * @returns {boolean}
 */
export function matchState(state: State, criterion: HookMatchCriterion) {
  let toMatch = isString(criterion) ? [criterion] : criterion;

  function matchGlobs(_state: State) {
    let globStrings = <string[]> toMatch;
    for (let i = 0; i < globStrings.length; i++) {
      let glob = Glob.fromString(globStrings[i]);

      if ((glob && glob.matches(_state.name)) || (!glob && globStrings[i] === _state.name)) {
        return true;
      }
    }
    return false;
  }

  let matchFn = <any> (isFunction(toMatch) ? toMatch : matchGlobs);
  return !!matchFn(state);
}

/** @hidden */
export class EventHook implements IEventHook {
  callback: HookFn;
  matchCriteria: HookMatchCriteria;
  priority: number;
  bind: any;
  _deregistered: boolean;

  constructor(matchCriteria: HookMatchCriteria, callback: HookFn, options: HookRegOptions = <any>{}) {
    this.callback = callback;
    this.matchCriteria = extend({ to: true, from: true, exiting: true, retained: true, entering: true }, matchCriteria);
    this.priority = options.priority || 0;
    this.bind = options.bind || null;
    this._deregistered = false;
  }

  private static _matchingNodes(nodes: PathNode[], criterion: HookMatchCriterion): PathNode[] {
    if (criterion === true) return nodes;
    let matching = nodes.filter(node => matchState(node.state, criterion));
    return matching.length ? matching : null;
  }

  /**
   * Determines if this hook's [[matchCriteria]] match the given [[TreeChanges]]
   *
   * @returns an IMatchingNodes object, or null. If an IMatchingNodes object is returned, its values
   * are the matching [[PathNode]]s for each [[HookMatchCriterion]] (to, from, exiting, retained, entering)
   */
  matches(treeChanges: TreeChanges): IMatchingNodes {
    let mc = this.matchCriteria, _matchingNodes = EventHook._matchingNodes;

    let matches: IMatchingNodes = {
      to: _matchingNodes([tail(treeChanges.to)], mc.to),
      from: _matchingNodes([tail(treeChanges.from)], mc.from),
      exiting: _matchingNodes(treeChanges.exiting, mc.exiting),
      retained: _matchingNodes(treeChanges.retained, mc.retained),
      entering: _matchingNodes(treeChanges.entering, mc.entering),
    };

    // Check if all the criteria matched the TreeChanges object
    let allMatched: boolean = ["to", "from", "exiting", "retained", "entering"]
        .map(prop => matches[prop])
        .reduce(allTrueR, true);

    return allMatched ? matches : null;
  }
}

/** @hidden */
interface ITransitionEvents { [key: string]: IEventHook[]; }

/** @hidden Return a registration function of the requested type. */
function makeHookRegistrationFn(hooks: ITransitionEvents, name: string): IHookRegistration {
  return function (matchObject, callback, options = {}) {
    let eventHook = new EventHook(matchObject, callback, options);
    hooks[name].push(eventHook);

    return function deregisterEventHook() {
      eventHook._deregistered = true;
      removeFrom(hooks[name])(eventHook);
    };
  };
}

/**
 * Mixin class acts as a Transition Hook registry.
 *
 * Holds the registered [[HookFn]] objects.
 * Exposes functions to register new hooks.
 *
 * This is a Mixin class which can be applied to other objects.
 *
 * The hook registration functions are [[onBefore]], [[onStart]], [[onEnter]], [[onRetain]], [[onExit]], [[onFinish]], [[onSuccess]], [[onError]].
 *
 * This class is mixed into both the [[TransitionService]] and every [[Transition]] object.
 * Global hooks are added to the [[TransitionService]].
 * Since each [[Transition]] is itself a `HookRegistry`, hooks can also be added to individual Transitions
 * (note: the hook criteria still must match the Transition).
 */
export class HookRegistry implements IHookRegistry {
  static mixin(source: HookRegistry, target: IHookRegistry) {
    Object.keys(source._transitionEvents).concat(["getHooks"]).forEach(key => target[key] = source[key]);
  }

  private _transitionEvents: ITransitionEvents = {
    onBefore: [], onStart: [], onEnter: [], onRetain: [], onExit: [], onFinish: [], onSuccess: [], onError: []
  };

  getHooks = (name: string) => this._transitionEvents[name];

  /** @inheritdoc */
  onBefore  = makeHookRegistrationFn(this._transitionEvents, "onBefore");
  /** @inheritdoc */
  onStart   = makeHookRegistrationFn(this._transitionEvents, "onStart");
  /** @inheritdoc */
  onEnter   = makeHookRegistrationFn(this._transitionEvents, "onEnter");
  /** @inheritdoc */
  onRetain  = makeHookRegistrationFn(this._transitionEvents, "onRetain");
  /** @inheritdoc */
  onExit    = makeHookRegistrationFn(this._transitionEvents, "onExit");
  /** @inheritdoc */
  onFinish  = makeHookRegistrationFn(this._transitionEvents, "onFinish");
  /** @inheritdoc */
  onSuccess = makeHookRegistrationFn(this._transitionEvents, "onSuccess");
  /** @inheritdoc */
  onError   = makeHookRegistrationFn(this._transitionEvents, "onError");
}
