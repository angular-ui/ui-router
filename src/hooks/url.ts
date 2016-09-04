/** @module hooks */ /** */
import {UrlRouter} from "../url/urlRouter";
import {StateService} from "../state/stateService";
import {Transition} from "../transition/transition";
import {TransitionHookFn} from "../transition/interface";
import {TransitionService} from "../transition/transitionService";

/** 
 * A [[TransitionHookFn]] which updates the URL after a successful transition
 * 
 * Registered using `transitionService.onSuccess({}, updateUrl);`
 */
const updateUrl: TransitionHookFn = (transition: Transition) => {
  let options = transition.options();
  let $state: StateService = transition.router.stateService;
  let $urlRouter: UrlRouter = transition.router.urlRouter;

  // Dont update the url in these situations:
  // The transition was triggered by a URL sync (options.source === 'url')
  // The user doesn't want the url to update (options.location === false)
  // The destination state, and all parents have no navigable url
  if (options.source !== 'url' && options.location && $state.$current.navigable) {
    var urlOptions = {replace: options.location === 'replace'};
    $urlRouter.push($state.$current.navigable.url, $state.params, urlOptions);
  }

  $urlRouter.update(true);
};

export const registerUpdateUrl = (transitionService: TransitionService) =>
    transitionService.onSuccess({}, updateUrl, {priority: 9999});
