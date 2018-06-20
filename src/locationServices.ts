/**
 * @internalapi
 * @module ng1
 */ /** */
import { LocationConfig, LocationServices, UIRouter, ParamType, isDefined } from '@uirouter/core';
import { val, createProxyFunctions, removeFrom, isObject } from '@uirouter/core';
import { ILocationService, ILocationProvider, IWindowService } from 'angular';

/**
 * Implements UI-Router LocationServices and LocationConfig using Angular 1's $location service
 */
export class Ng1LocationServices implements LocationConfig, LocationServices {
  private $locationProvider: ILocationProvider;
  private $location: ILocationService;
  private $sniffer: any;
  private $browser: any;
  private $window: IWindowService;

  path;
  search;
  hash;
  hashPrefix;
  port;
  protocol;
  host;

  private _baseHref: string;

  // .onChange() registry
  private _urlListeners: Function[] = [];

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
    const pathType: ParamType = router.urlMatcherFactory.type('path');

    pathType.encode = (x: any) =>
      x != null ? x.toString().replace(/(~|\/)/g, m => ({ '~': '~~', '/': '~2F' }[m])) : x;

    pathType.decode = (x: string) =>
      x != null ? x.toString().replace(/(~~|~2F)/g, m => ({ '~~': '~', '~2F': '/' }[m])) : x;
  }

  dispose() {}

  constructor($locationProvider: ILocationProvider) {
    this.$locationProvider = $locationProvider;
    const _lp = val($locationProvider);
    createProxyFunctions(_lp, this, _lp, ['hashPrefix']);
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

  baseHref() {
    return this._baseHref || (this._baseHref = this.$browser.baseHref() || this.$window.location.pathname);
  }

  url(newUrl?: string, replace = false, state?) {
    if (isDefined(newUrl)) this.$location.url(newUrl);
    if (replace) this.$location.replace();
    if (state) this.$location.state(state);
    return this.$location.url();
  }

  _runtimeServices($rootScope, $location: ILocationService, $sniffer, $browser, $window: IWindowService) {
    this.$location = $location;
    this.$sniffer = $sniffer;
    this.$browser = $browser;
    this.$window = $window;

    // Bind $locationChangeSuccess to the listeners registered in LocationService.onChange
    $rootScope.$on('$locationChangeSuccess', evt => this._urlListeners.forEach(fn => fn(evt)));
    const _loc = val($location);

    // Bind these LocationService functions to $location
    createProxyFunctions(_loc, this, _loc, ['replace', 'path', 'search', 'hash']);
    // Bind these LocationConfig functions to $location
    createProxyFunctions(_loc, this, _loc, ['port', 'protocol', 'host']);
  }
}
