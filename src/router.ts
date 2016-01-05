import {UrlMatcherFactory} from "./url/urlMatcherFactory";
import {UrlRouterProvider} from "./url/urlRouter";
import {StateProvider} from "./state/state";
import {stateParamsFactory} from "./params/stateParams";
import {UrlRouter} from "./url/urlRouter";
import {TransitionService} from "./transition/transitionService";
import {TemplateFactory} from "./view/templateFactory";
import {ViewService} from "./view/view";
import {StateRegistry} from "./state/stateRegistry";
import {StateService} from "./state/stateService";

class Router {

  urlMatcherFactory: UrlMatcherFactory = new UrlMatcherFactory();

  urlRouterProvider: UrlRouterProvider = new UrlRouterProvider(this.urlMatcherFactory);

  urlRouter: UrlRouter = new UrlRouter(this.urlRouterProvider);

  transitionService: TransitionService = new TransitionService();

  templateFactory = new TemplateFactory();

  viewService = new ViewService(this.templateFactory);

  stateParams = stateParamsFactory();

  stateRegistry: StateRegistry = new StateRegistry(this.urlMatcherFactory, this.urlRouterProvider, () => this.stateService.$current);

  stateProvider = new StateProvider(this.stateRegistry);

  stateService = new StateService(this.viewService, this.stateParams, this.urlRouter, this.transitionService, this.stateRegistry, this.stateProvider);

  constructor() {
    this.viewService.rootContext(this.stateRegistry.root());
  }
}

export { Router };