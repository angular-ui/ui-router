/** @module state */ /** for typedoc */
import {extend, find, tail} from "../../common/common";
import {propEq} from "../../common/hof";

import {ResolvePolicy} from "../../resolve/interface";

import {Transition} from "../../transition/transition";
import {val} from "../../common/hof";


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

    /** a function which resolves any EAGER Resolvables for a Path */
    (<any> $eagerResolvePath).$inject = ['$transition$'];
    function $eagerResolvePath($transition$) {
      return tail(<any[]> treeChanges.to).resolveContext.resolvePath(extend({ transition: $transition$ }, { resolvePolicy: EAGER }));
    }

    /** Returns a function which pre-resolves any LAZY Resolvables for a Node in a Path */
    (<any> $lazyResolveEnteringState).$inject = ['$state$', '$transition$'];
    function $lazyResolveEnteringState($state$, $transition$) {
      let node = find(<any[]> treeChanges.entering, propEq('state', $state$));
      return node.resolveContext.resolvePathElement(node.state, extend({transition: $transition$}, { resolvePolicy: LAZY }));
    }

    // Resolve eager resolvables before when the transition starts
    this.transition.onStart({}, $eagerResolvePath, { priority: 1000 });
    // Resolve lazy resolvables before each state is entered
    this.transition.onEnter({ entering: val(true) }, $lazyResolveEnteringState, { priority: 1000 });
  }
}
