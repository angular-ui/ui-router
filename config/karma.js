// Karma configuration file
module.exports = function (karma) {

  var files = require('../files').files;

  karma.set({
    // base path, that will be used to resolve files and exclude
    basePath: '..',

    // list of files / patterns to load in the browser
    files: [].concat(files.angular('1.2.14'), files.testUtils, files.buildDest, files.test),
    preprocessors: {
      'lib/angular*.js': ['webpack'],
      'test/*.js': ['webpack']
    },

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: karma.LOG_DEBUG,
    frameworks: ['jasmine'],
    plugins: [
      require('karma-webpack'),
      require('karma-jasmine'),
      require('karma-phantomjs-launcher'),
      require('karma-chrome-launcher')
    ],

    webpack: {
      resolve: {
        modulesDirectories: [
          "",
          "build/ts2es5",
          "node_modules"
        ]
      }
    },

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari
    // - PhantomJS
    browsers: [ 'PhantomJS' ]
  })
};
