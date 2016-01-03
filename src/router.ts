import {UrlMatcherFactory} from "./url/urlMatcherFactory";
import {UrlRouterProvider} from "./url/urlRouter";
import {$StateProvider} from "./state/state";
import {stateParamsFactory} from "./params/stateParams";
import {UrlRouter} from "./url/urlRouter";
import {TransitionService} from "./transition/transitionService";
import {TemplateFactory} from "./view/templateFactory";
import {ViewService} from "./view/view";

class Router {

  urlMatcherFactory: UrlMatcherFactory = new UrlMatcherFactory();

  urlRouterProvider: UrlRouterProvider = new UrlRouterProvider(this.urlMatcherFactory);

  urlRouter: UrlRouter = new UrlRouter(this.urlRouterProvider);

  transitionService: TransitionService = new TransitionService();

  templateFactory = new TemplateFactory();

  viewService = new ViewService(this.templateFactory);

  stateParams = stateParamsFactory();

  stateProvider = new $StateProvider(this.urlRouterProvider, this.urlMatcherFactory);

}

export { Router };