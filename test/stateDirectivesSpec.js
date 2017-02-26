var module = angular.mock.module;
var uiRouter = require("../src/index");
var obj = require('./util/testUtilsNg1').obj;

describe('uiStateRef', function() {

  var timeoutFlush, el, el2, template, scope, document, _locationProvider;

  beforeEach(module('ui.router'));

  beforeEach(module(function($stateProvider, $locationProvider) {
    _locationProvider = $locationProvider;
    $locationProvider.hashPrefix('');
    $stateProvider.state('top', {
      url: ''
    }).state('other', {
      url: '/other/:id',
      template: 'other'
    }).state('other.detail', {
      url: '/detail',
      template: 'detail'
    }).state('contacts', {
      url: '/contacts',
      template: '<a ui-sref=".item({ id: 5 })" class="item">Person</a> <ui-view></ui-view>'
    }).state('contacts.item', {
      url: '/{id:int}',
      template: '<a ui-sref=".detail" class="item-detail">Detail</a> | <a ui-sref="^" class="item-parent">Parent</a> | <ui-view></ui-view>'
    }).state('contacts.item.detail', {
      template: '<div class="title">Detail</div> | <a ui-sref="^" class="item-parent2">Item</a>'
    });
  }));

  beforeEach(inject(function($document, $timeout) {
    document = $document[0];
    timeoutFlush = function () {
      try {
        $timeout.flush();
      } catch (e) {
        // Angular 1.0.8 throws 'No deferred tasks to be flushed' if there is nothing in queue.
        // Behave as Angular >=1.1.5 and do nothing in such case.
      }
    }
  }));

  function triggerClick(el, options) {
    options = angular.extend({
      metaKey:  false,
      ctrlKey:  false,
      shiftKey: false,
      altKey:   false,
      button:   0
    }, options || {});

    var e = document.createEvent("MouseEvents");
    e.initMouseEvent(
      "click", // typeArg of type DOMString, Specifies the event type.
      true, // canBubbleArg of type boolean, Specifies whether or not the event can bubble.
      true, // cancelableArg of type boolean, Specifies whether or not the event's default action can be prevented.
      undefined, // viewArg of type views::AbstractView, Specifies the Event's AbstractView.
      0, // detailArg of type long, Specifies the Event's mouse click count.
      0, // screenXArg of type long, Specifies the Event's screen x coordinate
      0, // screenYArg of type long, Specifies the Event's screen y coordinate
      0, // clientXArg of type long, Specifies the Event's client x coordinate
      0, // clientYArg of type long, Specifies the Event's client y coordinate
      options.ctrlKey, // ctrlKeyArg of type boolean, Specifies whether or not control key was depressed during the Event.
      options.altKey, // altKeyArg of type boolean, Specifies whether or not alt key was depressed during the Event.
      options.shiftKey, // shiftKeyArg of type boolean, Specifies whether or not shift key was depressed during the Event.
      options.metaKey, // metaKeyArg of type boolean, Specifies whether or not meta key was depressed during the Event.
      options.button, // buttonArg of type unsigned short, Specifies the Event's mouse button.
      null // relatedTargetArg of type EventTarget
    );
    el[0].dispatchEvent(e);
  }

  function triggerHTMLEvent(name) {
    var event = document.createEvent('HTMLEvents');
    event.initEvent(name, false, true);
    el[0].dispatchEvent(event);
  }

  function triggerMouseEvent(name) {
    var event = document.createEvent('MouseEvents');
    event.initEvent(name, true, true);
    el[0].dispatchEvent(event);
  }

  describe('links with promises', function() {

    it('should update the href when promises on parameters change before scope is applied', inject(function($rootScope, $compile, $q) {
      var defer = $q.defer();
      el = angular.element('<a ui-sref="contacts.item.detail({ id: contact.id })">Details</a>');

      $rootScope.contact = defer.promise;
      defer.resolve({ id: 6 });

      $compile(el)($rootScope);
      $rootScope.$digest();

      // HACK: Promises no longer auto-unwrap in 1.2.x+
      if ($rootScope.contact.$$resolved && $rootScope.contact.$$resolved.value) {
        $rootScope.contact = $rootScope.contact.$$resolved.value;
        $rootScope.$digest();
      }

      expect(el.attr('href')).toBe('#/contacts/6');
    }));
  });


  function buildDOM($rootScope, $compile, $timeout) {
    el = angular.element('<a ui-sref="contacts.item.detail({ id: contact.id })">Details</a>');
    el2 = angular.element('<a ui-sref="top">Top</a>');
    scope = $rootScope;
    scope.contact = { id: 5 };
    scope.$apply();

    $compile(el)(scope);
    $compile(el2)(scope);
    scope.$digest();
  };

  describe('links', function() {
    beforeEach(inject(buildDOM));

    it('should generate the correct href', function() {
      expect(el.attr('href')).toBe('#/contacts/5');
      expect(el2.attr('href')).toBe('#');
    });

    it('should update the href when parameters change', function() {
      expect(el.attr('href')).toBe('#/contacts/5');
      scope.contact.id = 6;
      scope.$apply();
      expect(el.attr('href')).toBe('#/contacts/6');
    });

    it('should allow multi-line attribute values', inject(function($compile, $rootScope) {
      el = angular.element("<a ui-sref=\"contacts.item.detail({\n\tid: $index\n})\">Details</a>");
      $rootScope.$index = 3;
      $rootScope.$apply();

      $compile(el)($rootScope);
      $rootScope.$digest();
      expect(el.attr('href')).toBe('#/contacts/3');
    }));

    it('should transition states when left-clicked', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');

      triggerClick(el);
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('contacts.item.detail');
      expect(obj($stateParams)).toEqualData({ id: 5 });
    }));

    if (/PhantomJS/.exec(navigator.userAgent)) {
    it('should transition when given a click that contains no data (fake-click)', inject(function($state, $stateParams, $q) {
      expect($state.current.name).toEqual('top');

      triggerClick(el, {
        metaKey:  undefined,
        ctrlKey:  undefined,
        shiftKey: undefined,
        altKey:   undefined,
        button:   undefined
      });
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('contacts.item.detail');
      expect(obj($stateParams)).toEqualData({ id: 5 });
    }));

    it('should not transition states when ctrl-clicked', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});

      triggerClick(el, { ctrlKey: true });

      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({ });
    }));

    it('should not transition states when meta-clicked', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});

      triggerClick(el, { metaKey: true });
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});
    }));

    it('should not transition states when shift-clicked', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});

      triggerClick(el, { shiftKey: true });
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});
    }));

    it('should not transition states when middle-clicked', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});

      triggerClick(el, { button: 1 });
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});
    }));

    it('should not transition states when element has target specified', inject(function($state, $stateParams, $q) {
      el.attr('target', '_blank');
      expect($state.$current.name).toEqual('top');

      triggerClick(el);
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});
    }));
    }

    it('should not transition states if preventDefault() is called in click handler', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});

      el.bind('click', function(e) {
        e.preventDefault();
      });

      triggerClick(el);
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});
    }));

    // Test for #1031
    it('should allow passing params to current state', inject(function($compile, $rootScope, $state, $q) {
      $state.go('other', { id: 'abc' });
      $rootScope.$index = 'def';
      $rootScope.$digest();

      el = angular.element("<a ui-sref=\"{id: $index}\">Details</a>");
      $compile(el)($rootScope);
      $rootScope.$digest();

      expect($state.current.name).toBe('other');
      expect($state.params).toEqualValues({ id: 'abc' });
      expect(el.attr('href')).toBe('#/other/def');

      triggerClick(el);
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toBe('other');
      expect($state.params).toEqualValues({ id: 'def' });

      $rootScope.$index = 'ghi';
      $state.go('other.detail');
      $rootScope.$digest();

      expect($state.current.name).toBe('other.detail');
      expect($state.params).toEqualValues({ id: 'def' });

      expect(el.attr('href')).toBe('#/other/ghi/detail');

      triggerClick(el);
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toBe('other.detail');
      expect($state.params).toEqualValues({ id: 'ghi' });

    }));

    it('should allow multi-line attribute values when passing params to current state', inject(function($compile, $rootScope, $state) {
      $state.go('contacts.item.detail', { id: '123' });
      $rootScope.$digest();

      el = angular.element("<a ui-sref=\"{\n\tid: $index\n}\">Details</a>");
      $rootScope.$index = 3;
      $rootScope.$apply();

      $compile(el)($rootScope);
      $rootScope.$digest();
      expect(el.attr('href')).toBe('#/contacts/3');
    }));

    it('should take an object as a parameter and update properly on digest churns', inject(function($rootScope, $q, $compile, $state) {

      el = angular.element('<div><a ui-sref="contacts.item.detail(urlParams)">Contacts</a></div>');
      template = $compile(el)($rootScope);

      $rootScope.urlParams = { id:1 };
      $rootScope.$digest();
      expect(angular.element(template[0].querySelector('a')).attr('href')).toBe('#/contacts/1');

      $rootScope.urlParams.id = 2;
      $rootScope.$digest();
      expect(angular.element(template[0].querySelector('a')).attr('href')).toBe('#/contacts/2');
    }));
  });

  describe('links in html5 mode', function() {
    beforeEach(function() {
      _locationProvider.html5Mode(true);
    });

    beforeEach(inject(buildDOM));

    it('should generate the correct href', function() {
      expect(el.attr('href')).toBe('/contacts/5');
      expect(el2.attr('href')).toBe('');
    });

    it('should update the href when parameters change', function() {
      expect(el.attr('href')).toBe('/contacts/5');
      scope.contact.id = 6;
      scope.$apply();
      expect(el.attr('href')).toBe('/contacts/6');
    });

    it('should transition states when the url is empty', inject(function($state, $stateParams, $q) {
      // Odd, in html5Mode, the initial state isn't matching on empty url, but does match if top.url is "/".
//      expect($state.$current.name).toEqual('top');

      triggerClick(el2);
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect(obj($stateParams)).toEqualData({});
    }));
  });

  describe('links with dynamic state definitions', function () {
    var template, $state;

    beforeEach(inject(function($rootScope, $compile, _$state_) {
      $state = _$state_;
      el = angular.element('<a ui-sref-active="active" ui-sref-active-eq="activeeq" ui-state="state" ui-state-params="params">state</a>');
      scope = $rootScope;
      angular.extend(scope, { state: 'contacts', params: {} });
      template = $compile(el)(scope);
      scope.$digest();
    }));

    it('sets the correct initial href', function () {
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts');
    });

    it('updates to the new href', function () {
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts');

      scope.state = 'contacts.item';
      scope.params = { id: 5 };
      scope.$digest();
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts/5');

      scope.params.id = 25;
      scope.$digest();
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts/25');
    });

    it('updates a linked ui-sref-active', inject(function ($timeout) {
      function tick() { scope.$digest(); try { $timeout.flush(); } catch (error) { } }
      expect(template[0].className).not.toContain('active');
      expect(template[0].className).not.toContain('activeeq');

      $state.go('contacts');
      tick();
      expect(template[0].className).toContain('active activeeq');

      scope.state = 'contacts.item';
      scope.params = { id: 5 };
      tick();
      expect(template[0].className).not.toContain('active');
      expect(template[0].className).not.toContain('activeeq');

      $state.go('contacts.item', { id: -5 });
      tick();
      expect(template[0].className).not.toContain('active');
      expect(template[0].className).not.toContain('activeeq');

      $state.go('contacts.item', { id: 5 });
      tick();
      expect(template[0].className).toContain('active activeeq');

      scope.state = 'contacts';
      scope.params = { };
      tick();
      expect(template[0].className).toContain('active');
      expect(template[0].className).not.toContain('activeeq');

    }));

    it('updates to a new href when it points to a new state', function () {
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts');
      scope.state = 'other';
      scope.params = { id: '123' };
      scope.$digest();
      expect(angular.element(template[0]).attr('href')).toBe('#/other/123');
    });

    // Test for #1031
    it('should allow passing params to current state using empty ui-state', inject(function($compile, $rootScope, $state, $q) {
      $state.go('other', { id: 'abc' });
      $rootScope.$index = 'def';
      $rootScope.$digest();

      el = angular.element('<a ui-state="" ui-state-params="{id: $index}">Details</a>');
      $compile(el)($rootScope);
      $rootScope.$digest();

      expect($state.current.name).toBe('other');
      expect($state.params).toEqualValues({ id: 'abc' });
      expect(el.attr('href')).toBe('#/other/def');

      triggerClick(el);
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toBe('other');
      expect($state.params).toEqualValues({ id: 'def' });

      $rootScope.$index = 'ghi';
      $state.go('other.detail');
      $rootScope.$digest();

      expect($state.current.name).toBe('other.detail');
      expect($state.params).toEqualValues({ id: 'def' });

      expect(el.attr('href')).toBe('#/other/ghi/detail');

      triggerClick(el);
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toBe('other.detail');
      expect($state.params).toEqualValues({ id: 'ghi' });
    }));

    it('retains the old href if the new points to a non-state', function () {
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts');
      scope.state = 'nostate';
      scope.$digest();
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts');
    });

    it('accepts param overrides', inject(function ($compile) {
      scope.state  = 'contacts.item';
      scope.params = { id: 10 };
      scope.$digest();
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts/10');
    }));

    it('accepts param overrides', inject(function ($compile) {
      scope.state  = 'contacts.item';
      scope.params = { id: 10 };
      scope.$digest();
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts/10');

      scope.params.id = 22;
      scope.$digest();
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts/22');
    }));

    it('watches attributes', inject(function ($compile) {
      el = angular.element('<a ui-state="{{exprvar}}" ui-state-params="params">state</a>');
      template = $compile(el)(scope);

      scope.exprvar  = 'state1';
      scope.state1  = 'contacts.item';
      scope.state2  = 'other';
      scope.params = { id: 10 };
      scope.$digest();
      expect(angular.element(template[0]).attr('href')).toBe('#/contacts/10');

      scope.exprvar  = 'state2';
      scope.$digest();
      expect(angular.element(template[0]).attr('href')).toBe('#/other/10');
    }));

    if (angular.version.minor >= 3) {
      it('allows one-time-binding on ng1.3+', inject(function ($compile) {
        el = angular.element('<a ui-state="::state" ui-state-params="::params">state</a>');

        scope.state = 'contacts.item';
        scope.params = {id: 10};
        template = $compile(el)(scope);
        scope.$digest();
        expect(angular.element(template[0]).attr('href')).toBe('#/contacts/10');

        scope.state = 'other';
        scope.params = {id: 22};

        scope.$digest();
        expect(angular.element(template[0]).attr('href')).toBe('#/contacts/10');
      }));
    }

    it('accepts option overrides', inject(function ($compile, $timeout, $state) {
      var transitionOptions;

      el = angular.element('<a ui-state="state" ui-state-opts="opts">state</a>');
      scope.state  = 'contacts';
      scope.opts = { reload: true };
      template = $compile(el)(scope);
      scope.$digest();

      spyOn($state, 'go').and.callFake(function(state, params, options) {
        transitionOptions = options;
      });

      triggerClick(template)
      $timeout.flush();

      expect(transitionOptions.reload).toEqual(true);
      expect(transitionOptions.absolute).toBeUndefined();
    }));

    describe('option event', function() {
      it('should bind click event by default', inject(function($compile, $state, $timeout) {
        expect($state.current.name).toBe('top');

        el = angular.element('<a ui-state="state"></a>');

        scope.state = 'contacts';
        $compile(el)(scope);
        scope.$digest();

        triggerClick(el);
        $timeout.flush();

        expect($state.current.name).toBe('contacts');
      }));

      it('should bind single HTML events', inject(function($compile, $state, $timeout) {
        expect($state.current.name).toEqual('top');

        el = angular.element('<input type="text" ui-state="state" ui-state-opts="{ events: [\'change\'] }">');

        scope.state = 'contacts';
        $compile(el)(scope);
        scope.$digest();

        triggerHTMLEvent('change');
        $timeout.flush();

        expect($state.current.name).toEqual('contacts');
      }));

      it('should bind multiple HTML events', inject(function($compile, $state, $timeout) {
        expect($state.current.name).toEqual('top');

        el = angular.element('<input type="text" ui-state="state" ui-state-opts="{ events: [\'change\', \'blur\'] }">');

        scope.state = 'contacts';
        $compile(el)(scope);
        scope.$digest();

        triggerHTMLEvent('change');
        $timeout.flush();
        expect($state.current.name).toEqual('contacts');

        $state.go('top');
        scope.$digest();

        expect($state.current.name).toEqual('top');

        triggerHTMLEvent('blur');
        $timeout.flush();
        expect($state.current.name).toEqual('contacts');
      }));

      it('should bind multiple Mouse events', inject(function($compile, $state, $timeout) {
        expect($state.current.name).toEqual('top');

        el = angular.element('<a ui-state="state" ui-state-opts="{ events: [\'mouseover\', \'mousedown\'] }">');

        scope.state = 'contacts';
        $compile(el)(scope);
        scope.$digest();

        triggerMouseEvent('mouseover');
        $timeout.flush();
        expect($state.current.name).toEqual('contacts');

        $state.go('top');
        scope.$digest();

        expect($state.current.name).toEqual('top');

        triggerMouseEvent('mousedown');
        $timeout.flush();
        expect($state.current.name).toEqual('contacts');
      }));
    });
  });

  describe('forms', function() {
    var el, scope;

    beforeEach(inject(function($rootScope, $compile) {
      el = angular.element('<form ui-sref="contacts.item.detail({ id: contact.id })"></form>');
      scope = $rootScope;
      scope.contact = { id: 5 };
      scope.$apply();

      $compile(el)(scope);
      scope.$digest();
    }));

    it('should generate the correct action', function() {
      expect(el.attr('action')).toBe('#/contacts/5');
    });
  });

  describe('relative transitions', function() {

    beforeEach(inject(function($rootScope, $compile, $state) {
      $state.transitionTo("contacts.item", { id: 5 });
      el = angular.element('<a ui-sref=".detail">Details</a>');
      scope = $rootScope;
      scope.$apply();

      $compile(el)(scope);
      template = $compile(angular.element('<div><ui-view></ui-view><div>'))(scope);
      scope.$digest();
    }));

    it('should work', inject(function ($state, $stateParams, $q, $timeout) {
      triggerClick(el);
      $timeout.flush();
      $q.flush();

      expect($state.$current.name).toBe("contacts.item.detail");
      expect(obj($state.params)).toEqualData({ id: 5 });
    }));

    it('should resolve states from parent uiView', inject(function ($state, $stateParams, $q, $timeout) {
      $state.transitionTo('contacts');
      $q.flush();

      var parentToChild = angular.element(template[0].querySelector('a.item'));
      triggerClick(parentToChild);
      $timeout.flush();
      $q.flush();
      expect($state.$current.name).toBe("contacts.item")

      var childToGrandchild = angular.element(template[0].querySelector('a.item-detail'));
      var childToParent = angular.element(template[0].querySelector('a.item-parent'));

      triggerClick(childToGrandchild);
      $timeout.flush();
      $q.flush();

      var grandchildToParent = angular.element(template[0].querySelector('a.item-parent2'));
      expect($state.$current.name).toBe("contacts.item.detail")

      triggerClick(grandchildToParent);
      $timeout.flush();
      $q.flush();
      expect($state.$current.name).toBe("contacts.item");

      $state.transitionTo("contacts.item.detail", { id: 3 });
      triggerClick(childToParent);
      $timeout.flush();
      $q.flush();
      expect($state.$current.name).toBe("contacts");
    }));
  });

  describe('option event', function() {
    it('should bind click event by default', inject(function($rootScope, $compile, $state, $timeout) {
      el = angular.element('<a ui-sref="contacts"></a>');
      $compile(el)($rootScope);
      $rootScope.$digest();

      expect($state.current.name).toEqual('top');

      triggerClick(el);
      $timeout.flush();

      expect($state.current.name).toEqual('contacts');
    }));

    it('should bind single HTML events', inject(function($rootScope, $compile, $state, $timeout) {
      el = angular.element('<input type="text" ui-sref="contacts" ui-sref-opts="{ events: [\'change\'] }">');
      $compile(el)($rootScope);
      $rootScope.$digest();

      expect($state.current.name).toEqual('top');

      triggerHTMLEvent('change');
      $timeout.flush();

      expect($state.current.name).toEqual('contacts');
    }));

    it('should bind multiple HTML events', inject(function($rootScope, $compile, $state, $timeout) {
      el = angular.element('<input type="text" ui-sref="contacts" ui-sref-opts="{ events: [\'change\', \'blur\'] }">');
      $compile(el)($rootScope);
      $rootScope.$digest();

      expect($state.current.name).toEqual('top');

      triggerHTMLEvent('change');
      $timeout.flush();
      expect($state.current.name).toEqual('contacts');

      $state.go('top');
      $rootScope.$digest();

      expect($state.current.name).toEqual('top');

      triggerHTMLEvent('blur');
      $timeout.flush();
      expect($state.current.name).toEqual('contacts');
    }));

    it('should bind multiple Mouse events', inject(function($rootScope, $compile, $state, $timeout) {
      el = angular.element('<a ui-sref="contacts" ui-sref-opts="{ events: [\'mouseover\', \'mousedown\'] }">');
      $compile(el)($rootScope);
      $rootScope.$digest();

      expect($state.current.name).toEqual('top');

      triggerMouseEvent('mouseover');
      $timeout.flush();
      expect($state.current.name).toEqual('contacts');

      $state.go('top');
      $rootScope.$digest();

      expect($state.current.name).toEqual('top');

      triggerMouseEvent('mousedown');
      $timeout.flush();
      expect($state.current.name).toEqual('contacts');
    }));
  });
});

describe('uiSrefActive', function() {
  var el, template, scope, document, _stateProvider;

  beforeEach(module('ui.router'));

  beforeEach(module(function($stateProvider) {
    _stateProvider = $stateProvider;
    $stateProvider.state('top', {
      url: ''
    }).state('contacts', {
      url: '/contacts',
      views: {
        '$default': {
          template: '<a ui-sref=".item({ id: 6 })" ui-sref-active="active">Contacts</a>'
        }
      }
    }).state('contacts.item', {
      url: '/:id'
    }).state('contacts.item.detail', {
      url: '/detail/:foo'
    }).state('contacts.item.edit', {
      url: '/edit'
    }).state('admin', {
      url: '/admin',
      abstract: true,
      template: '<ui-view/>'
    }).state('admin.roles', {
      url: '/roles?page'
    }).state('arrayparam', {
      url: '/arrayparam?{foo:int}&bar',
      template: '<div></div>'
    });
  }));

  beforeEach(inject(function($document, $timeout) {
    document = $document[0];
    timeoutFlush = function () {
      try {
        $timeout.flush();
      } catch (e) {
        // Angular 1.0.8 throws 'No deferred tasks to be flushed' if there is nothing in queue.
        // Behave as Angular >=1.1.5 and do nothing in such case.
      }
    }
  }));

  it('should update class for sibling uiSref', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div><a ui-sref="contacts.item({ id: 1 })" ui-sref-active="active">Contacts</a><a ui-sref="contacts.item({ id: 2 })" ui-sref-active="active">Contacts</a></div>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
    $state.transitionTo('contacts.item', { id: 1 });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');

    $state.transitionTo('contacts.item', { id: 2 });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
  }));

  it('should match state\'s parameters', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div><a ui-sref="contacts.item.detail({ foo: \'bar\' })" ui-sref-active="active">Contacts</a></div>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
    $state.transitionTo('contacts.item.detail', { id: 5, foo: 'bar' });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');

    $state.transitionTo('contacts.item.detail', { id: 5, foo: 'baz' });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
  }));


  // Test for #2696
  it('should compare using typed parameters', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div><a ui-sref="arrayparam({ foo: [1,2,3] })" ui-sref-active="active">foo 123</a></div>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');

    $state.transitionTo('arrayparam', {foo: [1,2,3] });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');

    $state.transitionTo('arrayparam', {foo: [1,2,3], bar: 'asdf' });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');

    $state.transitionTo('arrayparam', {foo: [1,2] });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
  }));

  // Test for #3154
  it('should compare ui-sref-active-eq using typed parameters', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div><a ui-sref="arrayparam({ foo: [1,2,3] })" ui-sref-active-eq="active">foo 123</a></div>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');

    $state.transitionTo('arrayparam', {foo: [1,2,3] });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');

    $state.transitionTo('arrayparam', {foo: [1,2,3], bar: 'asdf' });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');

    $state.transitionTo('arrayparam', {foo: [1,2] });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
  }));



  it('should update in response to ui-sref param expression changes', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div><a ui-sref="contacts.item.detail({ foo: fooId })" ui-sref-active="active">Contacts</a></div>');
    template = $compile(el)($rootScope);
    $rootScope.fooId = 'bar'
    $rootScope.$digest();

    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
    $state.transitionTo('contacts.item.detail', { id: 5, foo: 'bar' });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');

    $rootScope.fooId = 'baz'
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
  }));

  it('should match on child states', inject(function($rootScope, $q, $compile, $state) {
    template = $compile('<div><a ui-sref="contacts.item({ id: 1 })" ui-sref-active="active">Contacts</a></div>')($rootScope);
    $rootScope.$digest();
    var a = angular.element(template[0].getElementsByTagName('a')[0]);

    $state.transitionTo('contacts.item.edit', { id: 1 });
    $q.flush();
    timeoutFlush();
    expect($state.params.id).toBe('1');
    expect(a.attr('class')).toMatch(/active/);

    $state.transitionTo('contacts.item.edit', { id: 4 });
    $q.flush();
    timeoutFlush();
    expect($state.params.id).toBe('4');
    expect(a.attr('class')).not.toMatch(/active/);
  }));

  it('should NOT match on child states when active-equals is used', inject(function($rootScope, $q, $compile, $state) {
    template = $compile('<div><a ui-sref="contacts.item({ id: 1 })" ui-sref-active-eq="active">Contacts</a></div>')($rootScope);
    $rootScope.$digest();
    var a = angular.element(template[0].getElementsByTagName('a')[0]);

    $state.transitionTo('contacts.item', { id: 1 });
    $q.flush();
    timeoutFlush();
    expect(a.attr('class')).toMatch(/active/);

    $state.transitionTo('contacts.item.edit', { id: 1 });
    $q.flush();
    timeoutFlush();
    expect(a.attr('class')).not.toMatch(/active/);
  }));

  it('should match on child states when active-equals and active-equals-eq is used', inject(function($rootScope, $q, $compile, $state, $timeout) {
    template = $compile('<div><a ui-sref="contacts.item({ id: 1 })" ui-sref-active="active" ui-sref-active-eq="active-eq">Contacts</a></div>')($rootScope);
    $rootScope.$digest();
    var a = angular.element(template[0].getElementsByTagName('a')[0]);

    $state.transitionTo('contacts.item', { id: 1 });
    $q.flush();
    timeoutFlush();
    expect(a.attr('class')).toMatch(/active/);
    expect(a.attr('class')).toMatch(/active-eq/);

    $state.transitionTo('contacts.item.edit', { id: 1 });
    $q.flush();
    timeoutFlush();
    expect(a.attr('class')).toMatch(/active/);
    expect(a.attr('class')).not.toMatch(/active-eq/);
  }));

  it('should resolve relative state refs', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<section><div ui-view></div></section>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    $state.transitionTo('contacts');
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('ng-scope');

    $state.transitionTo('contacts.item', { id: 6 });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('ng-scope active');

    $state.transitionTo('contacts.item', { id: 5 });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('ng-scope');
  }));

  it('should match on any child state refs', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div ui-sref-active="active"><a ui-sref="contacts.item({ id: 1 })">Contacts</a><a ui-sref="contacts.item({ id: 2 })">Contacts</a></div>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    expect(angular.element(template[0]).attr('class')).toBe('ng-scope');

    $state.transitionTo('contacts.item', { id: 1 });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0]).attr('class')).toBe('ng-scope active');

    $state.transitionTo('contacts.item', { id: 2 });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0]).attr('class')).toBe('ng-scope active');
  }));

  it('should match fuzzy on lazy loaded states', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div><a ui-sref="contacts.lazy" ui-sref-active="active">Lazy Contact</a></div>');
    template = $compile(el)($rootScope);
    $q.flush();

    _stateProvider.onInvalid(function ($to$) {
      if ($to$.name() === 'contacts.lazy') {
        _stateProvider.state('contacts.lazy', {});
        return $to$;
      }
    });

    $state.transitionTo('contacts.item', { id: 1 });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');

    $state.transitionTo('contacts.lazy');
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');
  }));

  it('should match exactly on lazy loaded states', inject(function($transitions, $rootScope, $q, $compile, $state) {
    el = angular.element('<div><a ui-sref="contacts.lazy" ui-sref-active-eq="active">Lazy Contact</a></div>');
    template = $compile(el)($rootScope);
    $q.flush();

    _stateProvider.onInvalid(function ($to$) {
      if ($to$.name() === 'contacts.lazy') {
        _stateProvider.state('contacts.lazy', {});
        return $to$;
      }
    });

    $state.transitionTo('contacts.item', { id: 1 });
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');

    $state.transitionTo('contacts.lazy');
    $q.flush();
    timeoutFlush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');
  }));

  it('should allow multiple classes to be supplied', inject(function($rootScope, $q, $compile, $state) {
    template = $compile('<div><a ui-sref="contacts.item({ id: 1 })" ui-sref-active="active also-active">Contacts</a></div>')($rootScope);
    $rootScope.$digest();
    var a = angular.element(template[0].getElementsByTagName('a')[0]);

    $state.transitionTo('contacts.item.edit', { id: 1 });
    $q.flush();
    timeoutFlush();
    expect(a.attr('class')).toMatch(/active also-active/);
  }));

  describe('ng-{class,style} interface', function() {
    it('should match on abstract states that are included by the current state', inject(function($rootScope, $compile, $state, $q) {
      el = $compile('<div ui-sref-active="{active: \'admin.*\'}"><a ui-sref-active="active" ui-sref="admin.roles">Roles</a></div>')($rootScope);
      $state.transitionTo('admin.roles');
      $q.flush();
      timeoutFlush();
      var abstractParent = el[0];
      expect(abstractParent.className).toMatch(/active/);
      var child = el[0].querySelector('a');
      expect(child.className).toMatch(/active/);
    }));

    it('should match on state parameters', inject(function($compile, $rootScope, $state, $q) {
      el = $compile('<div ui-sref-active="{active: \'admin.roles({page: 1})\'}"></div>')($rootScope);
      $state.transitionTo('admin.roles', {page: 1});
      $q.flush();
      timeoutFlush();
      expect(el[0].className).toMatch(/active/);
    }));

    it('should shadow the state provided by ui-sref', inject(function($compile, $rootScope, $state, $q) {
      el = $compile('<div ui-sref-active="{active: \'admin.roles({page: 1})\'}"><a ui-sref="admin.roles"></a></div>')($rootScope);
      $state.transitionTo('admin.roles');
      $q.flush();
      timeoutFlush();
      expect(el[0].className).not.toMatch(/active/);
      $state.transitionTo('admin.roles', {page: 1});
      $q.flush();
      timeoutFlush();
      expect(el[0].className).toMatch(/active/);
    }));

    it('should support multiple <className, stateOrName> pairs', inject(function($compile, $rootScope, $state, $q) {
      el = $compile('<div ui-sref-active="{contacts: \'contacts.**\', admin: \'admin.roles({page: 1})\'}"></div>')($rootScope);
      $state.transitionTo('contacts');
      $q.flush();
      timeoutFlush();
      expect(el[0].className).toMatch(/contacts/);
      expect(el[0].className).not.toMatch(/admin/);
      $state.transitionTo('admin.roles', {page: 1});
      $q.flush();
      timeoutFlush();
      expect(el[0].className).toMatch(/admin/);
      expect(el[0].className).not.toMatch(/contacts/);
    }));

    it('should update the active classes when compiled', inject(function($compile, $rootScope, $document, $state, $q) {
      $state.transitionTo('admin.roles');
      $q.flush();
      timeoutFlush();
      el = $compile('<div ui-sref-active="{active: \'admin.roles\'}"/>')($rootScope);
      $rootScope.$digest();
      timeoutFlush();
      expect(el.hasClass('active')).toBeTruthy();
    }));
  });
});
