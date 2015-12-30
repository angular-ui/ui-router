/** @module transition */ /** for typedoc */
import {IInjectable, extend, val, isString, isFunction, removeFrom} from "../common/common";

import {IMatchCriteria, IStateMatch, IEventHook, IHookRegistry, IHookRegistration} from "./interface";

import {Glob, State} from "../state/module";

/**
 * Determines if the given state matches the matchCriteria
 * @param state a State Object to test against
 * @param matchCriteria {string|array|function}
 * - If a string, matchState uses the string as a glob-matcher against the state name
 * - If an array (of strings), matchState uses each string in the array as a glob-matchers against the state name
 *   and returns a positive match if any of the globs match.
 * - If a function, matchState calls the function with the state and returns true if the function's result is truthy.
 * @returns {boolean}
 */
export function matchState(state: State, matchCriteria: (string|IStateMatch)) {
  let toMatch = isString(matchCriteria) ? [matchCriteria] : matchCriteria;

  function matchGlobs(_state) {
    for (let i = 0; i < toMatch.length; i++) {
      let glob = Glob.fromString(toMatch[i]);

      if ((glob && glob.matches(_state.name)) || (!glob && toMatch[i] === _state.name)) {
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
  matchCriteria: IMatchCriteria;
  priority: number;

  constructor(matchCriteria: IMatchCriteria, callback: IInjectable, options: { priority: number } = <any>{}) {
    this.callback = callback;
    this.matchCriteria = extend({to: val(true), from: val(true)}, matchCriteria);
    this.priority = options.priority || 0;
  }

  matches(to: State, from: State) {
    return <boolean> matchState(to, this.matchCriteria.to) && matchState(from, this.matchCriteria.from);
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
