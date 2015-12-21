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
   * You can define your own Transition Options inside this property and use them, e.g., from a [[TransitionHook]]
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
export type IHookRegistration = (matchObject: IMatchCriteria, callback: IInjectable, options?) => Function;

export interface IHookRegistry {
  onBefore:   IHookRegistration;
  onStart:    IHookRegistration;
  onEnter:    IHookRegistration;
  onRetain:   IHookRegistration;
  onExit:     IHookRegistration;
  onFinish:   IHookRegistration;
  onSuccess:  IHookRegistration;
  onError:    IHookRegistration;

  getHooks:   IHookGetter;
}

export type IStateMatch = Predicate<State>
export interface IMatchCriteria {
  to?: (string|IStateMatch);
  from?: (string|IStateMatch);
}

export interface IEventHook {
  callback: IInjectable;
  priority: number;
  matches:  (a: State, b: State) => boolean;
}