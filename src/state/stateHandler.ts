import {IQService} from "angular"
import {copy, prop} from "../common/common"
import Queue from "../common/queue"

import {ITreeChanges} from "../transition/interface"
import {Transition} from "../transition/transition"
import {TransitionRejection, RejectType} from "../transition/rejectFactory"

import {IStateService} from "../state/interface"

import {IResolvePath} from "../path/interface"

export default class StateHandler {
  constructor(private $urlRouter,
     private $view, // service
     private $state: IStateService,
     private $stateParams, // service/obj
     private $q: IQService,
     private activeTransQ: Queue<Transition>,
     private changeHistory: Queue<ITreeChanges>
  ) { }
  
  runTransition(transition: Transition) {
    // When the transition promise (prepromise; before callbacks) is resolved/rejected, update the $state service
    const handleSuccess = (treeChanges: ITreeChanges) => this.transitionSuccess(treeChanges, transition);
    const handleFailure = (error) => this.transitionFailure(transition, error);
    this.activeTransQ.clear();
    this.activeTransQ.enqueue(transition);
    transition.run();
    return transition.prepromise.then(handleSuccess, handleFailure);
  }

  transitionSuccess(treeChanges: ITreeChanges, transition: Transition) {
    let {$view, $state, activeTransQ, changeHistory} = this;
    // TODO: sync on entering/exiting state, not transition success?
    transition.views("exiting", "from").forEach($view.reset.bind($view));
    transition.views("entering", "to").forEach($view.registerStateViewConfig.bind($view));
    $view.sync();

    // Update globals in $state
    $state.$current = transition.$to();
    $state.current = $state.$current.self;
    this.updateStateParams(transition);
    activeTransQ.remove(transition);
    changeHistory.enqueue(treeChanges);

    return transition;
  }

  transitionFailure(transition: Transition, error) {
    let {$state, $stateParams, $q, activeTransQ} = this;
    activeTransQ.remove(transition);
    // Handle redirect and abort
    if (error instanceof TransitionRejection) {
      if (error.type === RejectType.IGNORED) {
        // Update $stateParmas/$state.params/$location.url if transition ignored, but dynamic params have changed.
        if (!$state.$current.params.$$filter(prop('dynamic')).$$equals($stateParams, transition.params())) {
          this.updateStateParams(transition);
        }
        return $state.current;
      }

      if (error.type === RejectType.SUPERSEDED) {
        //if (error.redirected && error.detail instanceof Transition) { // TODO: expose Transition class for instanceof
        if (error.redirected && error.detail instanceof Transition) {
          activeTransQ.enqueue(error.detail);
          return this.runTransition(error.detail);
        }
      }
    }

    return $q.reject(error);
  }

  updateStateParams(transition: Transition) {
    let {$urlRouter, $state, $stateParams} = this;
    var options = transition.options();
    $state.params = transition.params();
    copy($state.params, $stateParams);
    $stateParams.$sync().$off();

    if (options.location && $state.$current.navigable) {
      $urlRouter.push($state.$current.navigable.url, $stateParams, { replace: options.location === 'replace' });
    }

    $urlRouter.update(true);
  }
}
