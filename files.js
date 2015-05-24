routerFiles = {
  src: [
    'src/common.js',
    'src/resolve.js',
    'src/templateFactory.js',
    'src/urlMatcherFactory.js',
    'src/transition.js',
    'src/urlRouter.js',
    'src/state.js',
    'src/view.js',
    'src/viewScroll.js',
    'src/viewDirective.js',
    'src/stateDirectives.js',
    'src/stateFilters.js',
    'src/stateEvents.js'
  ],
  testUtils: [
    'test/testUtils.js'
  ],
  test: [
    'test/commonSpec.js',
    'test/resolveSpec.js',
    //'test/stateDirectivesSpec.js',
    'test/stateEventsSpec.js',
    'test/stateSpec.js',
    //'test/templateFactorySpec.js',
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
