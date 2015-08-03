import {IStateDeclaration, IState} from "../state/interface"
import {Transition} from "./transition"
import {ITransPath} from "../resolve/interface"

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


export interface ITreeChanges {
  from: ITransPath;
  to: ITransPath;
  retained: ITransPath;
  entering: ITransPath;
  exiting: ITransPath;
}
