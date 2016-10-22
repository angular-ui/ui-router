// Karma configuration file
var karma = require("karma");

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
      'test/util/ng1.systemjs.adapter.js'
    ];
  }

  var angularFiles = angular(ngVersion).map(function (pattern) {
    return { watched: false, included: true, nocache: true, pattern: pattern };
  });

  var srcFiles = [
    { watched: true, included: false, nocache: true, pattern: 'src/**/*.ts' },
  ];

  var testFiles = [
    { watched: true, included: false, nocache: true, pattern: 'test/**/*.ts' },
    { watched: true, included: false, nocache: true, pattern: 'test/**/*.js' }
  ];

  return [].concat(angularFiles).concat(srcFiles).concat(testFiles);
}

module.exports = function(config) {
  var ngVersion = config.ngversion || "1.5.0";

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

    frameworks: ['systemjs', 'jasmine'],

    plugins: [
      require('karma-systemjs'),
      require('karma-jasmine'),
      require('karma-phantomjs-launcher'),
      require('karma-chrome-launcher')
    ],

    /* Files *available to be served* by karma, i.e., anything that will be require()'d */
    files: karmaServedFiles(ngVersion),
    exclude: [],
    systemjs: {
      // Set up systemjs paths
      configFile: 'karma.system.config.js',

      files: [
        'src/**/*.ts',
        'node_modules/ui-router-core/lib/**/*'
      ],

      // karma-systemjs kludge: This is turned into a regexp and is the actual specs that are loaded
      testFileSuffix: "/test/\\S+Spec.[tj]s"
    },
  });
};
