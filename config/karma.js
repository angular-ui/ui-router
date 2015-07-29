// Karma configuration file
var config = require("./karma.base");

module.exports = function (karma) {
  config.logLevel = karma.LOG_DEBUG;
  karma.set(config)
};
