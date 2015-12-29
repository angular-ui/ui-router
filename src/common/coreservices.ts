/**
 * This module is a stub for core services such as Dependency Injection or Browser Location.
 * Core services may be implemented by a specific framework, such as ng1 or ng2, or be pure javascript.
 *
 * @module common
 */

/** for typedoc */
import * as foo from "./common";
import IQService = angular.IQService;
import IInjectorService = angular.auto.IInjectorService;

let notImplemented = (fnname) => () => {
  throw new Error(`${fnname}(): No coreservices implementation for UI-Router is loaded. You should include one of: ['angular1.js']`);
};

let services: CoreServices = {
  $q: undefined,
  $injector: undefined,
  location: <any> {},
  locationConfig: <any> {}
};

["replace", "url", "path", "search", "hash"]
    .forEach(key => services.location[key] = notImplemented(key));

["port", "protocol", "host", "baseHref", "html5Mode", "hashPrefix" ]
    .forEach(key => services.locationConfig[key] = notImplemented(key));

interface CoreServices {
  $q: IQService;
  $injector: IInjectorService;
  /** Services related to getting or setting the browser location (url) */
  location: LocationServices;
  /** Retrieves configuration for how to construct a URL. */
  locationConfig: LocationConfig;
}

interface LocationServices {
  replace(): void;
  url(newurl: string): string;
  url(): string;
  path(): string;
  search(): string;
  hash(): string;
}

interface LocationConfig {
  port(): number;
  protocol(): string;
  host(): string;

  baseHref(): string;
  html5Mode(): boolean;
  hashPrefix(): string;
  hashPrefix(newprefix: string): string;
}

export {services};