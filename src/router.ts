/** @module common */ /** */
import {UrlMatcherFactory} from "./url/urlMatcherFactory";
import {UrlRouterProvider} from "./url/urlRouter";
import {StateProvider} from "./state/state";
import {stateParamsFactory, StateParams} from "./params/stateParams";
import {UrlRouter} from "./url/urlRouter";
import {TransitionService} from "./transition/transitionService";
import {TemplateFactory} from "./view/templateFactory";
import {ViewService} from "./view/view";
import {StateRegistry} from "./state/stateRegistry";
import {StateService} from "./state/stateService";

/**
 * The master class used to instantiate an instance of UI-Router.
 *
 * This class instantiates and wires the global UI-Router services.
 *
 * After instantiating a new instance of the Router class, configure it for your app.  For instance, register
 * your app states with the [[stateRegistry]] (and set url options using ...).  Then, tell UI-Router to monitor
 * the URL by calling `urlRouter.listen()` ([[URLRouter.listen]])
 */
export class UIRouter {

  stateParams: StateParams = stateParamsFactory();

  urlMatcherFactory: UrlMatcherFactory = new UrlMatcherFactory();

  urlRouterProvider: UrlRouterProvider = new UrlRouterProvider(this.urlMatcherFactory, this.stateParams);

  urlRouter: UrlRouter = new UrlRouter(this.urlRouterProvider);

  templateFactory = new TemplateFactory();

  viewService = new ViewService();

  transitionService: TransitionService = new TransitionService(this.viewService);

  stateRegistry: StateRegistry = new StateRegistry(this.urlMatcherFactory, this.urlRouterProvider);

  // TODO: move this to ng1.ts
  stateProvider = new StateProvider(this.stateRegistry);

  stateService = new StateService(this.viewService, this.stateParams, this.urlRouter, this.transitionService, this.stateRegistry, this.stateProvider);

  constructor() {
    this.viewService.rootContext(this.stateRegistry.root());
  }
}
