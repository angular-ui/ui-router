/** @module hooks */ /** for typedoc */
import {noop} from "../common/common";
import {services} from "../common/coreservices";
import {Transition} from "../transition/transition";
import {ViewService} from "../view/view";
import {ViewConfig} from "../view/interface";
import {TransitionHookFn} from "../transition/interface";
import {TransitionService} from "../transition/transitionService";


/**
 * A [[TransitionHookFn]] which waits for the views to load
 *
 * Registered using `transitionService.onStart({}, loadEnteringViews);`
 *
 * Allows the views to do async work in [[ViewConfig.load]] before the transition continues.
 * In angular 1, this includes loading the templates.
 */
const loadEnteringViews: TransitionHookFn = (transition: Transition) => {
  let enteringViews = transition.views("entering");
  if (!enteringViews.length) return;
  return services.$q.all(enteringViews.map(view => view.load())).then(noop);
};

export const registerLoadEnteringViews = (transitionService: TransitionService) =>
    transitionService.onStart({}, loadEnteringViews);

/**
 * A [[TransitionHookFn]] which activates the new views when a transition is successful.
 *
 * Registered using `transitionService.onSuccess({}, activateViews);`
 *
 * After a transition is complete, this hook deactivates the old views from the previous state,
 * and activates the new views from the destination state.
 *
 * See [[ViewService]]
 */
const activateViews: TransitionHookFn = (transition: Transition) => {
  let enteringViews = transition.views("entering");
  let exitingViews = transition.views("exiting");
  if (!enteringViews.length && !exitingViews.length) return;

  let $view: ViewService = transition.router.viewService;

  exitingViews.forEach((vc: ViewConfig) => $view.deactivateViewConfig(vc));
  enteringViews.forEach((vc: ViewConfig) => $view.activateViewConfig(vc));

  $view.sync();
};

export const registerActivateViews = (transitionService: TransitionService) =>
    transitionService.onSuccess({}, activateViews);
