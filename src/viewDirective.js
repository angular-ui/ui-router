
$ViewDirective.$inject = ['$state', '$compile', '$controller', '$anchorScroll', '$animate'];
function $ViewDirective(   $state,   $compile,   $controller,   $anchorScroll,   $animate) {

  var viewIsUpdating = false;

  var directive = {
    restrict: 'ECA',
    compile: function (element, attrs) {
      var defaultContent = element.html(), isDefault = true,
          anchor = angular.element(document.createComment(' ui-view '));

      element.prepend(anchor);

      return function ($scope) {
        var currentScope, currentElement, viewLocals,
            name = attrs[directive.name] || attrs.name || '',
            onloadExp = attrs.onload || '';

        var parent = element.parent().inheritedData('$uiView');
        if (name.indexOf('@') < 0) name = name + '@' + (parent ? parent.state.name : '');
        var view = { name: name, state: null };

        var eventHook = function () {
          if (viewIsUpdating) return;
          viewIsUpdating = true;

          try { updateView(); } catch (e) {
            viewIsUpdating = false;
            throw e;
          }
          viewIsUpdating = false;
        };

        $scope.$on('$stateChangeSuccess', eventHook);
        $scope.$on('$viewContentLoading', eventHook);

        updateView();

        function cleanupLastView() {
          if (currentElement) {
            $animate.leave(currentElement);
            currentElement = null;
          }

          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }
        }

        function updateView() {
          var locals = $state.$current && $state.$current.locals[name];

          if (isDefault) {
            isDefault = false;
            element.replaceWith(anchor);
          }

          if (!locals) {
            cleanupLastView();
            currentElement = element.clone();
            currentElement.html(defaultContent);
            anchor.after(currentElement);

            currentScope = $scope.$new();
            $compile(currentElement.contents())(currentScope);
            return;
          }

          if (locals === viewLocals) return; // nothing to do

          cleanupLastView();

          currentElement = element.clone();
          currentElement.html(locals.$template ? locals.$template : defaultContent);
          $animate.enter(currentElement, null, anchor);

          currentElement.data('$uiView', view);

          viewLocals = locals;
          view.state = locals.$$state;

          var link = $compile(currentElement.contents());

          currentScope = $scope.$new();

          if (locals.$$controller) {
            locals.$scope = currentScope;
            var controller = $controller(locals.$$controller, locals);
            currentElement.children().data('$ngControllerController', controller);
          }

          link(currentScope);

          currentScope.$emit('$viewContentLoaded');
          if (onloadExp) currentScope.$eval(onloadExp);

          // TODO: This seems strange, shouldn't $anchorScroll listen for $viewContentLoaded if necessary?
          // $anchorScroll might listen on event...
          $anchorScroll();
        }
      };
    }
  };
  return directive;
}

angular.module('ui.router.state').directive('uiView', $ViewDirective);
