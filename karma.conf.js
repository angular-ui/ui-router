// Karma configuration file
var karma = require('karma');
var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var DEFAULT_NG_VERSION = '1.6';

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

  var angularFiles = angular(ngVersion).map(function(pattern) {
    return { watched: false, included: true, nocache: true, pattern: pattern };
  });

  return angularFiles.concat('test/index.js');
}

module.exports = function(config) {
  var ngVersion = config.ngversion || DEFAULT_NG_VERSION;

  config.set({
    singleRun: true,
    autoWatch: false,
    autoWatchInterval: 0,

    // level of logging
    // possible values: LOG_DISABLE, LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG
    logLevel: 'warn',

    reporters: ['super-dots', 'mocha'],
    colors: true,
    mochaReporter: {
      output: 'minimal',
    },

    port: 8080,

    // base path, that will be used to resolve files and exclude
    basePath: '.',

    // Start these browsers, currently available:
    // Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: { base: 'ChromeHeadless', flags: ['--no-sandbox'] },
    },

    frameworks: ['jasmine'],

    plugins: [
      require('karma-webpack'),
      require('karma-sourcemap-loader'),
      require('karma-super-dots-reporter'),
      require('karma-mocha-reporter'),
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
    ],

    webpack: {
      mode: 'development',
      resolve: {
        modules: ['node_modules'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },

      devtool: 'inline-source-map',

      module: {
        rules: [{ test: /\.tsx?$/, loader: 'ts-loader', options: { transpileOnly: true } }],
      },

      plugins: [new ForkTsCheckerWebpackPlugin()],

      externals: ['angular'],
    },

    webpackMiddleware: {
      stats: 'minimal',
    },

    /* Files *available to be served* by karma, i.e., anything that will be require()'d */
    files: karmaServedFiles(ngVersion),

    preprocessors: {
      'test/index.js': ['webpack', 'sourcemap'],
      '../src/ng1': ['webpack', 'sourcemap'],
    },
  });
};
