import {UrlRouter} from "../url/urlRouter";
import {StateService} from "../state/stateService";
import {Transition} from "../transition/transition";
import {UIRInjector} from "../common/interface";
import {UiRouter} from "../router";

export function updateUrl(transition: Transition, injector: UIRInjector) {
  let options = transition.options();
  var router: UiRouter = injector.get(UiRouter);
  let $state: StateService = router.stateService;
  let $urlRouter: UrlRouter = router.urlRouter;

  if (options.location && $state.$current.navigable) {
    var urlOptions = {replace: options.location === 'replace'};
    $urlRouter.push($state.$current.navigable.url, $state.params, urlOptions);
  }

  $urlRouter.update(true);
}
