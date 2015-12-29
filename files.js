routerFiles = {
  commonJsEntrypoint: ['./build/es5/ui-router.js'],
  es6Entrypoint:      ['./build/es6/ui-router.js'],

  buildDest:          ['build/angular-ui-router.js'], // The distribution file
  src:                [
    'src/ui-router.ts', // Main UI-Router module (imports everything else)
    'src/ng1/stateEvents.ts' // There might be a better approach to compiling this file
  ],

  // Test helpers
  testUtils: [
    'test/testUtils.js',
    'test/compat/matchers.js'
  ],

  // Returns necessary files for a specific version of angular
  angular: function(version) {
    return [
      'lib/angular-' + version + '/angular.js',
      'lib/angular-' + version + '/angular-mocks.js',
      'lib/angular-' + version + '/angular-animate.js'
    ];
  },

  // This returns a Karma 'files configuration' for the files served by the Karma web server
  // http://karma-runner.github.io/0.8/config/files.html
  karmaServedFiles: function(version) {
    return routerFiles.angular(version).map(function (pattern) {
      return { watched: false, included: true, nocache: true, pattern: pattern };
    }).concat([
      { watched: true, included: false, nocache: true, pattern: 'src/**/*.ts' },
      { watched: true, included: false, nocache: true, pattern: 'test/**/*.ts' },
      { watched: true, included: false, nocache: true, pattern: 'test/**/*.js' }
    ]);
  }
};

if (exports) {
  exports.files = routerFiles;
}
