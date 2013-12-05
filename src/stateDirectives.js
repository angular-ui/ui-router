function parseStateRef(ref) {
  var parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\((.*)\))?$/);
  if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
  return { state: parsed[1], paramExpr: parsed[3] || null };
}

$StateRefDirective.$inject = ['$state'];
function $StateRefDirective($state) {
  return {
    restrict: 'A',
    require: '?^uiStateActive',
    link: function(scope, element, attrs, uiStateActive) {
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
        if (uiStateActive) {
          uiStateActive.$$setStateInfo(ref.state, params);
        }
      };

      if (ref.paramExpr) {
        scope.$watch(ref.paramExpr, function(newVal, oldVal) {
          if (newVal !== params) update(newVal);
        }, true);
        params = scope.$eval(ref.paramExpr);
      }
      update();

      if (isForm) return;

      element.bind("click", function(e) {
        var button = e.which || e.button;

        if ((button === 0 || button == 1) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          scope.$evalAsync(function() {
            $state.go(ref.state, params, { relative: base });
          });
          e.preventDefault();
        }
      });
    }
  };
}

$StateActiveDirective.$inject = ['$state', '$stateParams', '$interpolate'];
function $StateActiveDirective($state, $stateParams, $interpolate) {
  return {
    restrict: "A",
    controller: function($scope, $element, $attrs) {
      var state, params, paramKeys, activeClass;

      // There probably isn't much point in $observing this
      activeClass = $interpolate($attrs.uiSactive || '', false)($scope);

      // Allow uiSref to communicate with uiStateActive
      this.$$setStateInfo = function(newState, newParams) {
        state = newState;
        params = newParams;
        paramKeys = params && Object.keys(params);
        update();
      };

      $scope.$on('$stateChangeSuccess', update);
      $scope.$on('$stateChangeError', function() {
        $attrs.$removeClass(activeClass);
      });

      // Update route state
      function update() {
        if ($state.current.name === state && matchesParams()) {
          $attrs.$addClass(activeClass);
        } else {
          $attrs.$removeClass(activeClass);
        }
      }

      function matchesParams() {
        if (params) {
          var result = true;
          // Can't use angular.equals() because it is possible for ui-sref
          // to not reference each state parameter in $stateParams
          //
          // Unfortunately, using angular.forEach, short-circuiting is
          // impossible --- But it's unlikely that very many parameters are
          // used, so it is unlikely to hurt badly.
          angular.forEach(params, function(value, key) {
            if ($stateParams[key] !== value) {
              result = false;
            }
          });
          return result;
        }
        return true;
      }
    }
  };
}

angular.module('ui.router.state')
  .directive('uiSref', $StateRefDirective)
  .directive('uiStateActive', $StateActiveDirective);
