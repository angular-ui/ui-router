
$ViewDirective.$inject = ['$state', '$compile', '$controller', '$anchorScroll'];
function $ViewDirective(   $state,   $compile,   $controller,   $anchorScroll) {
  var directive = {
    restrict: 'ECA',
    terminal: true,
    link: function(scope, element, attr) {
      var viewScope, viewLocals,
        name = attr[directive.name] || attr.name || '',
        onloadExp = attr.onload || '';
      
      // Find the details of the parent view directive (if any) and use it
      // to derive our own qualified view name, then hang our own details
      // off the DOM so child directives can find it.
      var parent = element.parent().inheritedData('$uiView');
      name  = name + '@' + (parent ? parent.state.name : '');
      var view = { name: name, state: null };
      element.data('$uiView', view);

      scope.$on('$stateChangeSuccess', updateView);
      updateView();

      function updateView() {
        var locals = $state.$current && $state.$current.locals[name];
        if (locals === viewLocals) return; // nothing to do

        // Destroy previous view scope (if any)
        if (viewScope) {
          viewScope.$destroy();
          viewScope = null;
        }

        if (locals) {
          viewLocals = locals;
          view.state = locals.$$state;

          element.html(locals.$template);
          // element.html('<div style="height:0;position:relative;z-index:999"><span style="background:red;color:white;font-size:12px;padding:1px">' + name + '</span></div>' + locals.$template);
          var link = $compile(element.contents());
          viewScope = scope.$new();
          if (locals.$$controller) {
            locals.$scope = viewScope;
            var controller = $controller(locals.$$controller, locals);
            element.contents().data('$ngControllerController', controller);
          }
          link(viewScope);
          viewScope.$emit('$viewContentLoaded');
          viewScope.$eval(onloadExp);

          // TODO: This seems strange, shouldn't $anchorScroll listen for $viewContentLoaded if necessary?
          // $anchorScroll might listen on event...
          $anchorScroll();
        } else {
          viewLocals = null;
          view.state = null;
          element.html('');
        }
      }
    }
  };
  return directive;
}

angular.module('ui.state').directive('uiView', $ViewDirective);
