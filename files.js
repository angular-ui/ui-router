routerFiles = {
  buildSrc: [
    './build/ts2es5/ui-router.js'
  ],
  buildDest: [
    'build/angular-ui-router.js'
  ],
  src: [
    'src/ui-router.ts',
    'src/resolve.ts',
    'src/templateFactory.ts',
    'src/urlMatcherFactory.ts',
    'src/transition.ts',
    'src/urlRouter.ts',
    'src/state.ts',
    'src/view.ts',
    'src/viewScroll.ts',
    'src/viewDirective.ts',
    'src/stateDirectives.ts',
    'src/stateFilters.ts',
    'src/stateEvents.ts',
    'src/trace.ts'
  ],
  testUtils: [
    'test/testUtils.js',
    'test/compat/matchers.js'
  ],
  test: [
    'test/commonSpec.js',
    'test/globSpec.js',
    'test/resolveSpec.js',
    //'test/stateDirectivesSpec.js',
    'test/stateEventsSpec.js',
    'test/stateFiltersSpec.js',
    'test/stateSpec.js',
    'test/templateFactorySpec.js',
    'test/transitionSpec.js',
    'test/urlMatcherFactorySpec.js',
    'test/urlRouterSpec.js',
    //'test/viewDirectiveSpec.js',
    //'test/viewScrollSpec.js',
    'test/compat/matchers.js'
  ],
  angular: function(version) {
    return [
      'lib/angular-' + version + '/angular.js',
      'lib/angular-' + version + '/angular-mocks.js',
      'lib/angular-' + version + '/angular-animate.js'
    ];
  }
};

if (exports) {
  exports.files = routerFiles;
}
