
$ViewDirective.$inject = ['$state', '$view', '$compile', '$controller', '$injector', '$anchorScroll'];
function $ViewDirective(   $state,   $view,   $compile,   $controller,   $injector,   $anchorScroll) {
  // TODO: Change to $injector.has() when we version bump to Angular 1.1.5.
  // See: https://github.com/angular/angular.js/blob/master/CHANGELOG.md#115-triangle-squarification-2013-05-22
  var $animator; try { $animator = $injector.get('$animator'); } catch (e) { /* do nothing */ }
  var viewIsUpdating = false;

  var directive = {
    restrict: 'ECA',
    terminal: true,
    transclude: true,
    compile: function (element, attr, transclude) {
      return function(scope, element, attr) {
        var viewScope, viewConfig, unregister,
            name = attr[directive.name] || attr.name || '$unnamed$',
            onloadExp = attr.onload || '',
            animate = isDefined($animator) && $animator(scope, attr);

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
        element.append(transclude(scope));

        // Find the details of the parent view directive (if any) and use it
        // to derive our own qualified view name, then hang our own details
        // off the DOM so child directives can find it.
        var parent = element.parent().inheritedData('$uiView');
        var view = { name: parent ? parent.name + "." + name : name, context: null };
        element.data('$uiView', view);

        unregister = $view.register(view.name, function(config) {
          var nothingToDo = (config === viewConfig) || (config && viewConfig && (
            config.$controller === viewConfig.$controller &&
            config.$template   === viewConfig.$template &&
            config.$locals     === viewConfig.$locals
          ));
          if (nothingToDo) return;

          updateView(true, config);
        });

        scope.$on("$destroy", function() {
          unregister();
        });

        updateView(false);

        function updateView(doAnimate, config) {
          var render = renderer(animate && doAnimate);

          // Remove existing content
          render.remove(element);

          // Destroy previous view scope
          if (viewScope) {
            viewScope.$destroy();
            viewScope = null;
          }

          // Restore the initial view
          if (!config) {
            viewConfig = null;
            return render.restore(transclude(scope), element);
          }

          viewConfig = config;
          viewScope  = scope.$new();
          var link   = $compile(render.populate(config.$template, element));

          if (config.$controller) {
            config.$scope = viewScope;
            element.children().data('$ngControllerController', $controller(config.$controller, config.$locals));
          }
          link(viewScope);
          viewScope.$emit('$viewContentLoaded', copy(view, {}));
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
