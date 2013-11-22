function parseStateRef(ref) {
  var parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\((.*)\))?$/);
  if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
  return { state: parsed[1], paramExpr: parsed[3] || null };
}

$StateRefDirective.$inject = ['$state'];
function $StateRefDirective($state) {
  function getSrefEl(el) {
    var sref = el.attr('ui-sref'), hasSref = typeof (sref) !== 'undefined';
    if (hasSref) {
        return el;
    }
    var parent = el.parent();
    return parent ? getSrefEl(parent) : null;
  }
  
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var ref = parseStateRef(attrs.uiSref);
      var params = null, url = null, base = $state.$current;
      var isForm = element[0].nodeName === "FORM";
      var attr = isForm ? "action" : "href", nav = true;

      var stateData = element.parent().inheritedData('$uiView');

      if (stateData && stateData.state && stateData.state.name) {
        base = stateData.state;
      }

      var update = function(newVal) {
        if (newVal) params = newVal;
        if (!nav) return;

        var newHref = $state.href(ref.state, params, { relative: base });

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
      }
      update();

      if (isForm) return;

      function getIsCurrentElClicked(e) {
        var targetEl = angular.element(e.target), srefEl = getSrefEl(targetEl);
        return element[0] === sref[0];
      }

      element.bind("click", function(e) {
        var button = e.which || e.button;

        if ((button == 1) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          var isCurrentElClicked = getIsCurrentElClicked(e);
          if(!isCurrentElClicked) {
            return;
          }
          
          $state.go(ref.state, params, { relative: base });
          scope.$apply();
          e.preventDefault();
        }
      });
    }
  };
}

angular.module('ui.router.state').directive('uiSref', $StateRefDirective);
