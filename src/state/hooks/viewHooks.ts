/** @module state */ /** for typedoc */
import {find, noop} from "../../common/common";
import {propEq} from "../../common/hof";
import {services} from "../../common/coreservices";

import {TreeChanges} from "../../transition/interface";
import {Transition} from "../../transition/transition";

import {ViewConfig} from "../../view/view";
import {ViewService} from "../../view/view";

export class ViewHooks {
  private treeChanges: TreeChanges;
  private enteringViews: ViewConfig[];
  private exitingViews: ViewConfig[];
  private transition: Transition;
  private $view: ViewService; // service

  constructor(transition: Transition, $view: ViewService) {
    this.transition = transition;
    this.$view = $view;

    this.treeChanges = transition.treeChanges();
    this.enteringViews = transition.views("entering");
    this.exitingViews = transition.views("exiting");
  }

  loadAllEnteringViews() {
    const loadView = (vc: ViewConfig) => {
      let resolveInjector = find(this.treeChanges.to, propEq('state', vc.context)).resolveInjector;
      return <Promise<ViewConfig>> this.$view.load(vc, resolveInjector);
    };
    return services.$q.all(this.enteringViews.map(loadView)).then(noop);
  }

  updateViews() {
    let $view = this.$view;
    this.exitingViews.forEach((viewConfig: ViewConfig) => $view.reset(viewConfig));
    this.enteringViews.forEach((viewConfig: ViewConfig) => $view.registerStateViewConfig(viewConfig));
    $view.sync();
  }

  registerHooks() {
    if (this.enteringViews.length) {
      this.transition.onStart({}, this.loadAllEnteringViews.bind(this));
    }

    if (this.exitingViews.length || this.enteringViews.length)
      this.transition.onSuccess({}, this.updateViews.bind(this));
  }
}
