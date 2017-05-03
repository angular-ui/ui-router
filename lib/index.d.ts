/**
 * Main entry point for angular 1.x build
 * @module ng1
 */ /** */
import * as core from "@uirouter/core";
export { core };
export * from "@uirouter/core";
export * from "./interface";
export * from "./services";
export * from "./statebuilders/views";
export * from "./stateProvider";
export * from "./urlRouterProvider";
import "./injectables";
import "./directives/stateDirectives";
import "./stateFilters";
import "./directives/viewDirective";
import "./viewScroll";
declare var _default: "ui.router";
export default _default;
