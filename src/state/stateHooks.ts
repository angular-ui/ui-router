import {IPromise, IQService} from "angular";
import {copy, prop, noop} from "../common/common";
import Queue from "../common/queue";
import {annotateController} from "../common/angular1";

import {ITreeChanges} from "../transition/interface";
import {Transition} from "../transition/transition";
import {TransitionRejection, RejectType} from "../transition/rejectFactory";

import {IStateService, IStateDeclaration} from "../state/interface";
import {ViewConfig} from "../view/view";

export default class StateHooks {
  constructor(
      private transition: Transition,
      private $urlRouter,
      private $view, // service
      private $state: IStateService,
      private $stateParams, // service/obj
      private $q: IQService,
      private activeTransQ: Queue<Transition>,
      private changeHistory: Queue<ITreeChanges>
  ) { }
  
  runTransition() {
    this.activeTransQ.clear();
    this.activeTransQ.enqueue(this.transition);
    return this.transition.run();
  }

  transitionSuccess() {
    let {transition, $view, $state, activeTransQ, changeHistory} = this;
    let treeChanges = transition.treeChanges();
    $view.sync();

    // Update globals in $state
    $state.$current = transition.$to();
    $state.current = $state.$current.self;
    this.updateStateParams();
    activeTransQ.remove(transition);
    changeHistory.enqueue(treeChanges);

    return transition;
  }

  transitionFailure(error): (IStateDeclaration|IPromise<any>) {
    let {transition, $urlRouter, $view, $state, $stateParams, $q, activeTransQ, changeHistory} = this;
    activeTransQ.remove(transition);
    // Handle redirect and abort
    if (error instanceof TransitionRejection) {
      if (error.type === RejectType.IGNORED) {
        // Update $stateParmas/$state.params/$location.url if transition ignored, but dynamic params have changed.
        if (!$state.$current.params.$$filter(prop('dynamic')).$$equals($stateParams, transition.params())) {
          this.updateStateParams();
        }
        return $state.current;
      }

      if (error.type === RejectType.SUPERSEDED) {
        if (error.redirected && error.detail instanceof Transition) {
          let stateHooks = new StateHooks(error.detail, $urlRouter, $view, $state, $stateParams, $q, activeTransQ, changeHistory);
          stateHooks.registerTransitionHooks();
          return stateHooks.runTransition();
        }
      }
    }

    return $q.reject(error);
  }

  updateStateParams() {
    let {transition, $urlRouter, $state, $stateParams} = this;
    let options = transition.options();
    $state.params = transition.params();
    copy($state.params, $stateParams);
    $stateParams.$sync().$off();

    if (options.location && $state.$current.navigable) {
      $urlRouter.push($state.$current.navigable.url, $stateParams, { replace: options.location === 'replace' });
    }

    $urlRouter.update(true);
  }


  registerTransitionHooks() {
    let { transition, $view, $q } = this;

    let hookBuilder = transition.hookBuilder();

    // TODO: Move the Transition instance hook registration to its own function
    // Add hooks
    let enteringViews = transition.views("entering");
    let exitingViews = transition.views("exiting");
    let treeChanges = transition.treeChanges();

    function $updateViews() {
      exitingViews.forEach((viewConfig: ViewConfig) => $view.reset(viewConfig));
      enteringViews.forEach((viewConfig: ViewConfig) => $view.registerStateViewConfig(viewConfig));
      $view.sync();
    }

    function $loadAllEnteringViews() {
      const loadView = (vc: ViewConfig) => {
        let resolveInjector = treeChanges.to.nodeForState(vc.context.name).resolveInjector;
        return $view.load(vc, resolveInjector);
      };
      return $q.all(enteringViews.map(loadView)).then(noop);
    }

    function $loadAllControllerLocals() {
      const loadLocals = (vc: ViewConfig) => {
        let deps = annotateController(vc.controller);
        let resolveInjector = treeChanges.to.nodeForState(vc.context.name).resolveInjector;
        function $loadControllerLocals() { }
        $loadControllerLocals.$inject = deps;
        return $q.all(resolveInjector.getLocals($loadControllerLocals)).then((locals) => vc.locals = locals);
      };

      let loadAllLocals = enteringViews.filter(vc => !!vc.controller).map(loadLocals);
      return $q.all(loadAllLocals).then(noop);
    }

    transition.onStart({}, hookBuilder.getEagerResolvePathFn(), { priority: 1000 });
    transition.onEnter({}, hookBuilder.getLazyResolveStateFn(), { priority: 1000 });


    let onEnterRegistration = (state) => transition.onEnter({to: state.name}, state.onEnter);
    transition.entering().filter(state => !!state.onEnter).forEach(onEnterRegistration);

    let onRetainRegistration = (state) => transition.onRetain({}, state.onRetain);
    transition.entering().filter(state => !!state.onRetain).forEach(onRetainRegistration);

    let onExitRegistration = (state) => transition.onExit({from: state.name}, state.onExit);
    transition.exiting().filter(state => !!state.onExit).forEach(onExitRegistration);

    if (enteringViews.length) {
      transition.onStart({}, $loadAllEnteringViews);
      transition.onFinish({}, $loadAllControllerLocals);
    }
    if (exitingViews.length || enteringViews.length)
      transition.onSuccess({}, $updateViews);
  }
}
