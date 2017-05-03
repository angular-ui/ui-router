
import { IRootScopeService } from "angular";
import { ResolveContext, TypedMap } from "@uirouter/core";
import { StateProvider } from "./stateProvider";
import { UrlRouterProvider } from "./urlRouterProvider";
declare module '@uirouter/core/lib/router' {
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
