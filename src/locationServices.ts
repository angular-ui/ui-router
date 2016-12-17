/**
 * @internalapi
 * @module ng1
 */ /** */
import { LocationConfig, LocationServices } from "ui-router-core";
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
}