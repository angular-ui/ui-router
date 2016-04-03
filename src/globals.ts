/** @module core */ /** */
import {StateParams} from "./params/stateParams";
import {StateDeclaration} from "./state/interface";
import {State} from "./state/stateObject";
import {Transition} from "./transition/transition";
import {Queue} from "./common/queue";
import {TransitionService} from "./transition/transitionService";
import {copy} from "./common/common";

/**
 * Global mutable state
 *
 * This is where we hold the global mutable state such as current state, current
 * params, current transition, last successful transition, last attempted transition, etc.
 */
export class UIRouterGlobals {
  /**
   * Current parameter values
   *
   * The parameter values from the latest successful transition
   */
  params: StateParams = new StateParams();
  /**
   * Current state
   *
   * The to-state from the latest successful transition
   */
  current: StateDeclaration;
  /**
   * Current state
   *
   * The to-state from the latest successful transition
   */
  $current: State;
  /**
   * The current transition (in progress)
   */
  transition: Transition;
  /**
   * The transition history
   *
   * This queue's size is limited to a maximum number (default: 1)
   */
  transitionHistory = new Queue<Transition>([], 1);
  /**
   * The history of successful transitions
   *
   * This queue's size is limited to a maximum number (default: 1)
   */
  successfulTransitions = new Queue<Transition>([], 1);

  constructor(transitionService: TransitionService) {
    const beforeNewTransition = ($transition$) => {

      this.transition = $transition$;
      this.transitionHistory.enqueue($transition$);

      const updateGlobalState = () => {
        this.successfulTransitions.enqueue($transition$);
        this.$current = $transition$.$to();
        this.current = this.$current.self;
        copy($transition$.params(), this.params);
      };

      $transition$.onSuccess({}, updateGlobalState, {priority: 10000});

      const clearCurrentTransition = () => { if (this.transition === $transition$) this.transition = null; };

      $transition$.promise.then(clearCurrentTransition, clearCurrentTransition);

    };

    transitionService.onBefore({}, ['$transition$', beforeNewTransition]);
  }
}