import {IStateDeclaration, IState} from "../state/interface";
import TargetState from "../state/targetState";

import {ITransPath} from "../path/interface";

import {IInjectable} from "../common/common";

import {Transition} from "./transition";

export interface ITransitionDestination {
  ref: TargetState;
  options: ITransitionOptions;
}

export interface ITransitionOptions {
  location    ?: (boolean|string);
  relative    ?: (string|IStateDeclaration|IState);
  inherit     ?: boolean;
  notify      ?: boolean;
  reload      ?: (boolean|string|IStateDeclaration|IState);
  reloadState ?: (IState);
  trace       ?: boolean;
  custom      ?: any;
  previous    ?: Transition;
  current     ?: () => Transition;
}


export interface ITransitionHookOptions {
  async               ?: boolean;
  rejectIfSuperseded  ?: boolean;
  current             ?: () => Transition;  //path?
  transition          ?: Transition;
  trace               ?: boolean;
  hookType            ?: string;
  target              ?: any;
  data                ?: any;
}

export interface ITreeChanges {
  [key: string]: ITransPath;
  from:     ITransPath;
  to:       ITransPath;
  retained: ITransPath;
  entering: ITransPath;
  exiting:  ITransPath;
}

export type IErrorHandler = (error: Error) => void;

export interface ITransitionService extends IHookRegistry {
  create: (fromPath: ITransPath, targetState: TargetState) => Transition;
  defaultErrorHandler: (handler?: IErrorHandler) => IErrorHandler;
}

export type IHookGetter = (hookName: string) => IEventHook[];
export type IHookRegistration = (matchObject: IMatchCriteria, callback: IInjectable, options?) => Function;
export interface IHookRegistry {
  onBefore:   IHookRegistration;
  onStart:    IHookRegistration;
  onEnter:    IHookRegistration;
  onExit:     IHookRegistration;
  onSuccess:  IHookRegistration;
  onError:    IHookRegistration;

  getHooks:   IHookGetter;
}

export interface IStateMatch {
  (IState): boolean;
}
export interface IMatchCriteria {
  to?: (string|IStateMatch);
  from?: (string|IStateMatch);
}

export interface IEventHook {
  callback: IInjectable;
  priority: number;
  matches:  (a: IState, b: IState) => boolean;
}