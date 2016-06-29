/** @module hooks */ /** for typedoc */
import {noop} from "../common/common";
import {Transition} from "../transition/transition";
import {State} from "../state/stateObject";
import {ResolveContext} from "../resolve/resolveContext";
import {TransitionStateHookFn, TransitionHookFn} from "../transition/interface";

/**
 * A [[TransitionHookFn]] which resolves all EAGER Resolvables in the To Path
 *
 * Registered using `transitionService.onStart({}, eagerResolvePath);`
 *
 * When a Transition starts, this hook resolves all the EAGER Resolvables, which the transition then waits for.
 *
 * See [[StateDeclaration.resolve]]
 */
export const eagerResolvePath: TransitionHookFn = (trans: Transition) =>
    new ResolveContext(trans.treeChanges().to)
        .resolvePath("EAGER", trans)
        .then(noop);

/**
 * A [[TransitionHookFn]] which resolves all LAZY Resolvables for the state (and all its ancestors) in the To Path
 *
 * Registered using `transitionService.onEnter({ entering: () => true }, lazyResolveState);`
 *
 * When a State is being entered, this hook resolves all the Resolvables for this state, which the transition then waits for.
 *
 * See [[StateDeclaration.resolve]]
 */
export const lazyResolveState: TransitionStateHookFn = (trans: Transition, state: State) =>
    new ResolveContext(trans.treeChanges().to)
        .subContext(state)
        .resolvePath("LAZY", trans)
        .then(noop);

