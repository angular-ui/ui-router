/** @module state */ /** for typedoc */
import {noop} from "../common/common";
import {Transition} from "../transition/transition";
import {State} from "../state/stateObject";
import {ResolveContext} from "../resolve/resolveContext";

/** A function which resolves all EAGER Resolvables in the To Path */
export const $eagerResolvePath = (trans: Transition) =>
    new ResolveContext(trans.treeChanges().to).resolvePath("EAGER", trans).then(noop);

/** A function which resolves all LAZY Resolvables for the state (and all ancestors) in the To Path */
export const $lazyResolveState = (trans: Transition, injector, state: State) =>
    new ResolveContext(trans.treeChanges().to).subContext(state).resolvePath("LAZY", trans).then(noop);

