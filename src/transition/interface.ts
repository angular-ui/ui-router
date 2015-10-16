import {State} from "../state/state";
import {IStateDeclaration} from "../state/interface";
import TargetState from "../state/targetState";
import Node from "../path/node";

import {IInjectable, Predicate} from "../common/common";

import {Transition} from "./transition";

export interface ITransitionOptions {
  location    ?: (boolean|string);
  relative    ?: (string|IStateDeclaration|State);
  inherit     ?: boolean;
  notify      ?: boolean;
  reload      ?: (boolean|string|IStateDeclaration|State);
  reloadState ?: (State);
  custom      ?: any;
  previous    ?: Transition;
  current     ?: () => Transition;
}

export interface ITransitionHookOptions {
  async               ?: boolean;
  rejectIfSuperseded  ?: boolean;
  current             ?: () => Transition;  //path?
  transition          ?: Transition;
  hookType            ?: string;
  target              ?: any;
  traceData           ?: any;
}

export interface ITreeChanges {
  [key: string]: Node[];
  from:          Node[];
  to:            Node[];
  retained:      Node[];
  entering:      Node[];
  exiting:       Node[];
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