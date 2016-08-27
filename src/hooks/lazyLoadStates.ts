import {Transition} from "../transition/transition";
import {TransitionService} from "../transition/transitionService";
import {TransitionHookFn} from "../transition/interface";
import {StateDeclaration} from "../state/interface";
import {State} from "../state/stateObject";
import {services} from "../common/coreservices";

/**
 * A [[TransitionHookFn]] that lazy loads a state tree.
 *
 * When transitioning to a state "abc" which has a `lazyLoad` function defined:
 * - Invoke the `lazyLoad` function
 *   - The function should return a promise for an array of lazy loaded [[StateDeclaration]]s
 * - Wait for the promise to resolve
 * - Deregister the original state "abc"
 *   - The original state definition is a placeholder for the lazy loaded states
 * - Register the new states
 * - Retry the transition
 *
 * See [[StateDeclaration.lazyLoad]]
 */
const lazyLoadHook: TransitionHookFn = (transition: Transition) => {
  var toState = transition.to();

  function retryOriginalTransition(newStates: State[]) {
    if (transition.options().source === 'url') {
      let loc = services.location;
      let path = loc.path(), search = loc.search(), hash = loc.hash();

      let matchState = state => [state, state.url.exec(path, search, hash)];
      let matches = newStates.map(matchState).filter(([state, params]) => !!params);
      if (matches.length) {
        let [state, params] = matches[0];
        return transition.router.stateService.target(state, params, transition.options());
      }
      transition.router.urlRouter.sync();
    }

    let state = transition.targetState().identifier();
    let params = transition.params();
    let options = transition.options();
    return transition.router.stateService.target(state, params, options);
  }

  /**
   * Replace the placeholder state with the newly loaded states from the NgModule.
   */
  function updateStateRegistry(newStates: StateDeclaration[]) {
    let registry = transition.router.stateRegistry;
    let placeholderState = transition.to();

    registry.deregister(placeholderState);
    newStates.forEach(state => registry.register(state));
    return newStates.map(state => registry.get(state).$$state());
  }
  
  return toState.lazyLoad(transition)
      .then(updateStateRegistry)
      .then(retryOriginalTransition)
};

export const registerLazyLoadHook = (transitionService: TransitionService) =>
    transitionService.onBefore({ to: (state) => !!state.lazyLoad }, lazyLoadHook);
