
import { TypedMap } from "ui-router-core";
import { IRootScopeService } from "angular";
import { ResolveContext } from "ui-router-core";
import { StateProvider } from "./stateProvider";
import { UrlRouterProvider } from "./urlRouterProvider";
declare module 'ui-router-core/lib/router' {
    interface UIRouter {
        /** @hidden */
        stateProvider: StateProvider;
        /** @hidden */
        urlRouterProvider: UrlRouterProvider;
    }
}
export declare function watchDigests($rootScope: IRootScopeService): void;
/** @hidden TODO: find a place to move this */
export declare const getLocals: (ctx: ResolveContext) => TypedMap<any>;
