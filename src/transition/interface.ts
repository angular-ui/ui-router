import {IStateDeclaration, IState} from "../state/interface"
import StateReference from "../state/stateReference"

import {IPath, IParamsPath, ITransPath} from "../path/interface"

import {IRawParams} from "../params/interface"

import {Transition} from "./transition"
import TransitionHook from "./transitionHook"

export interface ITransitionDestination {
  ref: StateReference,
  options: ITransitionOptions
}

export interface ITransitionOptions {
  location    ?: (boolean|string),
  relative    ?: (string|IStateDeclaration|IState),
  inherit     ?: boolean,
  notify      ?: boolean,
  reload      ?: (boolean|string|IStateDeclaration|IState),
  reloadState ?: (IState),
  trace       ?: boolean,
  custom      ?: any,
  previous    ?: Transition,
  current     ?: () => Transition
}


export interface ITransitionHookOptions {
  async               ?: boolean, 
  rejectIfSuperseded  ?: boolean, 
  current             ?: () => Transition,  //path?
  transition          ?: Transition, 
  trace               ?: boolean, 
  data                ?: any
}

export interface ITreeChanges {
  from: ITransPath;
  to: ITransPath;
  retained: ITransPath;
  entering: ITransPath;
  exiting: ITransPath;
}

export interface ITransitionService {
  transition: Transition,
  create: (from: ITransPath, to: IParamsPath, opts: ITransitionOptions) => Transition,
  isTransition: (Transition) => boolean,
  provider: ITransitionProvider,
  $$hooks: (string) => IEventHook[]
}


export interface ITransitionProvider {
    onBefore:   (matchObject: IMatchCriteria, callback: Function, options?) => Function,
    onStart:    (matchObject: IMatchCriteria, callback: Function, options?) => Function,
    on:         (matchObject: IMatchCriteria, callback: Function, options?) => Function,
    entering:   (matchObject: IMatchCriteria, callback: Function, options?) => Function,
    exiting:    (matchObject: IMatchCriteria, callback: Function, options?) => Function,
    onSuccess:  (matchObject: IMatchCriteria, callback: Function, options?) => Function,
    onError:    (matchObject: IMatchCriteria, callback: Function, options?) => Function
}

export interface IStateMatch {
  (IState): boolean
}
export interface IMatchCriteria {
  to?: (string|IStateMatch),
  from?: (string|IStateMatch)
}

export interface IEventHook {
  callback: () => any,
  priority: number,
  matches: (a: IState, b: IState) => boolean
}