/*jshint browser: true, indent: 2 */
/*global describe: false, it: false, beforeEach: false, expect: false, resolvedValue: false, module: false, inject: false, angular: false */

/*innerText shim for Firefox */
function innerText(elem) {
  if (/firefox/i.test(navigator.userAgent)) {
    return elem.textContent;
  } else {
    return elem.innerText;
  }
}

describe('uiView', function () {
  'use strict';

  var scope, $compile, elem;

  beforeEach(function() {
    angular.module('ui.router.test', ['ui.router', 'ngAnimate']);
    module('ui.router.test');
    module('mock.animate');
  });

  var aState = {
    template: 'aState template'
  },
  bState = {
    template: 'bState template'
  },
  cState = {
    views: {
      'cview': {
        template: 'cState cview template'
      }
    }
  },
  dState = {
    views: {
      'dview1': {
        template: 'dState dview1 template'
      },
      'dview2': {
        template: 'dState dview2 template'
      }
    }
  },
  eState = {
    template: '<div ui-view="eview" class="eview"></div>'
  },
  fState = {
    views: {
      'eview': {
        template: 'fState eview template'
      }
    }
  },
  gState = {
    template: '<div ui-view="inner"><span ng-class="{ test: true }">{{content}}</span></div>'
  },
  hState = {
    views: {
      'inner': {
        template: 'hState inner template'
      }
    }
  };

  beforeEach(module(function ($stateProvider) {
    $stateProvider
      .state('a', aState)
      .state('b', bState)
      .state('c', cState)
      .state('d', dState)
      .state('e', eState)
      .state('e.f', fState)
      .state('g', gState)
      .state('g.h', hState);
  }));

  beforeEach(inject(function ($rootScope, _$compile_) {
    scope = $rootScope.$new();
    $compile = _$compile_;
    elem = angular.element('<div>');
  }));

  describe('linking ui-directive', function () {
    it('anonymous ui-view should be replaced with the template of the current $state', inject(function ($state, $q, $animate) {
      elem.append($compile('<div ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      expect($animate.flushNext('enter').element.text()).toBe(aState.template);
    }));

    it('named ui-view should be replaced with the template of the current $state', inject(function ($state, $q, $animate) {
      elem.append($compile('<div ui-view="cview"></div>')(scope));

      $state.transitionTo(cState);
      $q.flush();

      expect($animate.flushNext('enter').element.text()).toBe(cState.views.cview.template);
    }));

    it('ui-view should be updated after transition to another state', inject(function ($state, $q, $animate) {
      elem.append($compile('<div ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      expect($animate.flushNext('enter').element.text()).toBe(aState.template);

      $state.transitionTo(bState);
      $q.flush();

      expect($animate.flushNext('leave').element.text()).toBe(aState.template);
      expect($animate.flushNext('enter').element.text()).toBe(bState.template);
    }));

    it('should handle NOT nested ui-views', inject(function ($state, $q, $animate) {
      elem.append($compile('<div ui-view="dview1" class="dview1"></div><div ui-view="dview2" class="dview2"></div>')(scope));

      $state.transitionTo(dState);
      $q.flush();

      expect($animate.flushNext('enter').element.text()).toBe(dState.views.dview1.template);
      expect($animate.flushNext('enter').element.text()).toBe(dState.views.dview2.template);
    }));

    it('should handle nested ui-views (testing two levels deep)', inject(function ($state, $q, $animate) {
      $compile(elem.append('<div ui-view class="view"></div>'))(scope);

      $state.transitionTo(fState);
      $q.flush();

      expect(innerText($animate.flushNext('enter').element.parent()[0].querySelector('.view').querySelector('.eview'))).toBe(fState.views.eview.template);
    }));
  });

  describe('handling initial view', function () {
    it('should be compiled if the view is empty', inject(function ($state, $q, $animate) {
      var content = 'inner content';

      elem.append($compile('<div ui-view></div>')(scope));
      scope.$apply('content = "' + content + '"');

      $state.transitionTo(gState);
      $q.flush();

      // Enter and leave ui-view insert of template
      $animate.flushNext('enter');
      $animate.flushNext('leave');
      // Enter again after $scope.digest()
      expect($animate.flushNext('enter').element.text()).toEqual(content);
      // Evaluate addClass
      var item = $animate.flushNext('addClass').element;
      expect(item.text()).toEqual(content);
    }));

    it('should be put back after removal of the view', inject(function ($state, $q, $animate) {
      var content = 'inner content';

      elem.append($compile('<div ui-view></div>')(scope));
      scope.$apply('content = "' + content + '"');

      $state.transitionTo(hState);
      $q.flush();

      expect($animate.queue.length).toEqual(3);
      expect($animate.flushNext('enter').element.text()).toBe(hState.views.inner.template);

      // Remove the addClass observers which have been replaced.
      $animate.queue = [];

      // going to the parent state which makes the inner view empty
      $state.transitionTo(gState);
      $q.flush();

      expect($animate.flushNext('leave').element.text()).toBe(hState.views.inner.template);
      expect($animate.flushNext('enter').element.text()).toBe(content);
    }));
  });

});
