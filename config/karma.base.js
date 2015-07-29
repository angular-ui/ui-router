var files = require('../files').files;

module.exports = {
  // base path, that will be used to resolve files and exclude
  basePath: '..',

  // Karma files available to serve is configured using files.karmaServeFiles() in each grunt task (e.g., karma:ng14)
  // Actual tests to load is configured in karma.options.systemjs.files block

  // level of logging
  // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
  //logLevel: karma.LOG_DEBUG,
  frameworks: ['jasmine'],
  plugins: [
    require('karma-systemjs'),
    require('karma-jasmine'),
    require('karma-phantomjs-launcher'),
    require('karma-chrome-launcher')
  ],

  // Start these browsers, currently available:
  // - Chrome
  // - ChromeCanary
  // - Firefox
  // - Opera
  // - Safari
  // - PhantomJS
  browsers: ['PhantomJS']
};