function parseStateRef(ref) {
  var parsed = ref.match(/^([^(]+?)\s*(\((.*)\))?$/);
  if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
  return { state: parsed[1], paramExpr: parsed[3] || null };
}

$StateRefDirective.$inject = ['$state'];
function $StateRefDirective($state) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var ref = parseStateRef(attrs.uiSref);
      var params = null, url = null;
      var isForm = element[0].nodeName === "FORM";
      var attr = isForm ? "action" : "href", nav = true;
      var allowEmptyState = true; // Use attribute to set this?

      var update = function(newVal) {
        if (newVal) params = newVal;
        if (!nav) return;

        var newHref = $state.href(ref.state, params);

        if (!newHref && !allowEmptyState) {
          nav = false;
          return false;
        }
        element[0][attr] = newHref;
      };
      
      attrs.$observe('uiSref', function(newVal, oldVal) {
        if (newVal !== oldVal) {
          ref = parseStateRef(attrs.uiSref);
          params = scope.$eval(ref.paramExpr);
          update(params);
          
          if (ref) {
            scope.$watch(ref.paramExpr, function(newVal, oldVal) {
              if (newVal !== oldVal) update(newVal);
            }, true);
            params = scope.$eval(ref.paramExpr);
          }
        }
      }, true);
      
      update();

      if (isForm) return;

      element.bind("click", function(e) {
        if ((e.which == 1) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          $state.go(ref.state, params);
          scope.$apply();
          e.preventDefault();
        }
      });
    }
  };
}

angular.module('ui.router.state').directive('uiSref', $StateRefDirective);
