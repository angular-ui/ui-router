// Karma configuration file

var files = require('../files').files;

module.exports = function (karma) {
  var config = {

    singleRun: true,
    autoWatch: false,
    autoWatchInterval: 0,

    // level of logging
    // possible values: LOG_DISABLE, LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG
    logLevel: karma.LOG_DEBUG,
    // 'dots', 'progress'
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

    // Karma files available to serve is overridden using files.karmaServedFiles() in some grunt tasks (e.g., karma:ng12)
    files: files.karmaServedFiles('1.4.1'),
    // Actual tests to load is configured in systemjs.files block
    systemjs: {
      // Set up systemjs paths
      configFile: 'config/system.config.js',
      // These files are served by Karma, but loaded using SystemJS
      files: ['src/**/*.ts'].concat(files.testUtils),
      // karma-systemjs kludge: This is turned into a regexp and used to load specs into Karma
      testFileSuffix: "/test/\\S+.[tj]s"
    },
    exclude: []
  };

  karma.set(config);
};
