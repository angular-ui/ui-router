function parseStateRef(ref) {
  var parsed = ref.replace(/\n/g, " ").match(/^([^(]+)(?:\s*(?:\(\s*(\{.*?\}){1}(?:\s*,\s*(\{.*?\}))?\s*\)){1})?$/);
  if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
  return { state: parsed[1], paramExpr: parsed[2] || null, options: parsed[3] || {} };
}

$StateRefDirective.$inject = ['$state'];
function $StateRefDirective($state) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var ref = parseStateRef(attrs.uiSref);
      var params = null, options = {}, url = null, base = $state.$current;
      var defaults = {
        relative : base
      };
      var isForm = element[0].nodeName === "FORM";
      var attr = isForm ? "action" : "href", nav = true;

      var stateData = element.parent().inheritedData('$uiView');

      if (stateData && stateData.state && stateData.state.name) {
        base = stateData.state;
      }

      var update = function(newVal) {
        if (newVal) params = newVal;
        if (!nav) return;

        var newHref = $state.href(ref.state, params, options);

        if (!newHref) {
          nav = false;
          return false;
        }
        element[0][attr] = newHref;
      };

      if (ref.paramExpr) {
        scope.$watch(ref.paramExpr, function(newVal, oldVal) {
          if (newVal !== params) update(newVal);
        }, true);
        params = scope.$eval(ref.paramExpr);
        options = angular.extend({}, defaults, scope.$eval(ref.options));
      }
      update();

      if (isForm) return;

      element.bind("click", function(e) {
        var button = e.which || e.button;

        if ((button === 0 || button == 1) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          scope.$evalAsync(function() {
            $state.go(ref.state, params, options);
          });
          e.preventDefault();
        }
      });
    }
  };
}

angular.module('ui.router.state').directive('uiSref', $StateRefDirective);
