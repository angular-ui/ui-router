"use strict";
/**
 * Main entry point for angular 1.x build
 * @module ng1
 */ /** */
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./services"));
__export(require("./statebuilders/views"));
__export(require("./stateProvider"));
__export(require("./urlRouterProvider"));
require("./injectables");
require("./directives/stateDirectives");
require("./stateFilters");
require("./directives/viewDirective");
require("./viewScroll");
exports.default = "ui.router";
var core = require("@uirouter/core");
exports.core = core;
__export(require("@uirouter/core"));
//# sourceMappingURL=index.js.map