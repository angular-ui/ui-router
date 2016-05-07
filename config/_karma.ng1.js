
// Karma configuration file
var clone = require("clone");
var baseconfig = require("./_karma.base");
var files = require('../files').files;

module.exports = function (ngVersion, testFileSuffix) {
  var config = clone(baseconfig);

  /* Files available to be served by karma, i.e., anything that will be require()'d */
  config.files = files.karmaServedFiles(ngVersion);

  // karma-systemjs kludge: This is turned into a regexp and is the actual specs that are loaded
  config.systemjs.testFileSuffix = testFileSuffix;

  return config;
};

