import {UrlMatcherFactory} from "./url/urlMatcherFactory";
import {UrlRouterProvider} from "./url/urlRouter";
import {$StateProvider} from "./state/state";
import {stateParamsFactory} from "./params/stateParams";
import {UrlRouter} from "./url/urlRouter";
import {TransitionService} from "./transition/transitionService";

class Router {

  urlMatcherFactory: UrlMatcherFactory = new UrlMatcherFactory();

  urlRouterProvider: UrlRouterProvider= new UrlRouterProvider(this.urlMatcherFactory);

  urlRouter: UrlRouter = new UrlRouter(this.urlRouterProvider);

  stateProvider = new $StateProvider(this.urlRouterProvider, this.urlMatcherFactory);

  stateParams = stateParamsFactory();

  transitionService: TransitionService = new TransitionService();

  constructor() {

  }
}

export { Router };