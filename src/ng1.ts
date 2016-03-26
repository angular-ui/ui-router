/**
 * Main entry point for angular 1.x build
 * @module ng1
 */
/** for typedoc */

export * from "./core";

export * from "./ng1/services";
export * from "./ng1/viewsBuilder";

import "./ng1/stateDirectives";
import "./ng1/stateFilters";
import "./ng1/viewDirective";
import "./ng1/viewScroll";

export default "ui.router";
