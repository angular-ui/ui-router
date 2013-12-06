// Testacular configuration file
module.exports = function (karma) {
  karma.set({
    // base path, that will be used to resolve files and exclude
    basePath: '..',

    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'lib/angular-1.1.5.js',
      'test/lib/angular-mocks-1.1.5.js',
      'test/testUtils.js',

      'src/common.js',
      'src/resolve.js',
      'src/templateFactory.js',
      'src/urlMatcherFactory.js',
      'src/urlRouter.js',
      'src/view.js',
      'src/state.js',
      'src/viewDirective.js',
      'src/stateDirectives.js',
      'src/stateFilters.js',
      'src/compat.js',

      'test/*Spec.js',
      // 'test/compat/matchers.js',
      // 'test/compat/*Spec.js',
    ],

    // list of files to exclude
    exclude: [],

    // use dots reporter, as travis terminal does not support escaping sequences
    // possible values: 'dots' || 'progress'
    reporters: 'dots',

    // these are default values, just to show available options

    // web server port
    port: 8080,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: karma.LOG_DEBUG,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // polling interval in ms (ignored on OS that support inotify)
    autoWatchInterval: 0,

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