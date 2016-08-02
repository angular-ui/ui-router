/** @module hooks */ /** for typedoc */
import {TransitionStateHookFn} from "../transition/interface";
import {State} from "../state/stateObject";
import {Transition} from "../transition/transition";

/**
 * A factory which creates an onEnter, onExit or onRetain transition hook function
 *
 * The returned function invokes the (for instance) state.onEnter hook when the
 * state is being entered.
 *
 * @hidden
 */
function makeEnterExitRetainHook(hookName: string): TransitionStateHookFn {
    return (transition: Transition, state: State) => {
        let hookFn: TransitionStateHookFn = state[hookName];
        return hookFn(transition, state);
    }
}

/**
 * The [[TransitionStateHookFn]] for onExit
 *
 * When the state is being exited, the state's .onExit function is invoked.
 *
 * Registered using `transitionService.onExit({ exiting: (state) => !!state.onExit }, onExitHook);`
 *
 * See: [[IHookRegistry.onExit]]
 */
export const onExitHook: TransitionStateHookFn      = makeEnterExitRetainHook('onExit');

/**
 * The [[TransitionStateHookFn]] for onRetain
 *
 * When the state was already entered, and is not being exited or re-entered, the state's .onRetain function is invoked.
 *
 * Registered using `transitionService.onRetain({ retained: (state) => !!state.onRetain }, onRetainHook);`
 *
 * See: [[IHookRegistry.onRetain]]
 */
export const onRetainHook: TransitionStateHookFn    = makeEnterExitRetainHook('onRetain');

/**
 * The [[TransitionStateHookFn]] for onEnter
 *
 * When the state is being entered, the state's .onEnter function is invoked.
 *
 * Registered using `transitionService.onEnter({ entering: (state) => !!state.onEnter }, onEnterHook);`
 *
 * See: [[IHookRegistry.onEnter]]
 */
export const onEnterHook: TransitionStateHookFn     = makeEnterExitRetainHook('onEnter');
