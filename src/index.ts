/**
 * Main entry point for angular 1.x build
 * @module ng1
 */
/** for typedoc */

export * from "ui-router-core";

export * from "./interface";
export * from "./services";
export * from "./statebuilders/views";
export * from "./stateProvider";

import "./directives/stateDirectives";
import "./stateFilters";
import "./directives/viewDirective";
import "./viewScroll";

export default "ui.router";
