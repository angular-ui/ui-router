/** @module state */ /** for typedoc */
import {noop} from "../../common/common";

import {ResolvePolicy} from "../../resolve/interface";

import {Transition} from "../../transition/transition";
import {val} from "../../common/hof";
import {State} from "../stateObject";
import {ResolveContext} from "../../resolve/resolveContext";


let LAZY = ResolvePolicy[ResolvePolicy.LAZY];
let EAGER = ResolvePolicy[ResolvePolicy.EAGER];

/**
 * Registers Eager and Lazy (for entering states) resolve hooks
 *
 * * registers a hook that resolves EAGER resolves, for the To Path, onStart of the transition
 * * registers a hook that resolves LAZY resolves, for each state, before it is entered
 */
export class ResolveHooks {
  constructor(private transition: Transition) { }

  registerHooks() {
    let treeChanges = this.transition.treeChanges();
    let resolveContext = new ResolveContext(treeChanges.to);

    /** a function which resolves any EAGER Resolvables for a Path */
    function $eagerResolvePath($transition$: Transition) {
      var options = { transition: $transition$, resolvePolicy: EAGER };
      return resolveContext.resolvePath(options).then(noop);
    }

    /** Returns a function which pre-resolves any LAZY Resolvables for a [[PathNode]] in a Path */
    function $lazyResolveEnteringState(transition: Transition, injector, state: State) {
      // A new Resolvable contains all the resolved data in this context as a single object, for injection as `$resolve$`
      let context = resolveContext.isolateRootTo(state);
      var options = { transition: transition, resolvePolicy: LAZY };

      // Resolve all the LAZY resolves
      return context.resolvePath(options).then(noop);
    }

    // Resolve eager resolvables before when the transition starts
    this.transition.onStart({}, <any> $eagerResolvePath, { priority: 1000 });
    // Resolve lazy resolvables before each state is entered
    this.transition.onEnter({ entering: val(true) }, <any> $lazyResolveEnteringState, { priority: 1000 });
  }
}
