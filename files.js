routerFiles = {
  ng1CommonJsEntrypoint: ['./build/es5/ng1.js'],
  ng2CommonJsEntrypoint: ['./build/es5/ng2.js'],
  justjsCommonJsEntrypoint: ['./build/es5/justjs.js'],
  // es6Entrypoint:      ['./build/es6/ng1.js'],

  src:                [
    'src/ng1.ts', // UI-Router angular1 module (re-exports ui-router and ng1 modules)
    'src/ng1/stateEvents.ts' // There might be a better approach to compiling this file
    //'src/ui-router.ts', // Main UI-Router module (re-exports all other core modules)
    //'src/ng2.ts', // UI-Router angular2 module (re-exports ui-router and ng2 modules)
    //'src/justjs.ts', // UI-Router plain ol js module (re-exports ui-router)
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
