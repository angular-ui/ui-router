import {TransitionRejection, RejectType} from "../transition/rejectFactory";
import {Transition} from "../transition/transition";
import {copy, prop} from "../common/common";

export default class StateHandler {
  constructor(private $urlRouter, private $view, private $state, private $stateParams, private $q, private transQueue) {
    
  } 
  
  runTransition(transition) {
    // When the transition promise (prepromise; before callbacks) is resolved/rejected, update the $state service
    const handleSuccess = () => this.transitionSuccess(transition)
    const handleFailure = (error) => this.transitionFailure(transition, error)
    transition.run();
    return transition.prepromise.then(handleSuccess, handleFailure);
  };

  transitionSuccess(transition) {
    let {$view, $state, transQueue} = this;
    // TODO: sync on entering/exiting state, not transition success?
    transition.views("exiting").forEach($view.reset.bind($view));
    $view.sync();
    transition.views("entering").forEach($view.registerStateViewConfig.bind($view));
    $view.sync();

    // Update globals in $state
    $state.$current = transition.$to().$state();
    $state.current = transition.$to().state();

    this.updateStateParams(transition);
    transQueue.clear();
    return transition;
  }

  transitionFailure(transition, error) {
    let {$state, $stateParams, $q, transQueue} = this;
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
          transQueue.enqueue(error.detail);
          return this.runTransition(error.detail);
        }
      }
    }

    return $q.reject(error);
  }

  updateStateParams(transition) {
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
