/**
 * @internalapi
 * @module ng1
 */ /** */
import { LocationConfig, LocationServices, UIRouter, ParamType } from "ui-router-core";
import { createProxyFunctions, removeFrom, isObject } from "ui-router-core";
import { ILocationService, ILocationProvider } from "angular";

/**
 * Implements UI-Router LocationServices and LocationConfig using Angular 1's $location service
 */
export class Ng1LocationServices implements LocationConfig, LocationServices {
  private $locationProvider: ILocationProvider;
  private $location: ILocationService;
  private $sniffer;

  path;
  search;
  hash;
  hashPrefix;
  port;
  protocol;
  host;
  baseHref;

  // .onChange() registry
  private _urlListeners: Function[] = [];

  dispose() { }

  constructor($locationProvider: ILocationProvider) {
    this.$locationProvider = $locationProvider;
    createProxyFunctions($locationProvider, this, $locationProvider, ['hashPrefix']);
  }

  onChange(callback: Function) {
    this._urlListeners.push(callback);
    return () => removeFrom(this._urlListeners)(callback);
  }

  html5Mode() {
    let html5Mode: any = this.$locationProvider.html5Mode();
    html5Mode = isObject(html5Mode) ? html5Mode.enabled : html5Mode;
    return html5Mode && this.$sniffer.history;
  }

  setUrl(newUrl: string, replace = false) {
    this.$location.url(newUrl);
    if (replace) this.$location.replace();
  }

  _runtimeServices($rootScope, $location: ILocationService, $sniffer, $browser) {
    this.$location = $location;
    this.$sniffer = $sniffer;

    // Bind $locationChangeSuccess to the listeners registered in LocationService.onChange
    $rootScope.$on("$locationChangeSuccess", evt => this._urlListeners.forEach(fn => fn(evt)));

    // Bind these LocationService functions to $location
    createProxyFunctions($location, this, $location, ["replace", "url", "path", "search", "hash"]);
    // Bind these LocationConfig functions to $location
    createProxyFunctions($location, this, $location, ['port', 'protocol', 'host']);
    // Bind these LocationConfig functions to $browser
    createProxyFunctions($browser, this, $browser, ['baseHref']);
  }

  /**
   * Applys ng1-specific path parameter encoding
   *
   * The Angular 1 `$location` service is a bit weird.
   * It doesn't allow slashes to be encoded/decoded bi-directionally.
   *
   * See the writeup at https://github.com/angular-ui/ui-router/issues/2598
   *
   * This code patches the `path` parameter type so it encoded/decodes slashes as ~2F
   *
   * @param router
   */
  static monkeyPatchPathParameterType(router: UIRouter) {
    let pathType: ParamType = router.urlMatcherFactory.type('path');

    pathType.encode = (val: any) =>
        val != null ? val.toString().replace(/(~|\/)/g, m => ({ '~': '~~', '/': '~2F' }[m])) : val;

    pathType.decode = (val: string) =>
        val != null ? val.toString().replace(/(~~|~2F)/g, m => ({ '~~': '~', '~2F': '/' }[m])) : val;

  }
}
