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

      var update = function(newVal) {
        if (newVal) params = newVal;
        if (!nav) return;

        var newHref = $state.href(ref.state, params, { lossy: true });

        if (!newHref) {
          nav = false;
          return false;
        }
        element[0][attr] = newHref;
      };

      if (ref.paramExpr) {
        scope.$watch(ref.paramExpr, function(newVal, oldVal) {
          if (newVal !== oldVal) update(newVal);
        }, true);
        params = scope.$eval(ref.paramExpr);
      }
      update();

      /* 
        We don't need to bind 'click' event to transitionTo here. Since user clicks a element, address and state
        changes and user transitions to that state after all. 
      
        Also, using transitionTo here throws an exception with abstract states, however, changing url works.
      
      if (isForm) return;

      element.bind("click", function(e) {
        if ((e.which == 1) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          $state.transitionTo(ref.state, params);
          scope.$apply();
          e.preventDefault();
        }
      });
      */
    }
  };
}

angular.module('ui.state').directive('uiSref', $StateRefDirective);
