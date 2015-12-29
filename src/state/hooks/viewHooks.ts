/** @module state */ /** for typedoc */
import {IPromise} from "angular";
import {find, propEq, noop} from "../../common/common";
import {services} from "../../common/coreservices";
import {annotateController} from "../../ng1/angular1";

import {TreeChanges} from "../../transition/interface";
import {Transition} from "../../transition/transition";

import {ViewConfig} from "../../view/view";

export class ViewHooks {
  private treeChanges: TreeChanges;
  private enteringViews: ViewConfig[];
  private exitingViews: ViewConfig[];
  private transition: Transition;
  private $view; // service

  constructor(transition: Transition, $view) {
    this.transition = transition;
    this.$view = $view;

    this.treeChanges = transition.treeChanges();
    this.enteringViews = transition.views("entering");
    this.exitingViews = transition.views("exiting");
  }

  loadAllEnteringViews() {
    const loadView = (vc: ViewConfig) => {
      let resolveInjector = find(this.treeChanges.to, propEq('state', vc.context)).resolveInjector;
      return <IPromise<ViewConfig>> this.$view.load(vc, resolveInjector);
    };
    return services.$q.all(this.enteringViews.map(loadView)).then(noop);
  }

  loadAllControllerLocals() {
    const loadLocals = (vc: ViewConfig) => {
      let deps = annotateController(vc.controller);
      let resolveInjector = find(this.treeChanges.to, propEq('state', vc.context)).resolveInjector;
      function $loadControllerLocals() { }
      $loadControllerLocals.$inject = deps;
      return services.$q.all(resolveInjector.getLocals($loadControllerLocals)).then((locals) => vc.locals = locals);
    };

    let loadAllLocals = this.enteringViews.filter(vc => !!vc.controller).map(loadLocals);
    return services.$q.all(loadAllLocals).then(noop);
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
      this.transition.onFinish({}, this.loadAllControllerLocals.bind(this));
    }

    if (this.exitingViews.length || this.enteringViews.length)
      this.transition.onSuccess({}, this.updateViews.bind(this));
  }
}
