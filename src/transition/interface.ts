/** @module transition */ /** for typedoc */
import {StateDeclaration} from "../state/interface";
import {IInjectable, Predicate} from "../common/common";

import {Transition} from "./module";
import {State, TargetState} from "../state/module";
import {Node} from "../path/module";

/**
 * The TransitionOptions object can be used to change the behavior of a transition.
 *
 * It is passed as the third argument to [[$state.go]], [[$state.transitionTo]], and
 * can be used with the [[ui-sref-opts]] directive.
 */
export interface TransitionOptions {
  /**
   * This option changes how the Transition interacts with the browser's location bar (URL).
   *
   * - If `true`, it will update the url in the location bar.
   * - If `false`, it will not update the url in the location bar.
   * - If it is the string "`replace`", it will update the url and also replace the last history record.
   *
   * @default `true`
   */
  location    ?: (boolean|string);

  /**
   * When transitioning to relative path (e.g '`^`'), this option defines which state to be relative from.
   * @default `$state.current`
   */
  relative    ?: (string|StateDeclaration|State);

  /**
   * This option sets whether or not the transition's parameter values should be inherited from
   * the current state parameters.
   *
   * - If `true`, it will inherit parameters from current state.
   * - If `false`, only the parameters which are provided to `transitionTo` will be used.
   *
   * @default `false`
   */
  inherit     ?: boolean;

  /**
   * @deprecated
   */
  notify      ?: boolean;

  /**
   * This option may be used to force states which are currently active to reload.
   *
   * During a normal transition, a state is "retained" if:
   * - It was previously active
   * - The state's parameter values have not changed
   * - All the parent states' parameter values have not changed
   *
   * Forcing a reload of a state will cause it to be exited and entered, which will:
   * - Refetch that state's resolve data
   * - Exit the state (onExit hook)
   * - Re-enter the state (onEnter hook)
   * - Re-render the views (controllers and templates)
   *
   * - When `true`, the destination state (and all parent states) will be reloaded.
   * - When it is a string and is the name of a state, or when it is a State object,
   *   that state and any children states will be reloaded.
   *
   * @default `false`
   */
  reload      ?: (boolean|string|StateDeclaration|State);
  /**
   * You can define your own Transition Options inside this property and use them, e.g., from a Transition Hook
   */
  custom      ?: any;
  /** @internal */
  reloadState ?: (State);
  /** @internal */
  previous    ?: Transition;
  /** @internal */
  current     ?: () => Transition;
}

/** @internal */
export interface TransitionHookOptions {
  async               ?: boolean;
  rejectIfSuperseded  ?: boolean;
  current             ?: () => Transition;  //path?
  transition          ?: Transition;
  hookType            ?: string;
  target              ?: any;
  traceData           ?: any;
}

/**
 * TreeChanges encapsulates the various Paths that are involved in a Transition.
 *
 * A UI-Router Transition is from one Path in a State Tree to another Path.  For a given Transition,
 * this object stores the "to" and "from" paths, as well as subsets of those: the "retained",
 * "exiting" and "entering" paths.
 *
 * Each path in TreeChanges is an array of [[Node]] objects. Each Node in the array corresponds to a portion
 * of a nested state.
 *
 * For example, if you had a nested state named `foo.bar.baz`, it would have three
 * portions, `foo, bar, baz`.  If you transitioned **to** `foo.bar.baz` and inspected the TreeChanges.to
 * Path, you would find a node in the array for each portion: `foo`, `bar`, and `baz`.
 *
 * ---
 *
 * @todo show visual state tree
 */
export interface TreeChanges {
  /** @nodoc */
  [key: string]: Node[];

  /** The path of nodes in the state tree that the transition is coming *from* */
  from: Node[];

  /** The path of nodes in the state tree that the transition is going *to* */
  to: Node[];

  /**
   * The path of active nodes that the transition is retaining. These nodes are neither exited, nor entered.
   * Before and after the transition is successful, these nodes are active.
   */
  retained: Node[];

  /**
   * The path of nodes that the transition is exiting. After the Transition is successful, these nodes are no longer active.
   *
   * Note that a state that is being reloaded (due to parameter values changing, or `reload: true`) may be in both the
   * `exiting` and `entering` paths.
   */
  exiting: Node[];

  /**
   * The path of nodes that the transition is entering. After the Transition is successful, these nodes will be active.
   * Because they are entering, they have their resolves fetched, onEnter hooks run, and their views
   * (controller+templates) refreshed.
   *
   * Note that a state that is reloaded (due to parameter values changing, or `reload: true`) may be in both the
   * `exiting` and `entering` paths.
   */
  entering: Node[];
}

export type IErrorHandler = (error: Error) => void;

export interface ITransitionService extends IHookRegistry {
  create: (fromPath: Node[], targetState: TargetState) => Transition;
  defaultErrorHandler: (handler?: IErrorHandler) => IErrorHandler;
}

export type IHookGetter = (hookName: string) => IEventHook[];
export type IHookRegistration = (matchCriteria: IMatchCriteria, callback: IInjectable, options?) => Function;

/**
 * This interface specifies the api for registering Transition Hooks.  Both the
 * [[TransitionService]] and also the [[Transition]] object itself implement this interface.
 * Note: the Transition object only allows hooks to be registered before the Transition is started.
 */
export interface IHookRegistry {
  /**
   * Registers a callback function as an `onBefore` Transition Hook.
   *
   * The `matchCriteria` is used to determine which Transitions the hook should be invoked during.
   *
   * ### Lifecycle
   *
   * `onBefore` hooks are injected and invoked *before* a Transition starts.  No resolves have been fetched yet.
   * Each `onBefore` hook is invoked synchronously, in priority order, and are typically invoked in the same call
   * stack as [[StateService.transitionTo]].
   *
   * During the `onBefore` phase, the [[Transition]] additional hooks can be registered "on-the-fly" using, for example,
   * `$transition$.onStart()` or `$transition$.onFinish()`.
   *
   * ### Special injectables
   *
   * The current [[Transition]] can be injected as `$transition$`.
   *
   * ### Return value
   *
   * The hook's return value can be used to modify the current Transition:
   * - `false`: this will abort the current transition
   * - a [[TargetState]]: The Transition will be redirected to the new target state (created from the
   *   [[StateService.target]] factory).
   * - A promise: The Transition waits for this promise to settle before entering the [[onStart]] phase.
   *   - As above, the promise's _resolved value_ may be `false` or a [[TargetState]]
   *   - If the promise is _rejected_, the Transition is aborted.  The promise's rejection reason is used to reject
   *     the overall Transition promise.
   *
   * If any hook modifies the transition synchronously (by returning `false` or a [[TargetState]]), the remainder
   * of the hooks do not get invoked.  If any hook returns a promise, the remainder of the `onBefore` hooks are still
   * invoked. Any promises are then handled asynchronously, during the `onStart` phase of the Transition.
   *
   * ### Examples
   *
   * #### Default Substate
   *
   * This example redirects any transition from 'home' to 'home.dashboard'.  This is commonly referred to as a
   * "default substate".
   * @example
   * ```
   *
   * $transitions.onBefore({ to: 'home' }, function($state) {
   *   return $state.target("home.dashboard");
   * });
   * ```
   *
   *
   * #### Data Driven Default Substate
   *
   * This example provides data-driven default substate functionality. It matches on a transition to any state
   * which has `defaultSubstate: "some.sub.state"` defined.  See: [[Transition.to]] which returns the "to state"
   * definition.
   *
   * @example
   * ```
   *
   * // state declaration
   * {
   *   name: 'home',
   *   template: '<div ui-view/>',
   *   defaultSubstate: 'home.dashboard'
   * }
   *
   * var criteria = {
   *   to: function(state) {
   *     return state.defaultSubstate != null;
   *   }
   * }
   * $transitions.onBefore(criteria, function($transition$, $state) {
   *   return $state.target($transition$.to().defaultSubstate);
   * });
   * ```
   *
   *
   * #### Require authentication
   *
   * This example cancels a transition to a state which requires authentication, if the user is
   * not currently authenticated.
   *
   * This example assumes a state tree where all states which require authentication are children of
   * a parent `'auth'` state. This example assumes `MyAuthService` synchronously returns a boolean from
   * `isAuthenticated()`.
   * @example
   * ```
   *
   * $transitions.onBefore( { to: 'auth.*', from: '*' }, function(MyAuthService) {
   *   // If isAuthenticated is false, the transition is cancelled.
   *   return MyAuthService.isAuthenticated();
   * });
   * ```
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onBefore(matchCriteria: IMatchCriteria, callback: IInjectable, options?): Function;

  /**
   * Registers a callback function as an `onStart` Transition Hook.
   *
   * The `matchCriteria` is used to determine which Transitions the hook should be invoked during.
   *
   * ### Lifecycle
   *
   * `onStart` hooks are invoked asynchronously, in priority order, when the Transition starts running.
   * At this point, the Transition has not exited nor entered any states yet.
   *
   * Note: a high priority `onStart` hook will fetch any Eager Resolves in the "to path", which were not already fetched.
   *
   * ### Special injectables
   *
   * The current [[Transition]] can be injected as `$transition$`.
   *
   * Any resolves which the target state has access to may be injected.
   *
   * ### Return value
   *
   * The hook's return value can be used to modify the current Transition:
   * - `false`: this will abort the current transition
   * - a [[TargetState]]: The Transition will be redirected to the new target state (created from the
   *   [[StateService.target]] factory).
   * - A promise: The Transition waits for this promise to settle before invoking the next hook.
   *   - As above, the promise's _resolved value_ may be `false` or a [[TargetState]]
   *   - If the promise is _rejected_, the Transition is aborted.  The promise's rejection reason is used to reject
   *     the overall Transition promise.
   *
   * ### Example
   *
   * #### Login during transition
   *
   * This example intercepts any transition to a state which requires authentication, when the user is
   * not currently authenticated.  It allows the user to authenticate asynchronously, then resumes the
   * transition.  If the user did not authenticate successfully, it redirects to the "guest" state, which
   * does not require authentication.
   *
   * This example assumes:
   * - a state tree where all states which require authentication are children of a parent `'auth'` state.
   * - `MyAuthService.isAuthenticated()` synchronously returns a boolean.
   * - `MyAuthService.authenticate()` presents a login dialog, and returns a promise which is resolved
   *   or rejected, whether or not the login attempt was successful.
   *
   * @example
   * ```
   *
   * $transitions.onStart( { to: 'auth.*' }, function(MyAuthService, $state) {
   *
   *   // If the user is not authenticated
   *   if (!MyAuthService.isAuthenticated()) {
   *
   *     // Then return a promise for a successful login.
   *     // The transition will wait for this promise to settle
   *
   *     return MyAuthService.authenticate().catch(function() {
   *
   *       // Redirect to a state that we know doesn't require auth.
   *       return $state.target("guest");
   *     });
   *   }
   * });
   * ```
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onStart(matchCriteria: IMatchCriteria, callback: IInjectable, options?): Function;

  /**
   * Registers a callback function as an `onEnter` Transition+State Hook.
   *
   * The `matchCriteria` is used to determine which Transitions the hook should be invoked during.
   * Note: for `onEnter` hooks, the `to` in the `matchCriteria` matches the entering state, not the Transition "to state".
   *
   * ### Lifecycle
   *
   * `onEnter` hooks are invoked asynchronously, in priority order, when the Transition is entering a state.  States
   * are entered after the `onRetain` hooks.
   *
   * Note: a high priority `onEnter` hook fetches any Lazy Resolves defined for the state being entered.
   *
   * ### Special injectables
   *
   * The current [[Transition]] can be injected as `$transition$`.
   *
   * Any resolves which the entering state has access to may be injected.
   *
   * ### Return value
   *
   * The hook's return value can be used to modify the current Transition:
   * - `false`: this will abort the current transition
   * - a [[TargetState]]: The Transition will be redirected to the new target state (created from the
   *   [[StateService.target]] factory).
   * - A promise: The Transition waits for this promise to settle before invoking the next hook.
   *   - As above, the promise's _resolved value_ may be `false` or a [[TargetState]]
   *   - If the promise is _rejected_, the Transition is aborted.  The promise's rejection reason is used to reject
   *     the overall Transition promise.
   *
   * ### Inside a state declaration
   *
   * State hooks can be registered using `$transitions` ([[TransitionService]]), as an `onBefore` "on-the-fly" registration
   * using `$transition$` (the [[Transition]] instance), or as part of a state declaration.
   *
   *
   * ### Examples
   *
   * #### Audit Log
   *
   * This example uses a service to log that a user has entered the admin section of an app.
   * This assumes that there are substates of the "admin" state, such as "admin.users", "admin.pages", etc.
   * @example
   * ```
   *
   * $transitions.onEnter({ to: 'admin' }, function(AuditService, $state$, $transition$) {
   *   AuditService.log("Entered admin module while transitioning to " + $transition$.to().name);
   * }
   * ```
   *
   * #### Audit Log (inside a state declaration)
   *
   * The `onEnter` inside this state declaration is syntactic sugar for the previous Audit Log example.
   * ```
   * {
   *   name: 'admin',
   *   template: '<div ui-view/>',
   *   onEnter: function(AuditService, $state$, $transition$) {
   *     AuditService.log("Entered admin module while transitioning to " + $transition$.to().name);
   *   }
   * }
   * ```
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onEnter(matchCriteria: IMatchCriteria, callback: IInjectable, options?): Function;

  /**
   * Registers a callback function as an `onRetain` Transition+State Hook.
   *
   * The `matchCriteria` is used to determine which Transitions the hook should be invoked during.
   * Note: for `onRetain` hooks, the `to` in the `matchCriteria` matches the retained state, not the Transition "to state".
   *
   * ### Lifecycle
   *
   * `onRetain` hooks are invoked asynchronously, in priority order, after `onExit` hooks.
   *
   * ### Special injectables
   *
   * The current [[Transition]] can be injected as `$transition$`.
   *
   * Any resolves which the retained state has access to may be injected.
   *
   * ### Return value
   *
   * The hook's return value can be used to modify the current Transition:
   * - `false`: this will abort the current transition
   * - a [[TargetState]]: The Transition will be redirected to the new target state (created from the
   *   [[StateService.target]] factory).
   * - A promise: The Transition waits for this promise to settle before invoking the next hook.
   *   - As above, the promise's _resolved value_ may be `false` or a [[TargetState]]
   *   - If the promise is _rejected_, the Transition is aborted.  The promise's rejection reason is used to reject
   *     the overall Transition promise.
   *
   * ### Inside a state declaration
   *
   * State hooks can be registered using `$transitions` ([[TransitionService]]), as an `onBefore` "on-the-fly" registration
   * using `$transition$` (the [[Transition]] instance), or as part of a state declaration.
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onRetain(matchCriteria: IMatchCriteria, callback: IInjectable, options?): Function;

  /**
   * Registers a callback function as an `onExit` Transition+State Hook.
   *
   * The `matchCriteria` is used to determine which Transitions the hook should be invoked during.
   * Note: for `onExit` hooks, the `from` in the `matchCriteria` matches the exiting state, not the Transition "from state".
   *
   * ### Lifecycle
   *
   * `onExit` hooks are invoked asynchronously, in priority order, when the Transition is exiting a state.  States
   * are exited after the Transition's `onStart` phase is complete.
   *
   * ### Special injectables
   *
   * The current [[Transition]] can be injected as `$transition$`.
   *
   * Any resolves which the exiting state has access to may be injected.
   *
   * ### Return value
   *
   * The hook's return value can be used to modify the current Transition:
   * - `false`: this will abort the current transition
   * - a [[TargetState]]: The Transition will be redirected to the new target state (created from the
   *   [[StateService.target]] factory).
   * - A promise: The Transition waits for this promise to settle before invoking the next hook.
   *   - As above, the promise's _resolved value_ may be `false` or a [[TargetState]]
   *   - If the promise is _rejected_, the Transition is aborted.  The promise's rejection reason is used to reject
   *     the overall Transition promise.
   *
   * ### Inside a state declaration
   *
   * State hooks can be registered using `$transitions` ([[TransitionService]]), as an `onBefore` "on-the-fly" registration
   * using `$transition$` (the [[Transition]] instance), or as part of a state declaration.
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onExit(matchCriteria: IMatchCriteria, callback: IInjectable, options?): Function;

  /**
   * Registers a callback function as an `onFinish` Transition Hook.
   *
   * The `matchCriteria` is used to determine which Transitions the hook should be invoked during.
   *
   * ### Lifecycle
   *
   * `onFinish` hooks are invoked asynchronously, in priority order, just before the Transition completes, after
   * all states are entered and exited.
   *
   * ### Special injectables
   *
   * The current [[Transition]] can be injected as `$transition$`.
   *
   * Any resolves which the "to state" has access to may be injected.
   *
   * ### Return value
   *
   * The hook's return value can be used to modify the current Transition:
   * - `false`: this will abort the current transition
   * - a [[TargetState]]: The Transition will be redirected to the new target state (created from the
   *   [[StateService.target]] factory).
   * - A promise: The Transition waits for this promise to settle before invoking the next hook.
   *   - As above, the promise's _resolved value_ may be `false` or a [[TargetState]]
   *   - If the promise is _rejected_, the Transition is aborted.  The promise's rejection reason is used to reject
   *     the overall Transition promise.
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onFinish(matchCriteria: IMatchCriteria, callback: IInjectable, options?): Function;

  /**
   * Registers a callback function as an `onSuccess` Transition Hook.
   *
   * The `matchCriteria` is used to determine which Transitions the hook should be invoked during.
   *
   * ### Lifecycle
   *
   * `onSuccess` hooks are chained off the Transition's promise.  If the Transition is successful, the promise
   * is resolved, and the `onSuccess` hooks are then invoked.
   *
   * ### Special injectables
   *
   * The successful [[Transition]] can be injected as `$transition$`.
   *
   * Any previously fetched resolves which the "to state" has access to may be injected.  These hooks will not
   * trigger/wait for any unfetched resolves to fetch.
   *
   * ### Return value
   *
   * Since the Transition is already completed, the hook's return value is ignored
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onSuccess(matchCriteria: IMatchCriteria, callback: IInjectable, options?): Function;

  /**
   * Registers a callback function as an `onError` Transition Hook.
   *
   * The `matchCriteria` is used to determine which Transitions the hook should be invoked during.
   *
   * ### Lifecycle
   *
   * `onError` hooks are chained off the Transition's promise.  If the Transition fails, the promise
   * is rejected, and the `onError` hooks are then invoked.
   *
   * ### Special injectables
   *
   * The failed [[Transition]] can be injected as `$transition$`.
   *
   * The transition rejection reason can be injected as `$error$`
   *
   * ### Return value
   *
   * Since the Transition is already completed, the hook's return value is ignored
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onError(matchCriteria: IMatchCriteria, callback: IInjectable, options?): Function;

  /**
   * Returns all the registered hooks of a given `hookName` type
   *
   * @example
   * ```
   *
   * $transitions.getHooks("onEnter")
   * ```
   */
  getHooks(hookName: string): IEventHook[];
}

export type IStateMatch = Predicate<State>
/**
 * This object is used to configure whether or not a Transition Hook is invoked for a particular transition,
 * based on the Transition's "to state" and "from state".
 *
 * The `to` and `from` can be state globs, or a function that takes a state.
 * Both `to` and `from` are optional.  If one of these is omitted, it is replaced with the
 * function: `function() { return true; }`, which effectively matches any state.
 *
 * @example
 * ```js
 *
 * // This matches a transition coming from the `parent` state and going to the `parent.child` state.
 * var match = {
 *   to: 'parent',
 *   from: 'parent.child'
 * }
 * ```
 *
 * @example
 * ```js
 *
 * // This matches a transition coming from any substate of `parent` and going directly to the `parent` state.
 * var match = {
 *   to: 'parent',
 *   from: 'parent.**'
 * }
 * ```
 *
 * @example
 * ```js
 *
 * // This matches a transition coming from any state and going to any substate of `mymodule`
 * var match = {
 *   to: 'mymodule.**'
 * }
 * ```
 *
 * @example
 * ```js
 *
 * // This matches a transition coming from any state and going to any state that has `data.authRequired`
 * // set to a truthy value.
 * var match = {
 *   to: function(state) {
 *     return state.data != null && state.data.authRequired === true;
 *   }
 * }
 * ```
 */
export interface IMatchCriteria {
  /**
   * A glob string that matches the 'to' state's name.
   * Or, a function with the signature `function(state) {}` which should return a boolean to indicate if the state matches.
   */
  to?: (string|IStateMatch);

  /**
   *  A glob string that matches the 'from' state's name.
   *  Or, a function with the signature `function(State) { return boolean; }` which should return a boolean to
   *  indicate if the state matches.
   */
  from?: (string|IStateMatch);
}

export interface IEventHook {
  callback: IInjectable;
  priority: number;
  matches:  (a: State, b: State) => boolean;
}