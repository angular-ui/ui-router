/** @module state */ /** for typedoc */
import {noop} from "../../common/common";
import {services} from "../../common/coreservices";

import {TreeChanges} from "../../transition/interface";
import {Transition} from "../../transition/transition";

import {ViewService} from "../../view/view";
import {ViewConfig} from "../../view/interface";

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
    return services.$q.all(this.enteringViews.map(view => view.load())).then(noop);
  }

  updateViews() {
    let $view = this.$view;
    this.exitingViews.forEach((viewConfig: ViewConfig) => $view.deactivateViewConfig(viewConfig));
    this.enteringViews.forEach((viewConfig: ViewConfig) => $view.activateViewConfig(viewConfig));
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
