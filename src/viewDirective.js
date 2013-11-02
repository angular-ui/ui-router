
$ViewDirective.$inject = ['$state', '$compile', '$controller', '$anchorScroll', '$injector', '$rootScope'];
function $ViewDirective($state, $compile, $controller, $anchorScroll, $injector, $rootScope) {

  var viewIsUpdating = false,
      $animate = $injector.has('$animate') ? $injector.get('$animate') : null;

  var directive = {
    restrict: 'ECA',
    priority: 1000,
    terminal: true,
    transclude: 'element',
    compile: function (element, attrs, transclude) {
      return function ($scope, $element, $attrs) {
        // Returns a set of DOM manipulation functions based on whether animation
        // should be performed
        var renderer = function (doAnimate) {
          function animationEvent(animationType) {
            $rootScope.$broadcast('$viewAnimationStart', animationType, $state.$current);
            return function() {
              $rootScope.$broadcast('$viewAnimationEnd', animationType, $state.$current);
            };
          }

          if(doAnimate && $animate) {
            return {
              leave: function (view) { $animate.leave(view, animationEvent('leave')); },
              enter: function (view) { $animate.enter(view, null, $element, animationEvent('enter')); }
            };
          }
          else {
            return {
              leave: function (view) { view.remove(); },
              enter: function (view) { $element.after(view); }
            };
          }
        };

        var currentScope, currentElement, viewLocals,
            noop = function() {},
            name = attrs[directive.name] || attrs.name || '',
            onloadExp = attrs.onload || '',
            initialView = transclude($scope, noop);

        currentElement = initialView;
        $element.after(currentElement);

        var parent = $element.parent().inheritedData('$uiView');
        if (name.indexOf('@') < 0) name = name + '@' + (parent ? parent.state.name : '');
        var view = { name: name, state: null };

        var eventHook = function () {
          if (viewIsUpdating) return;
          viewIsUpdating = true;

          try { updateView(true); } catch (e) {
            viewIsUpdating = false;
            throw e;
          }
          viewIsUpdating = false;
        };

        $scope.$on('$stateChangeSuccess', eventHook);
        $scope.$on('$viewContentLoading', eventHook);
        updateView(false);

        function updateView(doAnimate) {
          var locals = $state.$current && $state.$current.locals[name],
              render = renderer(doAnimate);

          if (locals === viewLocals) return; // nothing to do

          // remove old view
          render.leave(currentElement);

          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }

          // if empty view, restore initial view
          if(!locals) {
            currentElement = initialView;
            render.enter(currentElement);
            viewLocals = undefined;
            view.state = undefined;
            return;
          }

          // update the view with a new clone
          currentElement = transclude($scope, noop);
          currentElement.html(locals.$template);
          currentElement.data('$uiView', view);

          viewLocals = locals;
          view.state = locals.$$state;

          var link = $compile(currentElement.contents());
          currentScope = $scope.$new();

          if (locals.$$controller) {
            locals.$scope = currentScope;
            var controller = $controller(locals.$$controller, locals);
            currentElement.contents().data('$ngControllerController', controller);
          }

          link(currentScope);
          render.enter(currentElement);

          currentScope.$emit('$viewContentLoaded');
          if (onloadExp) currentScope.$eval(onloadExp);

          // $anchorScroll might listen on event...
          $anchorScroll();
        }
      };
    }
  };
  return directive;
}

angular.module('ui.router.state').directive('uiView', $ViewDirective);
