import {UrlMatcherFactory} from "./url/urlMatcherFactory";

class Router {
  constructor() {}
  urlMatcherFactory: UrlMatcherFactory = new UrlMatcherFactory();
}

export { Router };