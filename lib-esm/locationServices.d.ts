
/**
 * @internalapi
 * @module ng1
 */ /** */
import { LocationConfig, LocationServices, UIRouter } from "ui-router-core";
import { ILocationService, ILocationProvider } from "angular";
/**
 * Implements UI-Router LocationServices and LocationConfig using Angular 1's $location service
 */
export declare class Ng1LocationServices implements LocationConfig, LocationServices {
    private $locationProvider;
    private $location;
    private $sniffer;
    path: any;
    search: any;
    hash: any;
    hashPrefix: any;
    port: any;
    protocol: any;
    host: any;
    baseHref: any;
    private _urlListeners;
    dispose(): void;
    constructor($locationProvider: ILocationProvider);
    onChange(callback: Function): () => Function[];
    html5Mode(): any;
    url(newUrl?: string, replace?: boolean, state?: any): string;
    _runtimeServices($rootScope: any, $location: ILocationService, $sniffer: any, $browser: any): void;
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
    static monkeyPatchPathParameterType(router: UIRouter): void;
}
