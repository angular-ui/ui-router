/**
 * Main entry point for angular 1.x build
 * @module ng1
 */ /** */
import * as core from "@uirouter/core";
export { core };
export * from "@uirouter/core";
export * from "./services";
export * from "./statebuilders/views";
export * from "./stateProvider";
export * from "./urlRouterProvider";
import "./injectables";
import "./directives/stateDirectives";
import "./stateFilters";
import "./directives/viewDirective";
import "./viewScroll";
export default "ui.router";
//# sourceMappingURL=index.js.map