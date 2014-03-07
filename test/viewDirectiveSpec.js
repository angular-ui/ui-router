/*jshint browser: true, indent: 2 */
/*global describe: false, it: false, beforeEach: false, expect: false, resolvedValue: false, module: false, inject: false, angular: false */

describe('uiView', function () {
  'use strict';

  var scope, $compile, elem;

  beforeEach(function() {
    var depends = ['ui.router'];

    try {
      angular.module('ngAnimateMock');
      depends.push('ngAnimateMock');
    } catch(e) {
      angular.module('mock.animate', []).value('$animate', null);
      module('mock.animate');
    }

    angular.module('ui.router.test', depends);
    module('ui.router.test');
  });

  beforeEach(module(function ($provide) {
    $provide.decorator('$uiViewScroll', function () {
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
    template: '<div ui-view="inner"><span>{{content}}</span></div>'
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
    template: 'jState'
  },
  kState = {
    controller: function() {
      this.someProperty = "value"
    },
    controllerAs: "vm"
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
      .state('j', jState)
      .state('k', kState)
  }));

  beforeEach(inject(function ($rootScope, _$compile_) {
    scope = $rootScope.$new();
    $compile = _$compile_;
    elem = angular.element('<div>');
  }));

  describe('linking ui-directive', function () {

    it('anonymous ui-view should be replaced with the template of the current $state', inject(function ($state, $q) {
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      expect(elem.find('ui-view').text()).toBe('');

      $state.transitionTo(aState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(aState.template);
    }));

    it('named ui-view should be replaced with the template of the current $state', inject(function ($state, $q) {
      elem.append($compile('<div><ui-view name="cview"></ui-view></div>')(scope));

      $state.transitionTo(cState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(cState.views.cview.template);
    }));

    it('ui-view should be updated after transition to another state', inject(function ($state, $q) {
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));
      expect(elem.find('ui-view').text()).toBe('');

      $state.transitionTo(aState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(aState.template);

      $state.transitionTo(bState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(bState.template);
    }));

    it('should handle NOT nested ui-views', inject(function ($state, $q) {
      elem.append($compile('<div><ui-view name="dview1" class="dview1"></ui-view><ui-view name="dview2" class="dview2"></ui-view></div>')(scope));
      expect(elem.find('ui-view').eq(0).text()).toBe('');
      expect(elem.find('ui-view').eq(1).text()).toBe('');

      $state.transitionTo(dState);
      $q.flush();

      expect(elem.find('ui-view').eq(0).text()).toBe(dState.views.dview1.template);
      expect(elem.find('ui-view').eq(1).text()).toBe(dState.views.dview2.template);
    }));

    it('should handle nested ui-views (testing two levels deep)', inject(function ($state, $q) {
      $compile(elem.append('<div><ui-view></ui-view></div>'))(scope);
      expect(elem.find('ui-view').text()).toBe('');

      $state.transitionTo(fState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(fState.views.eview.template);
    }));
  });

  describe('handling initial view', function () {
    it('initial view should be compiled if the view is empty', inject(function ($state, $q) {
      var content = 'inner content';
      scope.content = content;
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      $state.transitionTo(gState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(content);
    }));

    it('initial view should be put back after removal of the view', inject(function ($state, $q) {
      var content = 'inner content';
      scope.content = content;
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      $state.go(hState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(hState.views.inner.template);

      // going to the parent state which makes the inner view empty
      $state.go(gState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(content);
    }));

    // related to issue #435
    it('initial view should be transcluded once to prevent breaking other directives', inject(function ($state, $q) {
      scope.items = ["I", "am", "a", "list", "of", "items"];

      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      // transition to state that has an initial view
      $state.transitionTo(iState);
      $q.flush();

      // verify if ng-repeat has been compiled
      expect(elem.find('li').length).toBe(scope.items.length);

      // transition to another state that replace the initial content
      $state.transitionTo(jState);
      $q.flush();

      expect(elem.find('ui-view').text()).toBe(jState.template);

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

    // related to issue #857
    it('should handle ui-view inside ng-if', inject(function ($state, $q, $compile) {
      // ngIf does not exist in 1.0.8
      if (angular.version.full === '1.0.8') return;

      scope.someBoolean = false;
      elem.append($compile('<div ng-if="someBoolean"><ui-view></ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      // Verify there is no ui-view in the DOM
      expect(elem.find('ui-view').length).toBe(0);

      // Turn on the div that holds the ui-view
      scope.someBoolean = true;
      scope.$digest();

      // Verify that the ui-view is there and it has the correct content
      expect(elem.find('ui-view').text()).toBe(aState.template);

      // Turn off the ui-view
      scope.someBoolean = false;
      scope.$digest();

      // Verify there is no ui-view in the DOM
      expect(elem.find('ui-view').length).toBe(0);

      // Turn on the div that holds the ui-view once again
      scope.someBoolean = true;
      scope.$digest();

      // Verify that the ui-view is there and it has the correct content
      expect(elem.find('ui-view').text()).toBe(aState.template);
    }));
  });

  describe('autoscroll attribute', function () {
    it('should NOT autoscroll when unspecified', inject(function ($state, $q, $uiViewScroll, $animate) {
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      if ($animate) $animate.triggerCallbacks();

      expect($uiViewScroll).not.toHaveBeenCalled();
    }));

    it('should autoscroll when expression is missing', inject(function ($state, $q, $uiViewScroll, $animate) {
      elem.append($compile('<div><ui-view autoscroll></ui-view></div>')(scope));
      $state.transitionTo(aState);
      $q.flush();

      if ($animate) $animate.triggerCallbacks();

      expect($uiViewScroll).toHaveBeenCalledWith(elem.find('span').parent());
    }));

    it('should autoscroll based on expression', inject(function ($state, $q, $uiViewScroll, $animate) {
      scope.doScroll = false;

      elem.append($compile('<div><ui-view autoscroll="doScroll"></ui-view></div>')(scope));

      $state.transitionTo(aState);
      $q.flush();

      if ($animate) $animate.triggerCallbacks();

      expect($uiViewScroll).not.toHaveBeenCalled();

      scope.doScroll = true;
      $state.transitionTo(bState);
      $q.flush();

      if ($animate) $animate.triggerCallbacks();

      var target,
          index   = -1,
          uiViews = elem.find('ui-view');

      while (index++ < uiViews.length) {
        var uiView = angular.element(uiViews[index]);
        if (uiView.text() === bState.template) target = uiView;
      }

      expect($uiViewScroll).toHaveBeenCalledWith(target);
    }));
  });

  it('should instantiate a controller with controllerAs', inject(function($state, $q) {
    elem.append($compile('<div><ui-view>{{vm.someProperty}}</ui-view></div>')(scope));
    $state.transitionTo(kState);
    $q.flush();

    expect(elem.text()).toBe('value');
  }));
});
