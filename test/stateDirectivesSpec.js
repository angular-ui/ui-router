describe('uiStateRef', function() {

  var timeoutFlush, el, el2, template, scope, document, _locationProvider;

  beforeEach(module('ui.router'));

  beforeEach(module(function($stateProvider, $locationProvider) {
    _locationProvider = $locationProvider;
    $stateProvider.state('top', {
      url: ''
    }).state('contacts', {
      url: '/contacts',
      template: '<a ui-sref=".item({ id: 5 })" class="item">Person</a> <ui-view></ui-view>'
    }).state('contacts.item', {
      url: '/:id',
      template: '<a ui-sref=".detail" class="item-detail">Detail</a> | <a ui-sref="^" class="item-parent">Parent</a> | <ui-view></ui-view>'
    }).state('contacts.item.detail', {
      template: '<div class="title">Detail</div> | <a ui-sref="^" class="item-parent2">Item</a>'
    });
  }));

  beforeEach(inject(function($document) {
    document = $document[0];
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

    timeoutFlush = function () {
      try {
        $timeout.flush();
      } catch (e) {
        // Angular 1.0.8 throws 'No deferred tasks to be flushed' if there is nothing in queue.
        // Behave as Angular >=1.1.5 and do nothing in such case.
      }
    }
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
      expect($stateParams).toEqual({ id: "5" });
    }));

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
      expect($stateParams).toEqual({ id: "5" });
    }));

    it('should not transition states when ctrl-clicked', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');
      triggerClick(el, { ctrlKey: true });

      timeoutFlush();
      $q.flush();
      
      expect($state.current.name).toEqual('top');
      expect($stateParams).toEqualData({ });
    }));

    it('should not transition states when meta-clicked', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');

      triggerClick(el, { metaKey: true });
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect($stateParams).toEqualData({});
    }));

    it('should not transition states when shift-clicked', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');

      triggerClick(el, { shiftKey: true });
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect($stateParams).toEqualData({});
    }));

    it('should not transition states when middle-clicked', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');

      triggerClick(el, { button: 1 });
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect($stateParams).toEqualData({});
    }));

    it('should not transition states when element has target specified', inject(function($state, $stateParams, $q) {
      el.attr('target', '_blank');
      expect($state.$current.name).toEqual('top');

      triggerClick(el);
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect($stateParams).toEqualData({});
    }));

    it('should not transition states if preventDefault() is called in click handler', inject(function($state, $stateParams, $q) {
      expect($state.$current.name).toEqual('top');
      el.bind('click', function(e) {
        e.preventDefault();
      });

      triggerClick(el);
      timeoutFlush();
      $q.flush();

      expect($state.current.name).toEqual('top');
      expect($stateParams).toEqualData({});
    }));

    it('should allow passing params to current state', inject(function($compile, $rootScope, $state) {
      $state.current.name = 'contacts.item.detail';
      
      el = angular.element("<a ui-sref=\"{id: $index}\">Details</a>");
      $rootScope.$index = 3;
      $rootScope.$apply();

      $compile(el)($rootScope);
      $rootScope.$digest();
      expect(el.attr('href')).toBe('#/contacts/3');
    }));
    
    it('should allow multi-line attribute values when passing params to current state', inject(function($compile, $rootScope, $state) {
      $state.current.name = 'contacts.item.detail';
      
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
      expect($stateParams).toEqualData({});
    }));
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
      expect($state.params).toEqual({ id: "5" });
    }));

    it('should resolve states from parent uiView', inject(function ($state, $stateParams, $q, $timeout) {
      $state.transitionTo('contacts');
      $q.flush();

      var parentToChild = angular.element(template[0].querySelector('a.item'));
      triggerClick(parentToChild);
      $timeout.flush();
      $q.flush();

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

  describe('transition options', function() {

    beforeEach(inject(function($rootScope, $compile, $state) {
      el = angular.element('<a ui-sref="contacts.item.detail({ id: contact.id })" ui-sref-opts="{ reload: true, notify: true }">Details</a>');
      scope = $rootScope;
      scope.contact = { id: 5 };

      $compile(el)(scope);
      scope.$digest();
    }));

    it('uses allowed transition options', inject(function($q, $timeout, $state) {
      var transitionOptions;

      spyOn($state, 'go').andCallFake(function(state, params, options) {
        transitionOptions = options;
      });

      triggerClick(el);
      $timeout.flush();

      expect(transitionOptions.reload).toEqual(true);
      expect(transitionOptions.notify).toBeUndefined();
    }));
  });
});

describe('uiSrefActive', function() {
    var el, template, scope, document;

  beforeEach(module('ui.router'));

  beforeEach(module(function($stateProvider) {
    $stateProvider.state('top', {
      url: ''
    }).state('contacts', {
      url: '/contacts',
      views: {
        '@': {
          template: '<a ui-sref=".item({ id: 6 })" ui-sref-active="active">Contacts</a>'
        }
      }
    }).state('contacts.item', {
      url: '/:id',
    }).state('contacts.item.detail', {
      url: '/detail/:foo'
    }).state('contacts.item.edit', {
      url: '/edit'
    });
  }));

  beforeEach(inject(function($document) {
    document = $document[0];
  }));

  it('should update class for sibling uiSref', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div><a ui-sref="contacts.item({ id: 1 })" ui-sref-active="active">Contacts</a><a ui-sref="contacts.item({ id: 2 })" ui-sref-active="active">Contacts</a></div>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
    $state.transitionTo('contacts.item', { id: 1 });
    $q.flush();

    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');

    $state.transitionTo('contacts.item', { id: 2 });
    $q.flush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
  }));

  it('should match state\'s parameters', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div><a ui-sref="contacts.item.detail({ foo: \'bar\' })" ui-sref-active="active">Contacts</a></div>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
    $state.transitionTo('contacts.item.detail', { id: 5, foo: 'bar' });
    $q.flush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('active');

    $state.transitionTo('contacts.item.detail', { id: 5, foo: 'baz' });
    $q.flush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('');
  }));

  it('should match on child states', inject(function($rootScope, $q, $compile, $state) {
    template = $compile('<div><a ui-sref="contacts.item({ id: 1 })" ui-sref-active="active">Contacts</a></div>')($rootScope);
    $rootScope.$digest();
    var a = angular.element(template[0].getElementsByTagName('a')[0]);

    $state.transitionTo('contacts.item.edit', { id: 1 });
    $q.flush();
    expect(a.attr('class')).toMatch(/active/);

    $state.transitionTo('contacts.item.edit', { id: 4 });
    $q.flush();
    expect(a.attr('class')).not.toMatch(/active/);
  }));

  it('should NOT match on child states when active-equals is used', inject(function($rootScope, $q, $compile, $state) {
    template = $compile('<div><a ui-sref="contacts.item({ id: 1 })" ui-sref-active-eq="active">Contacts</a></div>')($rootScope);
    $rootScope.$digest();
    var a = angular.element(template[0].getElementsByTagName('a')[0]);

    $state.transitionTo('contacts.item', { id: 1 });
    $q.flush();
    expect(a.attr('class')).toMatch(/active/);

    $state.transitionTo('contacts.item.edit', { id: 1 });
    $q.flush();
    expect(a.attr('class')).not.toMatch(/active/);
  }));

  it('should resolve relative state refs', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<section><div ui-view></div></section>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    $state.transitionTo('contacts');
    $q.flush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('ng-scope');

    $state.transitionTo('contacts.item', { id: 6 });
    $q.flush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('ng-scope active');

    $state.transitionTo('contacts.item', { id: 5 });
    $q.flush();
    expect(angular.element(template[0].querySelector('a')).attr('class')).toBe('ng-scope');
  }));
});

describe('uiView controllers or onEnter handlers', function() {
  var el, template, scope, document, count;

  beforeEach(module('ui.router'));

  beforeEach(module(function($stateProvider) {
    count = 0;
    $stateProvider
      .state('aside',         { url: '/aside', template: '<div class="aside"></div>' })
      .state('A',           { url: '/A', template: '<div class="A" ui-view="fwd"></div>' })
      .state('A.fwd', {
        url: '/fwd', views: { 'fwd@A': {
          template: '<div class="fwd" ui-view>',
          controller: function($state) { if (count++ < 20 && $state.current.name == 'A.fwd') $state.go(".nest"); }
        }}
      })
      .state('A.fwd.nest',  { url: '/nest', template: '<div class="nest"></div>' });
  }));

  beforeEach(inject(function($document) {
    document = $document[0];
  }));

  it('should not go into an infinite loop when controller uses $state.go', inject(function($rootScope, $q, $compile, $state) {
    el = angular.element('<div><ui-view></ui-view></div>');
    template = $compile(el)($rootScope);
    $rootScope.$digest();

    $state.transitionTo('aside');
    $q.flush();
    expect(template[0].querySelector('.aside')).toBeDefined();
    expect(template[0].querySelector('.fwd')).toBeNull();

    $state.transitionTo('A');
    $q.flush();
    expect(template[0].querySelector('.A')).not.toBeNull();
    expect(template[0].querySelector('.fwd')).toBeNull();

    $state.transitionTo('A.fwd');
    $q.flush();
    expect(template[0].querySelector('.A')).not.toBeNull();
    expect(template[0].querySelector('.fwd')).not.toBeNull();
    expect(template[0].querySelector('.nest')).not.toBeNull();
    expect(count).toBe(1);
  }));
});
