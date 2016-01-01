import {UrlMatcherFactory} from "./url/urlMatcherFactory";
import {$UrlRouterProvider} from "./url/urlRouter";
import {$StateProvider} from "./state/state";
import {stateParamsFactory} from "./params/stateParams";

class Router {
  urlMatcherFactory: UrlMatcherFactory = new UrlMatcherFactory();
  urlRouterProvider = new $UrlRouterProvider(this.urlMatcherFactory);
  stateProvider = new $StateProvider(this.urlRouterProvider, this.urlMatcherFactory);
  stateParams = stateParamsFactory();

  constructor() {

  }
}

export { Router };