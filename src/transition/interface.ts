/** @module transition */ /** for typedoc */
import {StateDeclaration} from "../state/interface";
import {Predicate} from "../common/common";

import {Transition} from "./transition";
import {State} from "../state/stateObject";
import {PathNode} from "../path/node";
import {TargetState} from "../state/targetState";
import {UIInjector} from "../common/interface";

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
  /** @hidden @internal */
  reloadState ?: (State);
  /** @hidden @internal
   * If this transition is a redirect, this property should be the original Transition (which was redirected to this one)
   */
  redirectedFrom?: Transition;
  /** @hidden @internal */
  current     ?: () => Transition;
  /** @hidden @internal */
  source      ?: "sref"|"url"|"redirect"|"otherwise"|"unknown";
}

/** @hidden @internal */
export interface TransitionHookOptions {
  async               ?: boolean;
  rejectIfSuperseded  ?: boolean;
  current             ?: () => Transition;  //path?
  transition          ?: Transition;
  hookType            ?: string;
  target              ?: any;
  traceData           ?: any;
  bind                ?: any;
  stateHook           ?: boolean;
}

/**
 * TreeChanges encapsulates the various Paths that are involved in a Transition.
 *
 * Get a TreeChanges object using [[Transition.treeChanges]]
 *
 * A UI-Router Transition is from one Path in a State Tree to another Path.  For a given Transition,
 * this object stores the "to" and "from" paths, as well as subsets of those: the "retained",
 * "exiting" and "entering" paths.
 *
 * Each path in TreeChanges is an array of [[PathNode]] objects. Each PathNode in the array corresponds to a portion
 * of a nested state.
 *
 * For example, if you had a nested state named `foo.bar.baz`, it would have three
 * portions, `foo, bar, baz`.  If you transitioned **to** `foo.bar.baz` and inspected the [[TreeChanges.to]]
 * Path, you would find a node in the array for each portion: `foo`, `bar`, and `baz`.
 *
 * ---
 *
 * @todo show visual state tree
 */
export interface TreeChanges {
  /** @nodoc */
  [key: string]: PathNode[];

  /** The path of nodes in the state tree that the transition is coming *from* */
  from: PathNode[];

  /** The path of nodes in the state tree that the transition is going *to* */
  to: PathNode[];

  /**
   * The path of active nodes that the transition is retaining.
   *
   * These nodes are neither exited, nor entered.
   * Before and after the transition is successful, these nodes are active.
   */
  retained: PathNode[];

  /**
   * The path of previously active nodes that the transition is exiting.
   *
   * After the Transition is successful, these nodes are no longer active.
   *
   * Note that a state that is being reloaded (due to parameter values changing, or `reload: true`) may be in both the
   * `exiting` and `entering` paths.
   */
  exiting: PathNode[];

  /**
   * The path of nodes that the transition is entering.
   *
   * After the Transition is successful, these nodes will be active.
   * Because they are entering, they have their resolves fetched, `onEnter` hooks run, and their views
   * (component(s) or controller(s)+template(s)) refreshed.
   *
   * Note that a state that is reloaded (due to parameter values changing, or `reload: true`) may be in both the
   * `exiting` and `entering` paths.
   */
  entering: PathNode[];
}

export type IErrorHandler = (error: Error) => void;

export type IHookGetter = (hookName: string) => IEventHook[];
export type IHookRegistration = (matchCriteria: HookMatchCriteria, callback: HookFn, options?: HookRegOptions) => Function;

/**
 * The signature for Transition Hooks.
 *
 * Transition hooks are callback functions that hook into the lifecycle of transitions.
 * As a transition runs, it reaches certain lifecycle events.
 * As each event occurs, the hooks which are registered for the event are called (in priority order).
 *
 * A transition hook may alter a Transition by returning a [[HookResult]].
 *
 * @param transition the current [[Transition]]
 * @param injector (for ng1 or ng2 only) the injector service
 *
 * @returns a [[HookResult]] which may alter the transition
 *
 * @see
 *
 * - [[IHookRegistry.onBefore]]
 * - [[IHookRegistry.onStart]]
 * - [[IHookRegistry.onFinish]]
 * - [[IHookRegistry.onSuccess]]
 * - [[IHookRegistry.onError]]
 */
export interface TransitionHookFn {
  (transition: Transition) : HookResult
}

/**
 * The signature for Transition State Hooks.
 *
 * A function which hooks into a lifecycle event for a specific state.
 *
 * Transition State Hooks are callback functions that hook into the lifecycle events of specific states during a transition.
 * As a transition runs, it may exit some states, retain (keep) states, and enter states.
 * As each lifecycle event occurs, the hooks which are registered for the event and that state are called (in priority order).
 *
 * @param transition the current [[Transition]]
 * @param state the [[State]] that the hook is bound to
 * @param injector (for ng1 or ng2 only) the injector service
 *
 * @returns a [[HookResult]] which may alter the transition
 *
 * @see
 *
 * - [[IHookRegistry.onExit]]
 * - [[IHookRegistry.onRetain]]
 * - [[IHookRegistry.onEnter]]
 */
export interface TransitionStateHookFn {
  (transition: Transition, state: State) : HookResult
}

export type HookFn = (TransitionHookFn|TransitionStateHookFn);

/**
 * The return value of a [[TransitionHookFn]] or [[TransitionStateHookFn]]
 *
 * When returned from a [[TransitionHookFn]] or [[TransitionStateHookFn]], these values alter the running [[Transition]]:
 *
 * - `false`: the transition will be cancelled.
 * - [[TargetState]]: the transition will be redirected to the new target state (see: [[StateService.target]])
 * - `Promise`: the transition will wait for the promise to resolve or reject
 *    - If the promise is rejected (or resolves to `false`), the transition will be cancelled
 *    - If the promise resolves to a [[TargetState]], the transition will be redirected
 *    - If the promise resolves to anything else, the transition will resume
 * - Anything else: the transition will resume
 */
export type HookResult = (boolean | TargetState | void | Promise<boolean|TargetState|void>);

/**
 * These options may be provided when registering a Transition Hook (such as `onStart`)
 */
export interface HookRegOptions {
  /**
   * Sets the priority of the registered hook
   *
   * Hooks of the same type (onBefore, onStart, etc) are invoked in priority order.  A hook with a higher priority
   * is invoked before a hook with a lower priority.
   *
   * The default hook priority is 0
   */
  priority?: number;

  /**
   * Specifies what `this` is bound to during hook invocation.
   */
  bind?: any;
}

/**
 * This interface specifies the api for registering Transition Hooks.  Both the
 * [[TransitionService]] and also the [[Transition]] object itself implement this interface.
 * Note: the Transition object only allows hooks to be registered before the Transition is started.
 */
export interface IHookRegistry {
  /**
   * Registers a [[TransitionHookFn]], called *before a transition starts*.
   *
   * Registers a transition lifecycle hook, which is invoked before a transition even begins.
   * This hook can be useful to implement logic which prevents a transition from even starting, such
   * as authentication, redirection
   *
   * See [[TransitionHookFn]] for the signature of the function.
   *
   * The [[HookMatchCriteria]] is used to determine which Transitions the hook should be invoked for.
   * To match all Transitions, use an empty criteria object `{}`.
   *
   * ### Lifecycle
   *
   * `onBefore` hooks are invoked *before a Transition starts*.
   * No resolves have been fetched yet.
   * Each `onBefore` hook is invoked synchronously, in the same call stack as [[StateService.transitionTo]].
   * The registered `onBefore` hooks are invoked in priority order.
   *
   * Note: during the `onBefore` phase, additional hooks can be added to the specific [[Transition]] instance.
   * These "on-the-fly" hooks only affect the currently running transition..
   *
   * ### Return value
   *
   * The hook's return value can be used to pause, cancel, or redirect the current Transition.
   * See [[HookResult]] for more information.
   *
   * If any hook modifies the transition *synchronously* (by throwing, returning `false`, or returning
   * a [[TargetState]]), the remainder of the hooks are skipped.
   * If a hook returns a promise, the remainder of the `onBefore` hooks are still invoked synchronously.
   * All promises are resolved, and processed asynchronously before the `onStart` phase of the Transition.
   *
   * ### Examples
   *
   * #### Default Substate
   *
   * This example redirects any transition from 'home' to 'home.dashboard'.  This is commonly referred to as a
   * "default substate".
   *
   * @example
   * ```js
   * // ng2
   * transitionService.onBefore({ to: 'home' }, (trans: Transition) =>
   *     trans.router.stateService.target("home.dashboard"));
   * ```
   *
   * #### Data Driven Default Substate
   *
   * This example provides data-driven default substate functionality. It matches on a transition to any state
   * which has `defaultSubstate: "some.sub.state"` defined.  See: [[Transition.to]] which returns the "to state"
   * definition.
   *
   * @example
   * ```js
   * // ng1
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
   *
   * $transitions.onBefore(criteria, function(trans: Transition) {
   *   var substate = trans.to().defaultSubstate;
   *   return trans.router.stateService.target(substate);
   * });
   * ```
   *
   *
   * #### Require authentication
   *
   * This example cancels a transition to a state which requires authentication, if the user is not currently authenticated.
   *
   * This example assumes a state tree where all states which require authentication are children of a parent `'requireauth'` state.
   * This example assumes `MyAuthService` synchronously returns a boolean from `isAuthenticated()`.
   *
   * @example
   * ```js
   * // ng1
   * $transitions.onBefore( { to: 'requireauth.**' }, function(trans) {
   *   var myAuthService = trans.injector().get('MyAuthService');
   *   // If isAuthenticated returns false, the transition is cancelled.
   *   return myAuthService.isAuthenticated();
   * });
   * ```
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be invoked.
   * @returns a function which deregisters the hook.
   */
  onBefore(matchCriteria: HookMatchCriteria, callback: TransitionHookFn, options?: HookRegOptions): Function;

  /**
   * Registers a [[TransitionHookFn]], called when a transition starts.
   *
   * Registers a transition lifecycle hook, which is invoked as a transition starts running.
   * This hook can be useful to perform some asynchronous action before completing a transition.
   *
   * See [[TransitionHookFn]] for the signature of the function.
   *
   * The [[HookMatchCriteria]] is used to determine which Transitions the hook should be invoked for.
   * To match all Transitions, use an empty criteria object `{}`.
   *
   * ### Lifecycle
   *
   * `onStart` hooks are invoked asynchronously when the Transition starts running.
   * This happens after the `onBefore` phase is complete.
   * At this point, the Transition has not yet exited nor entered any states.
   * The registered `onStart` hooks are invoked in priority order.
   *
   * Note: A built-in `onStart` hook with high priority is used to fetch any eager resolve data.
   *
   * ### Return value
   *
   * The hook's return value can be used to pause, cancel, or redirect the current Transition.
   * See [[HookResult]] for more information.
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
   * ```js
   * // ng1
   * $transitions.onStart( { to: 'auth.**' }, function(trans) {
   *   var $state = trans.router.stateService;
   *   var MyAuthService = trans.injector().get('MyAuthService');
   *
   *   // If the user is not authenticated
   *   if (!MyAuthService.isAuthenticated()) {
   *
   *     // Then return a promise for a successful login.
   *     // The transition will wait for this promise to settle
   *
   *     return MyAuthService.authenticate().catch(function() {
   *
   *       // If the authenticate() method failed for whatever reason,
   *       // redirect to a 'guest' state which doesn't require auth.
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
  onStart(matchCriteria: HookMatchCriteria, callback: TransitionHookFn, options?: HookRegOptions): Function;

  /**
   * Registers a [[TransitionStateHookFn]], called when a specific state is entered.
   *
   * Registers a lifecycle hook, which is invoked (during a transition) when a specific state is being entered.
   *
   * Since this hook is run only when the specific state is being *entered*, it can be useful for
   * performing tasks when entering a submodule/feature area such as initializing a stateful service, 
   * or for guarding access to a submodule/feature area.
   *
   * See [[TransitionStateHookFn]] for the signature of the function.
   *
   * The [[HookMatchCriteria]] is used to determine which Transitions the hook should be invoked for.
   * `onEnter` hooks generally specify `{ entering: 'somestate' }`.
   * To match all Transitions, use an empty criteria object `{}`.
   *
   * ### Lifecycle
   *
   * `onEnter` hooks are invoked when the Transition is entering a state.
   * States are entered after the `onRetain` phase is complete.
   * If more than one state is being entered, the parent state is entered first.
   * The registered `onEnter` hooks for a state are invoked in priority order.
   *
   * Note: A built-in `onEnter` hook with high priority is used to fetch lazy resolve data for states being entered.
   *
   * ### Return value
   *
   * The hook's return value can be used to pause, cancel, or redirect the current Transition.
   * See [[HookResult]] for more information.
   *
   * ### Inside a state declaration
   *
   * Instead of registering `onEnter` hooks using the [[TransitionService]], you may define an `onEnter` hook
   * directly on a state declaration (see: [[StateDeclaration.onEnter]]).
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
   * $transitions.onEnter({ entering: 'admin' }, function(transition, state) {
   *   var AuditService = trans.injector().get('AuditService');
   *   AuditService.log("Entered " + state.name + " module while transitioning to " + transition.to().name);
   * }
   * ```
   *
   * #### Audit Log (inside a state declaration)
   *
   * The `onEnter` inside this state declaration is syntactic sugar for the previous Audit Log example.
   * ```
   * {
   *   name: 'admin',
   *   component: 'admin',
   *   onEnter: function($transition$, $state$) {
   *     var AuditService = $transition$.injector().get('AuditService');
   *     AuditService.log("Entered " + state.name + " module while transitioning to " + transition.to().name);
   *   }
   * }
   * ```
   *
   * Note: A state declaration's `onEnter` function is injected for Angular 1 only.
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onEnter(matchCriteria: HookMatchCriteria, callback: TransitionStateHookFn, options?: HookRegOptions): Function;

  /**
   * Registers a [[TransitionStateHookFn]], called when a specific state is retained/kept.
   *
   * Registers a lifecycle hook, which is invoked (during a transition) for
   * a specific state that was previously active and is not being entered nor exited.
   * 
   * Since this hook is invoked when a transition is when the state is kept, it means the transition
   * is coming *from* a substate of the kept state *to* a substate of the kept state.  
   * This hook can be used to perform actions when the user moves from one substate to another, such as
   * between steps in a wizard.
   *
   * The [[HookMatchCriteria]] is used to determine which Transitions the hook should be invoked for.
   * `onRetain` hooks generally specify `{ retained: 'somestate' }`.
   * To match all Transitions, use an empty criteria object `{}`.
   *
   * ### Lifecycle
   *
   * `onRetain` hooks are invoked after any `onExit` hooks have been fired.
   * If more than one state is retained, the child states' `onRetain` hooks are invoked first.
   * The registered `onRetain` hooks for a state are invoked in priority order.
   *
   * ### Return value
   *
   * The hook's return value can be used to pause, cancel, or redirect the current Transition.
   * See [[HookResult]] for more information.
   *
   * ### Inside a state declaration
   *
   * Instead of registering `onRetain` hooks using the [[TransitionService]], you may define an `onRetain` hook
   * directly on a state declaration (see: [[StateDeclaration.onRetain]]).
   *
   * Note: A state declaration's `onRetain` function is injected for Angular 1 only.
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onRetain(matchCriteria: HookMatchCriteria, callback: TransitionStateHookFn, options?: HookRegOptions): Function;

  /**
   * Registers a [[TransitionStateHookFn]], called when a specific state is exited.
   *
   * Registers a lifecycle hook, which is invoked (during a transition) when a specific state is being exited.
   *
   * Since this hook is run only when the specific state is being *exited*, it can be useful for
   * performing tasks when leaving a submodule/feature area such as cleaning up a stateful service, 
   * or for preventing the user from leaving a state or submodule until some criteria is satisfied.
   *
   * See [[TransitionStateHookFn]] for the signature of the function.
   *
   * The [[HookMatchCriteria]] is used to determine which Transitions the hook should be invoked for.
   * `onExit` hooks generally specify `{ exiting: 'somestate' }`.
   * To match all Transitions, use an empty criteria object `{}`.
   *
   * ### Lifecycle
   *
   * `onExit` hooks are invoked when the Transition is exiting a state.
   * States are exited after any `onStart` phase is complete.
   * If more than one state is being exited, the child states are exited first.
   * The registered `onExit` hooks for a state are invoked in priority order.
   *
   * ### Return value
   *
   * The hook's return value can be used to pause, cancel, or redirect the current Transition.
   * See [[HookResult]] for more information.
   *
   * ### Inside a state declaration
   *
   * Instead of registering `onExit` hooks using the [[TransitionService]], you may define an `onExit` hook
   * directly on a state declaration (see: [[StateDeclaration.onExit]]).
   *
   * Note: A state declaration's `onExit` function is injected for Angular 1 only.
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onExit(matchCriteria: HookMatchCriteria, callback: TransitionStateHookFn, options?: HookRegOptions): Function;

  /**
   * Registers a [[TransitionHookFn]], called *just before a transition finishes*.
   *
   * Registers a transition lifecycle hook, which is invoked just before a transition finishes.
   * This hook is a last chance to cancel or redirect a transition.
   *
   * See [[TransitionHookFn]] for the signature of the function.
   *
   * The [[HookMatchCriteria]] is used to determine which Transitions the hook should be invoked for.
   * To match all Transitions, use an empty criteria object `{}`.
   *
   * ### Lifecycle
   *
   * `onFinish` hooks are invoked after the `onEnter` phase is complete.
   * These hooks are invoked just before the transition is "committed".
   * Each hook is invoked in priority order.
   *
   * ### Return value
   *
   * The hook's return value can be used to pause, cancel, or redirect the current Transition.
   * See [[HookResult]] for more information.
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onFinish(matchCriteria: HookMatchCriteria, callback: TransitionHookFn, options?: HookRegOptions): Function;

  /**
   * Registers a [[TransitionHookFn]], called after a successful transition completed.
   *
   * Registers a transition lifecycle hook, which is invoked after a transition successfully completes.
   *
   * See [[TransitionHookFn]] for the signature of the function.
   *
   * The [[HookMatchCriteria]] is used to determine which Transitions the hook should be invoked for.
   * To match all Transitions, use an empty criteria object `{}`.
   *
   * ### Lifecycle
   *
   * `onSuccess` hooks are chained off the Transition's promise (see [[Transition.promise]]).
   * If the Transition is successful and its promise is resolved, then the `onSuccess` hooks are invoked.
   * Since these hooks are run after the transition is over, their return value is ignored.
   * The `onSuccess` hooks are invoked in priority order.
   *
   * ### Return value
   *
   * Since the Transition is already completed, the hook's return value is ignored
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onSuccess(matchCriteria: HookMatchCriteria, callback: TransitionHookFn, options?: HookRegOptions): Function;

  /**
   * Registers a [[TransitionHookFn]], called after a transition has errored.
   *
   * Registers a transition lifecycle hook, which is invoked after a transition has been rejected for any reason.
   *
   * See [[TransitionHookFn]] for the signature of the function.
   *
   * The [[HookMatchCriteria]] is used to determine which Transitions the hook should be invoked for.
   * To match all Transitions, use an empty criteria object `{}`.
   *
   * ### Lifecycle
   *
   * The `onError` hooks are chained off the Transition's promise (see [[Transition.promise]]).
   * If a Transition fails, its promise is rejected and the `onError` hooks are invoked.
   * The `onError` hooks are invoked in priority order.
   *
   * Since these hooks are run after the transition is over, their return value is ignored.
   *
   * A transition "errors" if it was started, but failed to complete (for any reason).
   * A *non-exhaustive list* of reasons a transition can error:
   *
   * - A transition was cancelled because a new transition started while it was still running
   * - A transition was cancelled by a Transition Hook returning false
   * - A transition was redirected by a Transition Hook returning a [[TargetState]]
   * - A transition was invalid because the target state/parameters are not valid
   * - A transition was ignored because the target state/parameters are exactly the current state/parameters
   * - A Transition Hook or resolve function threw an error
   * - A Transition Hook returned a rejected promise
   * - A resolve function returned a rejected promise
   *
   * To check the failure reason, inspect the return value of [[Transition.error]].
   * 
   * Note: `onError` should be used for targeted error handling, or error recovery.
   * For simple catch-all error reporting, use [[StateService.defaultErrorHandler]].
   *
   * ### Return value
   *
   * Since the Transition is already completed, the hook's return value is ignored
   *
   * @param matchCriteria defines which Transitions the Hook should be invoked for.
   * @param callback the hook function which will be injected and invoked.
   * @returns a function which deregisters the hook.
   */
  onError(matchCriteria: HookMatchCriteria, callback: TransitionHookFn, options?: HookRegOptions): Function;

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

/** A predicate type which takes a [[State]] and returns a boolean */
export type IStateMatch = Predicate<State>
/**
 * This object is used to configure whether or not a Transition Hook is invoked for a particular transition,
 * based on the Transition's "to state" and "from state".
 *
 * Each property (`to`, `from`, `exiting`, `retained`, and `entering`) can be a state [[Glob]] string,
 * a boolean, or a function that takes a state and returns a boolean (see [[HookMatchCriterion]])
 *
 * All properties are optional.  If any property is omitted, it is replaced with the value `true`, and always matches.
 * To match any transition, use an empty criteria object `{}`.
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
 *
 * @example
 * ```js
 *
 * // This matches a transition that is exiting `parent.child`
 * var match = {
 *   exiting: 'parent.child'
 * }
 * ```
 */
export interface HookMatchCriteria {
  /** A [[HookMatchCriterion]] to match the destination state */
  to?: HookMatchCriterion;
  /** A [[HookMatchCriterion]] to match the original (from) state */
  from?: HookMatchCriterion;
  /** A [[HookMatchCriterion]] to match any state that would be exiting */
  exiting?: HookMatchCriterion;
  /** A [[HookMatchCriterion]] to match any state that would be retained */
  retained?: HookMatchCriterion;
  /** A [[HookMatchCriterion]] to match any state that would be entering */
  entering?: HookMatchCriterion;
}

export interface IMatchingNodes {
  [key: string]: PathNode[];
  to: PathNode[];
  from: PathNode[];
  exiting: PathNode[];
  retained: PathNode[];
  entering: PathNode[];
}

/**
 * Hook Criterion used to match a transition.
 *
 * A [[Glob]] string that matches the name of a state.
 *
 * Or, a function with the signature `function(state) { return matches; }`
 * which should return a boolean to indicate if a state matches.
 *
 * Or, `true` to always match
 */
export type HookMatchCriterion = (string|IStateMatch|boolean)

/** @hidden */
export interface IEventHook {
  callback: HookFn;
  priority?: number;
  bind?: any;
  matches:  (treeChanges: TreeChanges) => IMatchingNodes;
  _deregistered: boolean;
}