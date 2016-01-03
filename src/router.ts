import {UrlMatcherFactory} from "./url/urlMatcherFactory";
import {UrlRouterProvider} from "./url/urlRouter";
import {$StateProvider} from "./state/state";
import {stateParamsFactory} from "./params/stateParams";
import {UrlRouter} from "./url/urlRouter";
import {TransitionService} from "./transition/transitionService";
import {TemplateFactory} from "./view/templateFactory";

class Router {

  urlMatcherFactory: UrlMatcherFactory = new UrlMatcherFactory();

  urlRouterProvider: UrlRouterProvider= new UrlRouterProvider(this.urlMatcherFactory);

  urlRouter: UrlRouter = new UrlRouter(this.urlRouterProvider);

  transitionService: TransitionService = new TransitionService();

  templateFactory = new TemplateFactory();

  stateParams = stateParamsFactory();

  stateProvider = new $StateProvider(this.urlRouterProvider, this.urlMatcherFactory);


}

export { Router };