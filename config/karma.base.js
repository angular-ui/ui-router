var files = require('../files').files;

module.exports = {
  // base path, that will be used to resolve files and exclude
  basePath: '..',

  // list of files / patterns to load in the browser
  _files: [].concat(files.testUtils, files.buildDest, 'test/tests.js'),
  preprocessors: {
    'lib/angular*.js': ['webpack'],
    'test/tests.js': ['webpack']
  },

  // level of logging
  // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
  //logLevel: karma.LOG_DEBUG,
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
  browsers: ['PhantomJS']
};