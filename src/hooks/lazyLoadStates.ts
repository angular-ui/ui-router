/** @module hooks */ /** */
import {Transition} from "../transition/transition";
import {TransitionService} from "../transition/transitionService";
import {TransitionHookFn} from "../transition/interface";
import {StateDeclaration, LazyLoadResult} from "../state/interface";
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
  let registry = transition.router.stateRegistry;

  function retryOriginalTransition() {
    if (transition.options().source === 'url') {
      let loc = services.location, path = loc.path(), search = loc.search(), hash = loc.hash();

      let matchState = state => [state, state.url && state.url.exec(path, search, hash)];
      let matches = registry.get().map(s => s.$$state()).map(matchState).filter(([state, params]) => !!params);

      if (matches.length) {
        let [state, params] = matches[0];
        return transition.router.stateService.target(state, params, transition.options());
      }
      transition.router.urlRouter.sync();
    }

    // The original transition was not triggered via url sync
    // The lazy state should be loaded now, so re-try the original transition
    let orig = transition.targetState();
    return transition.router.stateService.target(orig.identifier(), orig.params(), orig.options());
  }

  /**
   * Replace the placeholder state with the newly loaded states from the NgModule.
   */
  function updateStateRegistry(result: LazyLoadResult) {
    // deregister placeholder state
    registry.deregister(transition.$to());
    if (result && Array.isArray(result.states)) {
      result.states.forEach(state => registry.register(state));
    }
  }

  let hook = toState.lazyLoad;
  // Store/get the lazy load promise on/from the hookfn so it doesn't get re-invoked
  let promise = hook['_promise'];
  if (!promise) {
    promise = hook['_promise'] = hook(transition).then(updateStateRegistry);
    const cleanup = () => delete hook['_promise'];
    promise.catch(cleanup, cleanup);
  }

  return promise.then(retryOriginalTransition);
};

export const registerLazyLoadHook = (transitionService: TransitionService) =>
    transitionService.onBefore({ to: (state) => !!state.lazyLoad }, lazyLoadHook);
