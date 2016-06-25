/** @module state */ /** for typedoc */
import {Transition} from "../transition/transition";
import {Rejection, RejectType} from "../transition/rejectFactory";

import {StateDeclaration} from "../state/interface";
import {StateService} from "../state/stateService";
import {TargetState} from "../state/targetState";
import {UrlRouter} from "../url/urlRouter";
import {services} from "../common/coreservices";
import {Globals} from "../globals";
import {ViewService} from "../view/view";
import {TransitionService} from "../transition/transitionService";

/**
 * Adds the built-in UI-Router hooks to a [[Transition]]
 *
 * * Takes a blank transition object and adds all the hooks necessary for it to behave like a state transition.
 *
 * * Runs the transition, returning a chained promise which:
 *   * transforms the resolved Transition.promise to the final destination state.
 *   * manages the rejected Transition.promise, checking for Dynamic or Redirected transitions
 *
 * * Registers a handler to update global $state data such as "active transitions" and "current state/params"
 *
 * * Registers view hooks, which maintain the list of active view configs and sync with/update the ui-views
 *
 * * Registers onEnter/onRetain/onExit hooks which delegate to the state's hooks of the same name, at the appropriate time
 *
 * * Registers eager and lazy resolve hooks
 */
export class TransitionManager {
  private $q;
  private getRedirectedMgr: (redirect: Transition) => TransitionManager;

  constructor(
      private transition: Transition,
      private $transitions: TransitionService,
      private $urlRouter: UrlRouter,
      $view: ViewService,
      private $state: StateService,
      private globals: Globals
  ) {
    this.$q = services.$q;
    this.getRedirectedMgr = (redirect: Transition) =>
        new TransitionManager(redirect, $transitions, $urlRouter, $view, $state, globals);
  }

  runTransition(): Promise<any> {
    this.globals.transitionHistory.enqueue(this.transition);
    return this.transition.run()
        .then((trans: Transition) => trans.to()) // resolve to the final state (TODO: good? bad?)
        .catch(error => this.transRejected(error)); // if rejected, handle dynamic and redirect
  }

  transRejected(error): (StateDeclaration|Promise<any>) {
    // Handle redirect and abort
    if (error instanceof Rejection) {
      if (error.type === RejectType.IGNORED) {
        this.$urlRouter.update();
        return this.$state.current;
      }

      if (error.type === RejectType.SUPERSEDED && error.redirected && error.detail instanceof TargetState) {
        return this.getRedirectedMgr(this.transition.redirect(error.detail)).runTransition();
      }

      if (error.type === RejectType.ABORTED) {
        this.$urlRouter.update();
      }
    }

    this.$transitions.defaultErrorHandler()(error);

    return this.$q.reject(error);
  }
}
