import {IStateDeclaration, IState} from "../state/interface"

import {IPath, IParamsPath, ITransPath} from "../path/interface"

import {IRawParams} from "../params/interface"

import {Transition} from "./transition"
import TransitionHook from "./transitionHook"

export interface ITransitionOptions {
  location    ?: boolean,
  relative    ?: (boolean|IStateDeclaration|IState),
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
  create: (from: ITransPath, to: IPath, toParams: IRawParams, opts: ITransitionOptions) => Transition,
  isTransition: (Transition) => boolean,
  provider: Object,
  $$hooks: (string) => IEventHook[]
}

export interface IStateMatch {
  (IState): boolean
}
export interface IMatchCriteria {
  to: (string|IStateMatch),
  from: (string|IStateMatch)
}

export interface IEventHook {
  callback: () => any,
  priority: number,
  matches: (a, b) => boolean
}