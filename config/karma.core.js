// Karma configuration file
var clone = require("clone");
var baseconfig = require("./_karma.base");
var files = require('../files').files;

module.exports = function (karma) {
  var config = clone(baseconfig);

  /* Files available to be served, so anything that will be require()'d */
  config.files = files.karmaServedFiles();

  // karma-systemjs kludge: This is turned into a regexp and is the actual specs that are loaded
  config.systemjs.testFileSuffix = "/test/core/\\S+.[tj]s";

  karma.set(config);
};
