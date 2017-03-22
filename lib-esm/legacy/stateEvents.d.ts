
import { IAngularEvent } from "angular";
/**
 * An event broadcast on `$rootScope` when the state transition **begins**.
 *
 * ### Deprecation warning: use [[TransitionService.onStart]] instead
 *
 * You can use `event.preventDefault()`
 * to prevent the transition from happening and then the transition promise will be
 * rejected with a `'transition prevented'` value.
 *
 * Additional arguments to the event handler are provided:
 * - `toState`: the Transition Target state
 * - `toParams`: the Transition Target Params
 * - `fromState`: the state the transition is coming from
 * - `fromParams`: the parameters from the state the transition is coming from
 * - `options`: any Transition Options
 * - `$transition$`: the [[Transition]]
 *
 * #### Example:
 * ```js
 * $rootScope.$on('$stateChangeStart', function(event, transition) {
 *   event.preventDefault();
 *   // transitionTo() promise will be rejected with
 *   // a 'transition prevented' error
 * })
 * ```
 *
 * @event $stateChangeStart
 * @deprecated
 */
export declare var $stateChangeStart: IAngularEvent;
/**
 * An event broadcast on `$rootScope` if a transition is **cancelled**.
 *
 * ### Deprecation warning: use [[TransitionService.onStart]] instead
 *
 * Additional arguments to the event handler are provided:
 * - `toState`: the Transition Target state
 * - `toParams`: the Transition Target Params
 * - `fromState`: the state the transition is coming from
 * - `fromParams`: the parameters from the state the transition is coming from
 * - `options`: any Transition Options
 * - `$transition$`: the [[Transition]] that was cancelled
 *
 * @event $stateChangeCancel
 * @deprecated
 */
export declare var $stateChangeCancel: IAngularEvent;
/**
 * An event broadcast on `$rootScope` once the state transition is **complete**.
 *
 * ### Deprecation warning: use [[TransitionService.onStart]] and [[Transition.promise]], or [[Transition.onSuccess]]
 *
 * Additional arguments to the event handler are provided:
 * - `toState`: the Transition Target state
 * - `toParams`: the Transition Target Params
 * - `fromState`: the state the transition is coming from
 * - `fromParams`: the parameters from the state the transition is coming from
 * - `options`: any Transition Options
 * - `$transition$`: the [[Transition]] that just succeeded
 *
 * @event $stateChangeSuccess
 * @deprecated
 */
export declare var $stateChangeSuccess: IAngularEvent;
/**
 * An event broadcast on `$rootScope` when an **error occurs** during transition.
 *
 * ### Deprecation warning: use [[TransitionService.onStart]] and [[Transition.promise]], or [[Transition.onError]]
 *
 * It's important to note that if you
 * have any errors in your resolve functions (javascript errors, non-existent services, etc)
 * they will not throw traditionally. You must listen for this $stateChangeError event to
 * catch **ALL** errors.
 *
 * Additional arguments to the event handler are provided:
 * - `toState`: the Transition Target state
 * - `toParams`: the Transition Target Params
 * - `fromState`: the state the transition is coming from
 * - `fromParams`: the parameters from the state the transition is coming from
 * - `error`: The reason the transition errored.
 * - `options`: any Transition Options
 * - `$transition$`: the [[Transition]] that errored
 *
 * @event $stateChangeError
 * @deprecated
 */
export declare var $stateChangeError: IAngularEvent;
/**
 * An event broadcast on `$rootScope` when a requested state **cannot be found** using the provided state name.
 *
 * ### Deprecation warning: use [[StateService.onInvalid]] instead
 *
 * The event is broadcast allowing any handlers a single chance to deal with the error (usually by
 * lazy-loading the unfound state). A `TargetState` object is passed to the listener handler,
 * you can see its properties in the example. You can use `event.preventDefault()` to abort the
 * transition and the promise returned from `transitionTo()` will be rejected with a
 * `'transition aborted'` error.
 *
 * Additional arguments to the event handler are provided:
 * - `unfoundState` Unfound State information. Contains: `to, toParams, options` properties.
 * - `fromState`: the state the transition is coming from
 * - `fromParams`: the parameters from the state the transition is coming from
 * - `options`: any Transition Options
 *
 * #### Example:
 * ```js
 * // somewhere, assume lazy.state has not been defined
 * $state.go("lazy.state", { a: 1, b: 2 }, { inherit: false });
 *
 * // somewhere else
 * $scope.$on('$stateNotFound', function(event, transition) {
 * function(event, unfoundState, fromState, fromParams){
 *     console.log(unfoundState.to); // "lazy.state"
 *     console.log(unfoundState.toParams); // {a:1, b:2}
 *     console.log(unfoundState.options); // {inherit:false} + default options
 * });
 * ```
 *
 * @event $stateNotFound
 * @deprecated
 */
export declare var $stateNotFound: IAngularEvent;
