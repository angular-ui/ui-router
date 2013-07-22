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

    it('should transition states when left-clicked', inject(function($state, $stateParams, $document, $q) {
      expect($state.$current.name).toEqual('');

      var e = $document[0].createEvent("MouseEvents");
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
        false, // ctrlKeyArg of type boolean, Specifies whether or not control key was depressed during the Event.
        false, // altKeyArg of type boolean, Specifies whether or not alt key was depressed during the Event.
        false, // shiftKeyArg of type boolean, Specifies whether or not shift key was depressed during the Event.
        false, // metaKeyArg of type boolean, Specifies whether or not meta key was depressed during the Event.
        0, // buttonArg of type unsigned short, Specifies the Event's mouse button.
        null // relatedTargetArg of type EventTarget
      );
      el[0].dispatchEvent(e);

      $q.flush();
      expect($state.current.name).toEqual('contacts.item.detail');
      expect($stateParams).toEqual({ id: "5" });
    }));

    it('should not transition states when ctrl-clicked', inject(function($state, $stateParams, $document, $q) {
      expect($state.$current.name).toEqual('');

      var e = $document[0].createEvent("MouseEvents");
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
        true, // ctrlKeyArg of type boolean, Specifies whether or not control key was depressed during the Event.
        false, // altKeyArg of type boolean, Specifies whether or not alt key was depressed during the Event.
        false, // shiftKeyArg of type boolean, Specifies whether or not shift key was depressed during the Event.
        false, // metaKeyArg of type boolean, Specifies whether or not meta key was depressed during the Event.
        0, // buttonArg of type unsigned short, Specifies the Event's mouse button.
        null // relatedTargetArg of type EventTarget
      );
      el[0].dispatchEvent(e);

      $q.flush();
      expect($state.current.name).toEqual('');
      expect($stateParams).toEqual({ id: "5" });
    }));

    it('should not transition states when meta-clicked', inject(function($state, $stateParams, $document, $q) {
      expect($state.$current.name).toEqual('');

      var e = $document[0].createEvent("MouseEvents");
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
        false, // ctrlKeyArg of type boolean, Specifies whether or not control key was depressed during the Event.
        false, // altKeyArg of type boolean, Specifies whether or not alt key was depressed during the Event.
        false, // shiftKeyArg of type boolean, Specifies whether or not shift key was depressed during the Event.
        true, // metaKeyArg of type boolean, Specifies whether or not meta key was depressed during the Event.
        0, // buttonArg of type unsigned short, Specifies the Event's mouse button.
        null // relatedTargetArg of type EventTarget
      );
      el[0].dispatchEvent(e);

      $q.flush();
      expect($state.current.name).toEqual('');
      expect($stateParams).toEqual({ id: "5" });
    }));

    it('should not transition states when shift-clicked', inject(function($state, $stateParams, $document, $q) {
      expect($state.$current.name).toEqual('');

      var e = $document[0].createEvent("MouseEvents");
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
        false, // ctrlKeyArg of type boolean, Specifies whether or not control key was depressed during the Event.
        false, // altKeyArg of type boolean, Specifies whether or not alt key was depressed during the Event.
        true, // shiftKeyArg of type boolean, Specifies whether or not shift key was depressed during the Event.
        false, // metaKeyArg of type boolean, Specifies whether or not meta key was depressed during the Event.
        0, // buttonArg of type unsigned short, Specifies the Event's mouse button.
        null // relatedTargetArg of type EventTarget
      );
      el[0].dispatchEvent(e);

      $q.flush();
      expect($state.current.name).toEqual('');
      expect($stateParams).toEqual({ id: "5" });
    }));

    it('should not transition states when middle-clicked', inject(function($state, $stateParams, $document, $q) {
      expect($state.$current.name).toEqual('');

      var e = $document[0].createEvent("MouseEvents");
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
        false, // ctrlKeyArg of type boolean, Specifies whether or not control key was depressed during the Event.
        false, // altKeyArg of type boolean, Specifies whether or not alt key was depressed during the Event.
        false, // shiftKeyArg of type boolean, Specifies whether or not shift key was depressed during the Event.
        false, // metaKeyArg of type boolean, Specifies whether or not meta key was depressed during the Event.
        1, // buttonArg of type unsigned short, Specifies the Event's mouse button.
        null // relatedTargetArg of type EventTarget
      );
      el[0].dispatchEvent(e);

      $q.flush();
      expect($state.current.name).toEqual('');
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
