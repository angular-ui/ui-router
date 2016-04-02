/** @module state */ /** for typedoc */
import {prop} from "../../common/hof";
import {Param} from "../../params/param";

import {TreeChanges} from "../../transition/interface";
import {Transition} from "../../transition/transition";
import {TransitionRejection, RejectType} from "../../transition/rejectFactory";

import {StateDeclaration} from "../interface";
import {StateService} from "../stateService";
import {TargetState} from "../targetState";
import {ViewHooks} from "./viewHooks";
import {EnterExitHooks} from "./enterExitHooks";
import {ResolveHooks} from "./resolveHooks";
import {UrlRouter} from "../../url/urlRouter";
import {services} from "../../common/coreservices";
import {UIRouterGlobals} from "../../globals";

/**
 * This class:
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
  private treeChanges: TreeChanges;
  private enterExitHooks: EnterExitHooks;
  private viewHooks: ViewHooks;
  private resolveHooks: ResolveHooks;
  private $q;

  constructor(
      private transition: Transition,
      private $transitions,
      private $urlRouter: UrlRouter,
      private $view, // service
      private $state: StateService,
      private globals: UIRouterGlobals
  ) {
    this.$q = services.$q;
    this.viewHooks = new ViewHooks(transition, $view);
    this.enterExitHooks = new EnterExitHooks(transition);
    this.resolveHooks = new ResolveHooks(transition);

    this.treeChanges = transition.treeChanges();

    this.registerUpdateGlobalState();
    this.viewHooks.registerHooks();
    this.enterExitHooks.registerHooks();
    this.resolveHooks.registerHooks();
  }

  runTransition(): Promise<any> {
    this.globals.transitionHistory.enqueue(this.transition);
    return this.transition.run()
        .then((trans: Transition) => trans.to()) // resolve to the final state (TODO: good? bad?)
        .catch(error => this.transRejected(error)); // if rejected, handle dynamic and redirect
  }

  registerUpdateGlobalState() {
    // After globals.current is updated at priority: 10000
    this.transition.onSuccess({}, this.updateUrl.bind(this), {priority: 9999});
  }

  transRejected(error): (StateDeclaration|Promise<any>) {
    let {transition, $state, $q} = this;
    // Handle redirect and abort
    if (error instanceof TransitionRejection) {
      if (error.type === RejectType.IGNORED) {
        // Update $stateParmas/$state.params/$location.url if transition ignored, but dynamic params have changed.
        let dynamic = $state.$current.parameters().filter(prop('dynamic'));
        if (!Param.equals(dynamic, $state.params, transition.params())) {
          this.updateUrl();
        }
        return $state.current;
      }

      if (error.type === RejectType.SUPERSEDED && error.redirected && error.detail instanceof TargetState) {
        return this._redirectMgr(transition.redirect(error.detail)).runTransition();
      }

      if (error.type === RejectType.ABORTED) {
        this.$urlRouter.update();
      }
    }

    this.$transitions.defaultErrorHandler()(error);

    return $q.reject(error);
  }

  updateUrl() {
    let transition = this.transition;
    let {$urlRouter, $state} = this;
    let options = transition.options();
    var toState = transition.$to();

    if (options.location && $state.$current.navigable) {
      $urlRouter.push($state.$current.navigable.url, $state.params, { replace: options.location === 'replace' });
    }
    $urlRouter.update(true);
  }

  private _redirectMgr(redirect: Transition): TransitionManager {
    let {$transitions, $urlRouter, $view, $state, globals} = this;
    return new TransitionManager(redirect, $transitions, $urlRouter, $view, $state, globals);
  }
}
