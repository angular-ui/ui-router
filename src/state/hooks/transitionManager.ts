import {IPromise, IQService} from "angular";
import {copy, prop} from "../../common/common";
import Queue from "../../common/queue";

import {ITreeChanges} from "../../transition/interface";
import {Transition} from "../../transition/transition";
import {TransitionRejection, RejectType} from "../../transition/rejectFactory";

import {IStateService, IStateDeclaration} from "../interface";
import ViewHooks from "./viewHooks";
import EnterExitHooks from "./enterExitHooks";
import ResolveHooks from "./resolveHooks";

/**
 * This class takes a blank transition object and adds all the hooks necessary for it to behave like a state transition
 *
 * * Chains to the transition promise, adding state lifecycle hooks:
 *   * on promise resolve: update global state such as "active transitions" and "current state/params"
 *   * on promise rejection: handles ignored transition (as dynamic), and transition redirect (starts new transition)
 *
 * * Registers view hooks, which maintain the list of active view configs and sync with/update the ui-views
 *
 * * Registers onEnter/onRetain/onExit hooks which delegate to the state's hooks of the same name, at the appropriate time
 *
 * * Registers eager and lazy resolve hooks
 */
export default class TransitionManager {
  private treeChanges: ITreeChanges;
  private enterExitHooks: EnterExitHooks;
  private viewHooks: ViewHooks;
  private resolveHooks: ResolveHooks;

  constructor(
      private transition: Transition,
      private $transitions,
      private $urlRouter,
      private $view, // service
      private $state: IStateService,
      private $stateParams, // service/obj
      private $q: IQService, // TODO: get from runtime.$q
      private activeTransQ: Queue<Transition>,
      private changeHistory: Queue<ITreeChanges>
  ) {
    this.viewHooks = new ViewHooks(transition, $view);
    this.enterExitHooks = new EnterExitHooks(transition);
    this.resolveHooks = new ResolveHooks(transition);

    this.treeChanges = transition.treeChanges();
  }

  runTransition(): IPromise<any> {
    let stateHooks = this;
    this.activeTransQ.clear();  // TODO: nuke this
    this.activeTransQ.enqueue(this.transition);
    const $removeFromActiveQ = () => this.activeTransQ.remove(this.transition);
    function $handleError($error$) { return stateHooks.transitionFailure($error$); }

    return this.transition.run().catch($handleError).finally($removeFromActiveQ);
  }

  transitionSuccess() {
    let {treeChanges, transition, $state, activeTransQ, changeHistory} = this;

    // Update globals in $state
    $state.$current = transition.$to();
    $state.current = $state.$current.self;
    this.updateStateParams();
    activeTransQ.remove(transition);
    changeHistory.enqueue(treeChanges);

    return transition;
  }

  transitionFailure(error): (IStateDeclaration|IPromise<any>) {
    let {transition, $transitions, $urlRouter, $view, $state, $stateParams, $q, activeTransQ, changeHistory} = this;
    activeTransQ.remove(transition);
    // Handle redirect and abort
    if (error instanceof TransitionRejection) {
      if (error.type === RejectType.IGNORED) {
        // Update $stateParmas/$state.params/$location.url if transition ignored, but dynamic params have changed.
        if (!$state.$current.params.$$filter(prop('dynamic')).$$equals($stateParams, transition.params())) {
          this.updateStateParams();
        }
        return $state.current;
      }

      if (error.type === RejectType.SUPERSEDED) {
        if (error.redirected && error.detail instanceof Transition) {
          let redirect = error.detail;

          let tMgr = new TransitionManager(redirect, $transitions, $urlRouter, $view, $state, $stateParams, $q, activeTransQ, changeHistory);
          tMgr.registerHooks();
          return tMgr.runTransition();
        }
      }
    }

    return $q.reject(error);
  }

  updateStateParams() {
    let {transition, $urlRouter, $state, $stateParams} = this;
    let options = transition.options();
    $state.params = transition.params();
    copy($state.params, $stateParams);
    $stateParams.$sync().$off();

    if (options.location && $state.$current.navigable) {
      $urlRouter.push($state.$current.navigable.url, $stateParams, { replace: options.location === 'replace' });
    }

    $urlRouter.update(true);
  }

  registerHooks() {
    this.registerDefaultErrorHandler();
    this.registerTransitionSuccess();

    this.viewHooks.registerHooks();
    this.enterExitHooks.registerHooks();
    this.resolveHooks.registerHooks();
  }

  registerDefaultErrorHandler() {
    this.transition.onError({}, this.$transitions.defaultErrorHandler());
  }

  registerTransitionSuccess() {
    let self = this;
    // Commit global state data as the last hook in the transition (using a very low priority onFinish hook)
    function $commitGlobalData() { self.transitionSuccess(); }
    this.transition.onFinish({}, $commitGlobalData, {priority: -10000});
  }
}
