/** @module state */ /** for typedoc */
import {noop} from "../common/common";
import {services} from "../common/coreservices";
import {Transition} from "../transition/transition";
import {ViewService} from "../view/view";
import {ViewConfig} from "../view/interface";
import {TransitionService} from "../transition/transitionService";
import {UIRInjector} from "../common/interface";
import {UiRouter} from "../router";


/** Allows the views to do async work [.load()] before the transition continues */
export function loadEnteringViews(transition) {
  let enteringViews = transition.views("entering");
  if (!enteringViews.length) return;
  return services.$q.all(enteringViews.map(view => view.load())).then(noop);
}

export function activateViews(transition: Transition, injector: UIRInjector) {
  let enteringViews = transition.views("entering");
  let exitingViews = transition.views("exiting");
  if (!enteringViews.length && !exitingViews.length) return;

  let $view: ViewService = injector.get(UiRouter).viewService;

  exitingViews.forEach((vc: ViewConfig) => $view.deactivateViewConfig(vc));
  enteringViews.forEach((vc: ViewConfig) => $view.activateViewConfig(vc));

  $view.sync();
}
