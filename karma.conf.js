// Karma configuration file
var karma = require("karma");
var DEFAULT_NG_VERSION = "1.5";

/**
 * This returns a Karma 'files configuration'.
 * http://karma-runner.github.io/0.8/config/files.html
 *
 * Specifies which files can be served by the Karma web server
 *
 * included: true -- files that are always served to the browser (like <script> tag)
 * included: false -- files *available to be served* by karma, for instance via require()
 */
function karmaServedFiles(ngVersion) {
  // Returns necessary files for a specific version of angular
  function angular(version) {
    console.log('Using Angular ' + ngVersion + ' from test/angular/' + version + '/angular.js');

    return [
      'test/angular/' + version + '/angular.js',
      'test/angular/' + version + '/angular-mocks.js',
      'test/angular/' + version + '/angular-animate.js',
    ];
  }

  var angularFiles = angular(ngVersion).map(function (pattern) {
    return { watched: false, included: true, nocache: true, pattern: pattern };
  });

  return angularFiles.concat('test/index.js');
}

var webpackConfig = require('./webpack.config.js');
webpackConfig.entry = {};
webpackConfig.plugins = [];
webpackConfig.devtool = 'inline-source-map';

module.exports = function(config) {
  var ngVersion = config.ngversion || DEFAULT_NG_VERSION;

  config.set({
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
    basePath: '.',

    // Start these browsers, currently available:
    // Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS
    browsers: ['PhantomJS'],

    frameworks: ['jasmine'],

    plugins: [
      require('karma-webpack'),
      require('karma-sourcemap-loader'),
      require('karma-jasmine'),
      require('karma-phantomjs-launcher'),
      require('karma-chrome-launcher')
    ],

    webpack: webpackConfig,
    webpackMiddleware: {
      stats: { chunks: false },
    },

    /* Files *available to be served* by karma, i.e., anything that will be require()'d */
    files: karmaServedFiles(ngVersion),

    preprocessors: {
      'test/index.js': ['webpack', 'sourcemap'],
      '../src/ng1': ['webpack', 'sourcemap'],
    },

  });
};
