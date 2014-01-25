function parseStateRef(ref) {
  var parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\((.*)\))?$/);
  if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
  return { state: parsed[1], paramExpr: parsed[3] || null };
}

function stateContext(el) {
  var stateData = el.parent().inheritedData('$uiView');

  if (stateData && stateData.state && stateData.state.name) {
    return stateData.state;
  }
}

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-sref
 *
 * @requires ui.router.state.$state
 * @requires ui.router.state.$stateParams
 * @requires $timeout
 *
 * @restrict A
 *
 * @description
 * A directive that binds a link (`<a>` tag) to a state. If the state has an associated 
 * URL, the directive will automatically generate & update the `href` attribute via 
 * the {@link ui.router.state.$state#methods_href $state.href()} method. Clicking 
 * the link will trigger a state transition with optional parameters. 
 *
 * Also middle-clicking, right-clicking, and ctrl-clicking on the link will be 
 * handled natively by the browser.
 *
 * You can also use relative state paths within ui-sref, just like the relative 
 * paths passed to `$state.go()`. You just need to be aware that the path is relative
 * to the state that the link lives in, in other words the state that loaded the 
 * template containing the link.
 *
 * @example
 * <pre>
 * <a ui-sref="home">Home</a> | <a ui-sref="about">About</a>
 *
 * <ul>
 *   <li ng-repeat="contact in contacts">
 *     <a ui-sref="contacts.detail({ id: contact.id })">{{ contact.name }}</a>
 *   </li>
 * </ul>
 * </pre>
 *
 * @param {string} ui-sref 'stateName' can be any valid absolute or relative state
 */
$StateRefDirective.$inject = ['$state', '$timeout', '$stateParams'];
function $StateRefDirective($state, $timeout, $stateParams) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var ref = parseStateRef(attrs.uiSref);
      var state = null, params = null, url = null, base = stateContext(element) || $state.$current;
      var isForm = element[0].nodeName === "FORM";
      var attr = isForm ? "action" : "href", nav = true;

      var update = function(newVal) {
        if (newVal) params = newVal;
        if (!nav) return;

        var newHref = $state.href(ref.state, params, { relative: base });
        state = $state.get(ref.state, base);

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

      element.bind("click", function(e) {
        var button = e.which || e.button;
        if ( !(button > 1 || e.ctrlKey || e.metaKey || e.shiftKey || element.attr('target')) ) {
          // HACK: This is to allow ng-clicks to be processed before the transition is initiated:
          $timeout(function() {
            $state.go(ref.state, params, { relative: base });
          });
          e.preventDefault();
        }
      });

      var emitEvents = function(){
        // HACK:
        // Emits events only after
        // 1. The execution of link functions of ancestor's ui-sref-active
        // or,
        // 2. The ancestor ui-sref-active has removed their previously appended classes.
        //
        $timeout(function(){
          if($state.$current.self === state && matchesParams()){
            // Exact match of current state
            scope.$emit('$uiSrefActivated');
          }else if($state.includes(state.name) && matchesParams()){
            // The current state is a child of reference state
            scope.$emit('$uiSrefChildStateActivated');
          }
        });
      };

      // Emits $uiSref*Activated events.
      scope.$on('$stateChangeSuccess', emitEvents);

      // Also emits the events when the element is first created (linked).
      // This makes sure the events are emitted if a state is directly navigated
      // through the browser navigation bar.
      //
      emitEvents();

      function matchesParams() {
        return !params || equalForKeys(params, $stateParams);
      }
    }
  };
}

/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-sref-active
 *
 * @requires ui.router.state.$state
 * @requires $interpolate
 *
 * @restrict A
 *
 * @description
 * A directive working alongside ui-sref to add classes to an element when the 
 * related ui-sref directive's state is active, and removing them when it is inactive.
 * The primary use-case is to simplify the special appearance of navigation menus 
 * relying on `ui-sref`, by having the "active" state's menu button appear different,
 * distinguishing it from the inactive menu items.
 *
 * @example
 * <pre>
 * <ul>
 *   <li ui-sref-active="active" class="item active">
 *     <a ui-sref="app.user({user: 'bilbobaggins'})" href="/users/bilbobaggins">@bilbobaggins</a>
 *   </li>
 *   <!-- ... -->
 * </ul>
 * </pre>
 */
$StateActiveDirective.$inject = ['$state', '$interpolate'];
function $StateActiveDirective($state, $interpolate) {
  return {
    restrict: "A",
    scope: true, // Catching $uiSref*Activated events without sibling's interferance.
    link: function(scope, element, attrs) {
      var activeClass, activeClassNested, activeClassList;

      // There probably isn't much point in $observing this
      activeClass = $interpolate(attrs.uiSrefActive || '', false)(scope);
      activeClassNested = activeClass + '-nested';
      activeClassList = [activeClass, activeClassNested].join(' '); // space-separated list of all appended classes

      // Remove all previously appended classes.
      scope.$on('$stateChangeSuccess', function(){
        element.removeClass(activeClassList);
      });

      scope.$on('$uiSrefActivated', function(){
        element.addClass(activeClass);
      });

      scope.$on('$uiSrefChildStateActivated', function(){
        element.addClass(activeClassNested);
      });

    }
  };
}

angular.module('ui.router.state')
  .directive('uiSref', $StateRefDirective)
  .directive('uiSrefActive', $StateActiveDirective);
