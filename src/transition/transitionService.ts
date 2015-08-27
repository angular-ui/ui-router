/// <reference path='../../typings/angularjs/angular.d.ts' />

import {extend, is, isFunction, isString, val} from "../common/common";
import {IServiceProviderFactory} from "angular";

import {Transition} from "./transition";

import {IState} from "../state/interface";
import TargetState from "../state/targetState";
import Glob from "../state/glob";

import {ITransPath} from "../path/interface";

import {ITransitionService, ITransitionOptions, IStateMatch, IMatchCriteria} from "./interface";


/**
 * The default transition options.
 * Include this object when applying custom defaults:
 * let reloadOpts = { reload: true, notify: true }
 * let options = defaults(theirOpts, customDefaults, defaultOptions);
 */
export let defaultTransOpts: ITransitionOptions = {
  location    : true,
  relative    : null,
  inherit     : false,
  notify      : true,
  reload      : false,
  trace       : false,
  custom      : {},
  current     : () => null
};

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
export function matchState(state: IState, matchCriteria: (string|IStateMatch)) {
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

export let $transition: ITransitionService = <any> {};


/**
 * @ngdoc object
 * @name ui.router.state.$transitionProvider
 */
$TransitionProvider.$inject = [];
function $TransitionProvider() {
  $TransitionProvider.prototype.instance = this;

  let transitionEvents = {
    onBefore: [], onStart: [], on: [], entering: [], exiting: [], onSuccess: [], onError: []
  };

  // Return a registration function of the requested type.
  function registerEventHook(eventType) {
    return function(matchObject, callback, options) {
      options = options || {};
      let eventHook = new EventHook(matchObject, callback, options);
      let hooks = transitionEvents[eventType];
      hooks.push(eventHook);
      hooks.sort(function(a, b) {
        return a.priority - b.priority;
      });

      return function deregisterEventHook() {
        let idx = hooks.indexOf(eventHook);
        if (idx !== -1) hooks.splice(idx, 1);
      };
    };
  }

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#onBefore
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked before a Transition begins.
   *
   * This function can be injected with one additional special value:
   * - **`$transition$`**: The current transition
   *
   * @param {object} matchObject An object that specifies which transitions to invoke the callback for (typically this
   * value will be {} for this callback, to match all invalid transitions)
   *
   * - **`to`** - {string|function=} - A glob string that matches the 'to' state's name.
   *    Or, a function with the signature `function(state) {}` which should return a boolean to indicate if the state matches.
   * - **`from`** - {string|function=} - A glob string that matches the 'from' state's name.
   *    Or, a function with the signature `function(state) {}` which should return a boolean to indicate if the state matches.
   *
   * @param {function} callback
   *   The function which will be injected and invoked, before a matching transition is started.
   *   The function may optionally return a {boolean|Transition|object} value which will affect the current transition:
   *
   * @return
   *     - **`false`** to abort the current transition
   *     - **{Transition}** A Transition object from the $transition$.redirect() factory. If returned, the
   *        current transition will be aborted and the returned Transition will supersede it.
   *     - **{object}** A map of resolve functions to be added to the current transition. These resolves will be made
   *        available for injection to further steps in the transition.  The object should have {string}s for keys and
   *        {function}s for values, like the `resolve` object in {@link ui.router.state.$stateProvider#state $stateProvider.state}.
   */
  this.onBefore = registerEventHook("onBefore");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#onStart
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition has entered the async portion.
   * This function can be injected with one additional special value:
   * - **`$transition$`**: The current transition
   *
   * @param {object} matchObject An object that specifies which transitions to invoke the callback for (typically this
   * value will be {} for this callback, to match all invalid transitions)
   *
   * - **`to`** - {string|function=} - A glob string that matches the 'to' state's name.
   *    Or, a function with the signature `function(state) {}` which should return a boolean to indicate if the state matches.
   * - **`from`** - {string|function=} - A glob string that matches the 'from' state's name.
   *    Or, a function with the signature `function(state) {}` which should return a boolean to indicate if the state matches.
   *
   * @param {function} callback
   *   The function which will be injected and invoked, when a matching transition is started.
   *   The function may optionally return a {boolean|Transition|object} value which will affect the current transition:
   *
   *     - **`false`** to abort the current transition
   *     - **{Transition}** A Transition object from the $transition$.redirect() factory. If returned, the
   *        current transition will be aborted and the returned Transition will supersede it.
   *     - **{object}** A map of resolve functions to be added to the current transition. These resolves will be made
   *        available for injection to further steps in the transition.  The object should have {string}s for keys and
   *        {function}s for values, like the `resolve` object in {@link ui.router.state.$stateProvider#state $stateProvider.state}.
   */
  this.onStart = registerEventHook("onStart");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#on
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition between the matched 'to' and 'from' states
   * starts.  This function can be injected with one additional special value:
   * - **`$transition$`**: The current transition
   *
   * @param {object} matchObject An object that specifies which transitions to invoke the callback for.
   *
   * - **`to`** - {string|function=} - A glob string that matches the 'to' state's name.
   *    Or, a function with the signature `function(state) {}` which should return a boolean to indicate if the state matches.
   * - **`from`** - {string|function=} - A glob string that matches the 'from' state's name.
   *    Or, a function with the signature `function(state) {}` which should return a boolean to indicate if the state matches.
   *
   * @param {function} callback
   *   The function which will be injected and invoked, when a matching transition is started.
   *   The function may optionally return a {boolean|Transition|object} value which will affect the current transition:
   *
   *     - **`false`** to abort the current transition
   *     - **{Transition}** A Transition object from the $transition$.redirect() factory. If returned, the
   *        current transition will be aborted and the returned Transition will supersede it.
   *     - **{object}** A map of resolve functions to be added to the current transition. These resolves will be made
   *        available for injection to further steps in the transition.  The object should have {string}s for keys and
   *        {function}s for values, like the `resolve` object in {@link ui.router.state.$stateProvider#state $stateProvider.state}.
   */
  this.on = registerEventHook("on");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#entering
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked during a transition between the matched 'to' and 'from' states,
   * when the matched 'to' state is being entered. This function is in injected with the entering state's resolves.
   *
   * This function can be injected with two additional special value:
   * - **`$transition$`**: The current transition
   * - **`$state$`**: The state being entered
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   */
  this.entering = registerEventHook("entering");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#exiting
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked during a transition between the matched 'to' and 'from states,
   * when the matched 'from' state is being exited. This function is in injected with the exiting state's resolves.
   *
   * This function can be injected with two additional special value:
   * - **`$transition$`**: The current transition
   * - **`$state$`**: The state being entered
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback See callback in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   */
  this.exiting = registerEventHook("exiting");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#onSuccess
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition has successfully completed between the matched
   * 'to' and 'from' state is being exited.
   * This function is in injected with the 'to' state's resolves (note: `JIT` resolves are not injected).
   *
   * This function can be injected with two additional special value:
   * - **`$transition$`**: The current transition
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback The function which will be injected and invoked, when a matching transition is started.
   *   The function's return value is ignored.
   */
  this.onSuccess = registerEventHook("onSuccess");

  /**
   * @ngdoc function
   * @name ui.router.state.$transitionProvider#onError
   * @methodOf ui.router.state.$transitionProvider
   *
   * @description
   * Registers a function to be injected and invoked when a transition has failed for any reason between the matched
   * 'to' and 'from' state. The transition rejection reason is injected as `$error$`.
   *
   * @param {object} matchObject See transitionCriteria in {@link ui.router.state.$transitionProvider#on $transitionProvider.on}.
   * @param {function} callback The function which will be injected and invoked, when a matching transition is started.
   *   The function's return value is ignored.
   */
  this.onError = registerEventHook("onError");

  function EventHook(matchCriteria: IMatchCriteria, callback: () => any, options = { priority: 0 }) {
    matchCriteria = extend({ to: val(true), from: val(true) }, matchCriteria);
    this.callback = callback;
    this.priority = options.priority || 0;
    this.matches = function matches(to: IState, from: IState) {
      return matchState(to, matchCriteria.to) && matchState(from, matchCriteria.from);
    };
  }

  /**
   * @ngdoc service
   * @name ui.router.state.$transition
   *
   * @requires $q
   * @requires $injector
   * @requires ui.router.util.$resolve
   *
   * @description
   * The `$transition` service manages changes in states and parameters.
   */
  this.$get = $get;
  $get.$inject = ['$q', '$injector'];
  function $get(   $q,   $injector ) {
    $transition.create = function create(fromPath: ITransPath, targetState: TargetState) {
      return new Transition(fromPath, targetState);
    };

    $transition.isTransition = is(Transition);

    $transition.provider = $TransitionProvider.prototype.instance;

    $transition.$$hooks = function(type: string) {
      return [].concat(transitionEvents[type]);
    };

    return $transition;
  }
}

angular.module('ui.router.state')
  .provider('$transition', <IServiceProviderFactory> $TransitionProvider);