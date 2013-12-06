function parseStateRef(ref) {
  var parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\(.*\))?\s*$/);
  if (!parsed || parsed.length !== 3) throw new Error("Invalid state ref '" + ref + "'");

  var state = parsed[1],
      paramExpr = parsed[2];
  return '["' + state + '"].concat' + (paramExpr || '()');
}

function stateContext(el) {
  var stateData = el.parent().inheritedData('$uiView');

  if (stateData && stateData.state && stateData.state.name) {
    return stateData.state;
  }
}

$StateRefDirective.$inject = ['$state'];
function $StateRefDirective($state) {
  return {
    restrict: 'A',
    require: '?^uiSrefActive',
    link: function(scope, element, attrs, uiSrefActive) {
      var ref = parseStateRef(attrs.uiSref),
          params = [],
          base = stateContext(element) || $state.$current,
          isForm = element[0].nodeName === "FORM",
          attr = isForm ? "action" : "href";

      var defaults = {
        relative: base
      };

      var update = function(newParams) {
        params = [].concat(newParams);
        params[1] = params[1] || {};
        params[2] = angular.extend({}, defaults, params[2] || {});

        var newHref = $state.href.apply($state, params);
        if (!newHref) {
          return;
        }

        attrs.$set(attr, newHref);

        if (uiSrefActive) {
          uiSrefActive.$$setStateInfo.apply(uiSrefActive, params);
        }
      };

      scope.$watch(ref, update, true);

      if (isForm) return;

      element.bind("click", function(e) {
        var button = e.which || e.button;

        if ((button === 0 || button === 1) && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          scope.$evalAsync(function() {
            $state.go.apply($state, params);
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
      var state, params, activeClass;

      // There probably isn't much point in $observing this
      activeClass = $interpolate($attrs.uiSrefActive || '', false)($scope);

      // Allow uiSref to communicate with uiSrefActive
      this.$$setStateInfo = function(newState, newParams, options) {
        state = $state.get(newState, options.relative || stateContext($element));
        params = newParams;
        update();
      };

      $scope.$on('$stateChangeSuccess', update);

      // Update route state
      function update() {
        if ($state.$current.self === state && matchesParams()) {
          $element.addClass(activeClass);
        } else {
          $element.removeClass(activeClass);
        }
      }

      function matchesParams() {
        return !params || equalForKeys(params, $stateParams);
      }
    }
  };
}

angular.module('ui.router.state')
  .directive('uiSref', $StateRefDirective)
  .directive('uiSrefActive', $StateActiveDirective);
