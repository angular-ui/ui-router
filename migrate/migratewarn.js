#!env node
"use strict";

var pkg = require('../package.json');
var migrate = require('./migrate.json');

if (pkg.name === migrate.old) {
  var warning = 'WARNING! this npm package "' + migrate.old + '" has been renamed to "' + migrate.new + '".  Please update your package.json';
  var warning2 = 'See https://ui-router.github.io/blog/uirouter-scoped-packages/ for details.';
  console.log("\x1b[1m\x1b[37m\x1b[41m%s\x1b[0m", warning);
  console.log("\x1b[1m\x1b[37m\x1b[41m%s\x1b[0m", warning2);
}
