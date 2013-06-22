/*jshint browser: true, indent: 2 */
/*global describe: false, it: false, beforeEach: false, expect: false, resolvedValue: false, module: false, inject: false, angular: false */

describe('uiView', function () {
  'use strict';

  var scope, $compile, elem;

  beforeEach(module('ui.state'));

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
    it('anonymous ui-view should be replaced with the template of the current $state', inject(function ($state, $q) {
      elem.append($compile('<div ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      expect(elem.text()).toBe(aState.template);
    }));

    it('named ui-view should be replaced with the template of the current $state', inject(function ($state, $q) {
      elem.append($compile('<div ui-view="cview"></div>')(scope));

      $state.transitionTo(cState);
      $q.flush();

      expect(elem.text()).toBe(cState.views.cview.template);
    }));

    it('ui-view should be updated after transition to another state', inject(function ($state, $q) {
      elem.append($compile('<div ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      expect(elem.text()).toBe(aState.template);

      $state.transitionTo(bState);
      $q.flush();

      expect(elem.text()).toBe(bState.template);
    }));

    it('should handle NOT nested ui-views', inject(function ($state, $q) {
      elem.append($compile('<div ui-view="dview1" class="dview1"></div><div ui-view="dview2" class="dview2"></div>')(scope));

      $state.transitionTo(dState);
      $q.flush();

      expect(elem[0].querySelector('.dview1').innerText).toBe(dState.views.dview1.template);
      expect(elem[0].querySelector('.dview2').innerText).toBe(dState.views.dview2.template);
    }));

    it('should handle nested ui-views (testing two levels deep)', inject(function ($state, $q) {
      elem.append($compile('<div ui-view class="view"></div>')(scope));

      $state.transitionTo(fState);
      $q.flush();

      expect(elem[0].querySelector('.view').querySelector('.eview').innerText).toBe(fState.views.eview.template);
    }));
  });

  describe('handling initial view', function () {
    it('initial view should be compiled if the view is empty', inject(function ($state, $q) {
      var content = 'inner content';

      elem.append($compile('<div ui-view></div>')(scope));
      scope.$apply('content = "' + content + '"');

      $state.transitionTo(gState);
      $q.flush();

      expect(elem[0].querySelector('.test').innerText).toBe(content);
    }));

    it('initial view should be put back after removal of the view', inject(function ($state, $q) {
      var content = 'inner content';

      elem.append($compile('<div ui-view></div>')(scope));
      scope.$apply('content = "' + content + '"');

      $state.transitionTo(hState);
      $q.flush();

      expect(elem.text()).toBe(hState.views.inner.template);

      // going to the parent state which makes the inner view empty
      $state.transitionTo(gState);
      $q.flush();

      expect(elem[0].querySelector('.test').innerText).toBe(content);
    }));
  });

});
