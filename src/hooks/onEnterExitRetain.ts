/** @module state */ /** for typedoc */
import {TransitionStateHookFn} from "../transition/interface";
import {UIRInjector} from "../common/interface";
import {State} from "../state/stateObject";
import {Transition} from "../transition/transition";

export function makeEnterExitRetainHook(hookName: string): TransitionStateHookFn {
    return (transition: Transition, injector: UIRInjector, state: State) =>
        state[hookName](transition, injector, state);
}
