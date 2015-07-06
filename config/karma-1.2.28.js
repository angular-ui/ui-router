// Karma configuration file
var files = require('../files').files;
var config = require("./karma.base");

module.exports = function (karma) {
  config.files = files.angular('1.2.28').concat(config.files);
  config.logLevel = karma.LOG_DEBUG;
  karma.set(config)
};
