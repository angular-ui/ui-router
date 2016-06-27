/** @module state */ /** for typedoc */
import {TransitionStateHookFn} from "../transition/interface";
import {State} from "../state/stateObject";
import {Transition} from "../transition/transition";

export function makeEnterExitRetainHook(hookName: string): TransitionStateHookFn {
    return (transition: Transition, state: State) =>
        state[hookName](transition, state);
}
