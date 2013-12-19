/*jshint browser: true, indent: 2 */
/*global describe: false, it: false, beforeEach: false, expect: false, resolvedValue: false, module: false, inject: false, angular: false */

describe('uiView', function () {
  'use strict';

  var scope, $compile, elem;

  beforeEach(function() {
    angular.module('ui.router.test', ['ui.router', 'ngAnimate']);
    module('ui.router.test');
    module('mock.animate');
  });

  beforeEach(module(function ($provide) {
    $provide.decorator('$uiViewScroll', function ($delegate) {
      return jasmine.createSpy('$uiViewScroll');
    });
  }));

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
  },
  iState = {
    template: '<div ui-view>'+
        '<ul><li ng-repeat="item in items">{{item}}</li></ul>'+
      '</div>'
  },
  jState = {
    template: '<span ng-class="test">jState</span>'
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
      .state('g.h', hState)
      .state('i', iState)
      .state('j', jState);
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

      expect($animate.flushNext('leave').element.text()).toBe('');
      expect($animate.flushNext('enter').element.text()).toBe(aState.template);
    }));

    it('named ui-view should be replaced with the template of the current $state', inject(function ($state, $q, $animate) {
      elem.append($compile('<div ui-view="cview"></div>')(scope));

      $state.transitionTo(cState);
      $q.flush();

      expect($animate.flushNext('leave').element.text()).toBe('');
      expect($animate.flushNext('enter').element.text()).toBe(cState.views.cview.template);
    }));

    it('ui-view should be updated after transition to another state', inject(function ($state, $q, $animate) {
      elem.append($compile('<div ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      expect($animate.flushNext('leave').element.text()).toBe('');
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

      // expect(elem[0].querySelector('.dview1')).toMatchText(dState.views.dview1.template);
      // expect(elem[0].querySelector('.dview2')).toMatchText(dState.views.dview2.template);

      expect($animate.flushNext('leave').element.html()).toBeUndefined();
      expect($animate.flushNext('enter').element.html()).toBe(dState.views.dview1.template);
      expect($animate.flushNext('leave').element.html()).toBeUndefined();
      expect($animate.flushNext('enter').element.html()).toBe(dState.views.dview2.template);
    }));

    it('should handle nested ui-views (testing two levels deep)', inject(function ($state, $q, $animate) {
      elem.append($compile('<div ui-view class="view"></div>')(scope));

      $state.transitionTo(fState);
      $q.flush();

      // expect(elem[0].querySelector('.view').querySelector('.eview')).toMatchText(fState.views.eview.template);

      expect($animate.flushNext('leave').element.text()).toBe('');
      expect($animate.flushNext('enter').element.parent().parent()[0].querySelector('.view').querySelector('.eview')).toMatchText(fState.views.eview.template);
    }));
  });

  describe('handling initial view', function () {
    it('initial view should be compiled if the view is empty', inject(function ($state, $q, $animate) {
      var content = 'inner content';

      elem.append($compile('<div ui-view></div>')(scope));
      scope.$apply('content = "' + content + '"');

      $state.transitionTo(gState);
      $q.flush();

      // expect(elem[0].querySelector('.test')).toMatchText(content);

      expect($animate.flushNext('leave').element.text()).toBe("");
      expect($animate.flushNext('enter').element.text()).toBe(content);

      // For some reason the ng-class expression is no longer evaluated
      expect($animate.flushNext('addClass').element.parent()[0].querySelector('.test')).toMatchText(content);
    }));

    it('initial view should be put back after removal of the view', inject(function ($state, $q, $animate) {
      var content = 'inner content';

      elem.append($compile('<div ui-view></div>')(scope));
      scope.$apply('content = "' + content + '"');

      $state.transitionTo(hState);
      $q.flush();

      expect($animate.flushNext('leave').element.text()).toBe('');
      expect($animate.flushNext('enter').element.text()).toBe(hState.views.inner.template);

      expect($animate.flushNext('addClass').element.text()).toBe(hState.views.inner.template);
      expect($animate.flushNext('addClass').element.text()).toBe(hState.views.inner.template);

      // going to the parent state which makes the inner view empty
      $state.transitionTo(gState);
      $q.flush();

      // expect(elem[0].querySelector('.test')).toMatchText(content);

      expect($animate.flushNext('leave').element.text()).toBe(hState.views.inner.template);
      expect($animate.flushNext('enter').element.text()).toBe(content);
    }));

    // related to issue #435
    it('initial view should be transcluded once to prevent breaking other directives', inject(function ($state, $q) {
      scope.items = ["I", "am", "a", "list", "of", "items"];

      elem.append($compile('<div ui-view></div>')(scope));

      // transition to state that has an initial view
      $state.transitionTo(iState);
      $q.flush();

      // verify if ng-repeat has been compiled
      expect(elem.find('li').length).toBe(scope.items.length);

      // transition to another state that replace the initial content
      $state.transitionTo(jState);
      $q.flush();

      expect(elem.text()).toBe('jState');

      // transition back to the state with empty subview and the initial view
      $state.transitionTo(iState);
      $q.flush();

      // verify if the initial view is correct
      expect(elem.find('li').length).toBe(scope.items.length);

      // change scope properties
      scope.$apply(function () {
        scope.items.push(".", "Working?");
      });

      // verify if the initial view has been updated
      expect(elem.find('li').length).toBe(scope.items.length);
    }));
  });

  describe('autoscroll attribute', function () {
    it('should autoscroll when unspecified', inject(function ($state, $q, $uiViewScroll) {
      elem.append($compile('<div ui-view></div>')(scope));
      $state.transitionTo(aState);
      $q.flush();
      expect($uiViewScroll).toHaveBeenCalledWith(elem.find('div'));
    }));

    it('should autoscroll when expression is missing', inject(function ($state, $q, $uiViewScroll) {
      elem.append($compile('<div ui-view autoscroll></div>')(scope));
      $state.transitionTo(aState);
      $q.flush();
      expect($uiViewScroll).toHaveBeenCalledWith(elem.find('div'));
    }));

    it('should autoscroll based on expression', inject(function ($state, $q, $uiViewScroll) {
      elem.append($compile('<div ui-view autoscroll="doScroll"></div>')(scope));

      scope.doScroll = false;
      $state.transitionTo(aState);
      $q.flush();
      expect($uiViewScroll).not.toHaveBeenCalled();

      scope.doScroll = true;
      $state.transitionTo(bState);
      $q.flush();
      expect($uiViewScroll).toHaveBeenCalledWith(elem.find('div'));
    }));
  });

});
