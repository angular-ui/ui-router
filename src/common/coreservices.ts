import * as foo from "./common";

/**
 * Services related to the browser location (url)
 */
interface LocationServices {
  replace(): void;
  url(newurl: string): string;
  url(): string;
  path(): string;
  search(): string;
  hash(): string;

  port(): number;
  protocol(): string;
  host(): string;

  baseHref(): string;
  html5Mode(): boolean;
  hashPrefix(): string;
  hashPrefix(newprefix: string): string;
}

interface Services {
    location: LocationServices;
}

let services: Services = {
  location: <any> {}
};

let notImplemented = (fnname) => () => {
  throw new Error(`${fnname}(): No coreservices implementation for UI-Router is loaded. You should include one of: ['angular1.js']`);
};

[
  "replace",
  "url",
  "path",
  "search",
  "hash",
  "port",
  "protocol",
  "host",
  "baseHref",
  "html5Mode",
  "hashPrefix"
].forEach(key => services.location[key] = notImplemented(key));

export {services};