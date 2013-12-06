
$ViewDirective.$inject = ['$state', '$compile', '$controller', '$injector', '$anchorScroll'];
function $ViewDirective(   $state,   $compile,   $controller,   $injector,   $anchorScroll) {
  var $animator = $injector.has('$animator') ? $injector.get('$animator') : false;
  var viewIsUpdating = false;

  var directive = {
    restrict: 'ECA',
    terminal: true,
    priority: 1000,
    transclude: true,
    compile: function (element, attr, transclude) {
      return function(scope, element, attr) {
        var viewScope, viewLocals,
            name = attr[directive.name] || attr.name || '',
            onloadExp = attr.onload || '',
            animate = $animator && $animator(scope, attr),
            initialView = transclude(scope);

        // Returns a set of DOM manipulation functions based on whether animation
        // should be performed
        var renderer = function(doAnimate) {
          return ({
            "true": {
              remove: function(element) { animate.leave(element.contents(), element); },
              restore: function(compiled, element) { animate.enter(compiled, element); },
              populate: function(template, element) {
                var contents = angular.element('<div></div>').html(template).contents();
                animate.enter(contents, element);
                return contents;
              }
            },
            "false": {
              remove: function(element) { element.html(''); },
              restore: function(compiled, element) { element.append(compiled); },
              populate: function(template, element) {
                element.html(template);
                return element.contents();
              }
            }
          })[doAnimate.toString()];
        };

        // Put back the compiled initial view
        element.append(initialView);

        // Find the details of the parent view directive (if any) and use it
        // to derive our own qualified view name, then hang our own details
        // off the DOM so child directives can find it.
        var parent = element.parent().inheritedData('$uiView');
        if (name.indexOf('@') < 0) name  = name + '@' + (parent ? parent.state.name : '');
        var view = { name: name, state: null };
        element.data('$uiView', view);

        var eventHook = function() {
          if (viewIsUpdating) return;
          viewIsUpdating = true;

          try { updateView(true); } catch (e) {
            viewIsUpdating = false;
            throw e;
          }
          viewIsUpdating = false;
        };

        scope.$on('$stateChangeSuccess', eventHook);
        scope.$on('$viewContentLoading', eventHook);
        updateView(false);

        function updateView(doAnimate) {
          var locals = $state.$current && $state.$current.locals[name];
          if (locals === viewLocals) return; // nothing to do
          var render = renderer(animate && doAnimate);

          // Remove existing content
          render.remove(element);

          // Destroy previous view scope
          if (viewScope) {
            viewScope.$destroy();
            viewScope = null;
          }

          if (!locals) {
            viewLocals = null;
            view.state = null;

            // Restore the initial view
            return render.restore(initialView, element);
          }

          viewLocals = locals;
          view.state = locals.$$state;

          var link = $compile(render.populate(locals.$template, element));
          viewScope = scope.$new();

          if (locals.$$controller) {
            locals.$scope = viewScope;
            var controller = $controller(locals.$$controller, locals);
            element.children().data('$ngControllerController', controller);
          }
          link(viewScope);
          viewScope.$emit('$viewContentLoaded');
          if (onloadExp) viewScope.$eval(onloadExp);

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
