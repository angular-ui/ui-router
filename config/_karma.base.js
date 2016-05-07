// Karma configuration file

var karma = require("karma");
var files = require('../files').files;

var config = {

  singleRun: true,
  autoWatch: false,
  autoWatchInterval: 0,

  // level of logging
  // possible values: LOG_DISABLE, LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG
  logLevel: "warn",
  // possible values: 'dots', 'progress'
  reporters: 'dots',
  colors: true,

  port: 8080,

  // base path, that will be used to resolve files and exclude
  basePath: '..',

  // Start these browsers, currently available:
  // Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS
  browsers: ['PhantomJS'],

  frameworks: ['systemjs', 'jasmine'],

  plugins: [
    require('karma-systemjs'),
    require('karma-jasmine'),
    require('karma-phantomjs-launcher'),
    require('karma-chrome-launcher')
  ],

  systemjs: {
    // Set up systemjs paths
    configFile: 'config/system.config.js',
    files: ['src/**/*.ts']
  },
  exclude: []
};

module.exports = config;
