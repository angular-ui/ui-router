routerFiles = {
  buildSrc: [
    './build/ts2es5/ui-router.js',
    './build/ts2es5/resolve.js',
    './build/ts2es5/templateFactory.js',
    './build/ts2es5/urlMatcherFactory.js',
    './build/ts2es5/transition.js',
    './build/ts2es5/urlRouter.js',
    './build/ts2es5/state.js',
    './build/ts2es5/view.js',
    './build/ts2es5/viewScroll.js',
    './build/ts2es5/viewDirective.js',
    './build/ts2es5/stateDirectives.js',
    './build/ts2es5/stateFilters.js',
    './build/ts2es5/stateEvents.js',
    './build/ts2es5/trace.js'
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
    'test/testUtils.js'
  ],
  test: [
    'test/commonSpec.js',
    'test/globSpec.js',
    'test/resolveSpec.js',
    //'test/stateDirectivesSpec.js',
    'test/stateEventsSpec.js',
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
      'lib/angular-' + version + '/angular-mocks.js'
    ].concat(['1.2.14', '1.3.0-rc.1'].indexOf(version) !== -1 ? ['lib/angular-' + version + '/angular-animate.js'] : []);
  }
};

if (exports) {
  exports.files = routerFiles;
}
