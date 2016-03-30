/** @module transition */ /** for typedoc */
import {IInjectable, extend, removeFrom, anyTrueR, allTrueR, tail} from "../common/common";
import {isString, isFunction} from "../common/predicates";
import {val} from "../common/hof";
import {Node} from "../path/node";

import {HookRegOptions, HookMatchCriteria, IStateMatch, IEventHook, IHookRegistry, IHookRegistration, TreeChanges, HookMatchCriterion, IMatchingNodes} from "./interface";
import {Glob} from "../common/glob";
import {State} from "../state/stateObject";

/**
 * Determines if the given state matches the matchCriteria
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

  function matchGlobs(_state) {
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


export class EventHook implements IEventHook {
  callback: IInjectable;
  matchCriteria: HookMatchCriteria;
  priority: number;
  bind: any;

  constructor(matchCriteria: HookMatchCriteria, callback: IInjectable, options: HookRegOptions = <any>{}) {
    this.callback = callback;
    this.matchCriteria = extend({ to: true, from: true, exiting: true, retained: true, entering: true }, matchCriteria);
    this.priority = options.priority || 0;
    this.bind = options.bind || null;
  }

  private static _matchingNodes(nodes: Node[], criterion: HookMatchCriterion): Node[] {
    if (criterion === true) return nodes;
    let matching = nodes.filter(node => matchState(node.state, criterion));
    return matching.length ? matching : null;
  }

  /**
   * Determines if this hook's [[matchCriteria]] match the given [[TreeChanges]]
   *
   * @returns an IMatchingNodes object, or null. If an IMatchingNodes object is returned, its values
   * are the matching [[Node]]s for each [[HookMatchCriterion]] (to, from, exiting, retained, entering)
   */
  matches(treeChanges: TreeChanges): IMatchingNodes {
    let mc = this.matchCriteria, _matchingNodes = EventHook._matchingNodes;

    let matches = {
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

interface ITransitionEvents { [key: string]: IEventHook[]; }

// Return a registration function of the requested type.
function makeHookRegistrationFn(hooks: ITransitionEvents, name: string): IHookRegistration {
  return function (matchObject, callback, options = {}) {
    let eventHook = new EventHook(matchObject, callback, options);
    hooks[name].push(eventHook);

    return function deregisterEventHook() {
      removeFrom(hooks[name])(eventHook);
    };
  };
}

export class HookRegistry implements IHookRegistry {
  static mixin(source: HookRegistry, target: IHookRegistry) {
    Object.keys(source._transitionEvents).concat(["getHooks"]).forEach(key => target[key] = source[key]);
  }

  private _transitionEvents: ITransitionEvents = {
    onBefore: [], onStart: [], onEnter: [], onRetain: [], onExit: [], onFinish: [], onSuccess: [], onError: []
  };

  getHooks = (name: string) => this._transitionEvents[name];

  onBefore = makeHookRegistrationFn(this._transitionEvents, "onBefore");
  onStart = makeHookRegistrationFn(this._transitionEvents, "onStart");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionsProvider#onEnter
   * @methodOf ui.router.state.$transitionsProvider
   *
   * @description
   * Registers a function to be injected and invoked during a transition between the matched 'to' and 'from' states,
   * when the matched 'to' state is being entered. This function is injected with the entering state's resolves.
   *
   * This function can be injected with two additional special value:
   * - **`$transition$`**: The current transition
   * - **`$state$`**: The state being entered
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
   */
  onEnter = makeHookRegistrationFn(this._transitionEvents, "onEnter");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionsProvider#onRetain
   * @methodOf ui.router.state.$transitionsProvider
   *
   * @description
   * Registers a function to be injected and invoked during a transition between the matched 'to' and 'from states,
   * when the matched 'from' state is already active and is not being exited nor entered.
   *
   * This function can be injected with two additional special value:
   * - **`$transition$`**: The current transition
   * - **`$state$`**: The state that is retained
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
   */
  onRetain = makeHookRegistrationFn(this._transitionEvents, "onRetain");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionsProvider#onExit
   * @methodOf ui.router.state.$transitionsProvider
   *
   * @description
   * Registers a function to be injected and invoked during a transition between the matched 'to' and 'from states,
   * when the matched 'from' state is being exited. This function is in injected with the exiting state's resolves.
   *
   * This function can be injected with two additional special value:
   * - **`$transition$`**: The current transition
   * - **`$state$`**: The state being entered
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
   */
  onExit = makeHookRegistrationFn(this._transitionEvents, "onExit");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionsProvider#onFinish
   * @methodOf ui.router.state.$transitionsProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition is finished entering/exiting all states.
   *
   * This function can be injected with:
   * - **`$transition$`**: The current transition
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
   */
  onFinish = makeHookRegistrationFn(this._transitionEvents, "onFinish");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionsProvider#onSuccess
   * @methodOf ui.router.state.$transitionsProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition has successfully completed between the matched
   * 'to' and 'from' state is being exited.
   * This function is in injected with the 'to' state's resolves (note: `JIT` resolves are not injected).
   *
   * This function can be injected with two additional special value:
   * - **`$transition$`**: The current transition
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
   * @param {function} callback The function which will be injected and invoked, when a matching transition is started.
   *   The function's return value is ignored.
   */
  onSuccess = makeHookRegistrationFn(this._transitionEvents, "onSuccess");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionsProvider#onError
   * @methodOf ui.router.state.$transitionsProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition has failed for any reason between the matched
   * 'to' and 'from' state. The transition rejection reason is injected as `$error$`.
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionsProvider#on $transitionsProvider.on}.
   * @param {function} callback The function which will be injected and invoked, when a matching transition is started.
   *   The function's return value is ignored.
   */
  onError = makeHookRegistrationFn(this._transitionEvents, "onError");
}
