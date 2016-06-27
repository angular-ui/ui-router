/** @module state */ /** for typedoc */
import {TransitionStateHookFn} from "../transition/interface";
import {UiInjector} from "../common/interface";
import {State} from "../state/stateObject";
import {Transition} from "../transition/transition";

export function makeEnterExitRetainHook(hookName: string): TransitionStateHookFn {
    return (transition: Transition, injector: UiInjector, state: State) =>
        state[hookName](transition, injector, state);
}
