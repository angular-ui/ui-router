import {UrlMatcherFactory} from "./url/urlMatcherFactory";
import {$UrlRouterProvider} from "./url/urlRouter";
import {$StateProvider} from "./state/state";

class Router {
  urlMatcherFactory: UrlMatcherFactory = new UrlMatcherFactory();
  urlRouterProvider = new $UrlRouterProvider(this.urlMatcherFactory);
  stateProvider = new $StateProvider(this.urlRouterProvider, this.urlMatcherFactory);

  constructor() {

  }
}

export { Router };