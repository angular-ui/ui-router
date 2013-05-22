describe('uiStateRef', function() {

  beforeEach(module('ui.state'));

  beforeEach(module(function($stateProvider) {
    $stateProvider.state('index', {
      url: '/'
    }).state('contacts', {
      url: '/contacts'
    }).state('contacts.item', {
      url: '/:id'
    }).state('contacts.item.detail', {});
  }));

  describe('links', function() {
    var el, scope;

    beforeEach(inject(function($rootScope, $compile) {
      el = angular.element('<a ui-sref="contacts.item.detail({ id: contact.id })">Details</a>');
      scope = $rootScope;
      scope.contact = { id: 5 };
      scope.$apply();

      $compile(el)(scope);
      scope.$digest();
    }));


    it('should generate the correct href', function() {
      expect(el.attr('href')).toBe('/contacts/5');
    });

    it('should update the href when parameters change', function() {
      expect(el.attr('href')).toBe('/contacts/5');
      scope.contact.id = 6;
      scope.$apply();
      expect(el.attr('href')).toBe('/contacts/6');
    });

    it('should transition states when clicked', inject(function($state, $stateParams, $document, $q) {
      expect($state.$current.name).toEqual('');

      var e = $document[0].createEvent("MouseEvents");
      e.initMouseEvent("click");
      el[0].dispatchEvent(e);

      $q.flush();
      expect($state.current.name).toEqual('contacts.item.detail');
      expect($stateParams).toEqual({ id: "5" });
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
      expect(el.attr('action')).toBe('/contacts/5');
    });
  });
});
