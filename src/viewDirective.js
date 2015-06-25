/**
 * @ngdoc directive
 * @name ui.router.state.directive:ui-view
 *
 * @requires ui.router.state.$view
 * @requires $compile
 * @requires $interpolate
 * @requires $controller
 * @requires $animate
 * @requires ui.router.state.$uiViewScroll
 *
 * @restrict ECA
 *
 * @description
 * The ui-view directive tells $state where to place your templates.
 *
 * @param {string=} name A view name. The name should be unique amongst the other views in the
 * same state. You can have views of the same name that live in different states.
 *
 * @param {string=} autoscroll It allows you to set the scroll behavior of the browser window
 * when a view is populated. By default, $anchorScroll is overridden by ui-router's custom scroll
 * service, {@link ui.router.state.$uiViewScroll}. This custom service let's you
 * scroll ui-view elements into view when they are populated during a state activation.
 *
 * *Note: To revert back to old [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll)
 * functionality, call `$uiViewScrollProvider.useAnchorScroll()`.*
 *
 * @param {string=} onload Expression to evaluate whenever the view updates.
 *
 * @example
 * A view can be unnamed or named.
 * <pre>
 * <!-- Unnamed -->
 * <div ui-view></div>
 *
 * <!-- Named -->
 * <div ui-view="viewName"></div>
 * </pre>
 *
 * You can only have one unnamed view within any template (or root html). If you are only using a
 * single view and it is unnamed then you can populate it like so:
 * <pre>
 * <div ui-view></div>
 * $stateProvider.state("home", {
 *   template: "<h1>HELLO!</h1>"
 * })
 * </pre>
 *
 * The above is a convenient shortcut equivalent to specifying your view explicitly with the {@link ui.router.state.$stateProvider#views `views`}
 * config property, by name, in this case an empty name:
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }
 * })
 * </pre>
 *
 * But typically you'll only use the views property if you name your view or have more than one view
 * in the same template. There's not really a compelling reason to name a view if its the only one,
 * but you could if you wanted, like so:
 * <pre>
 * <div ui-view="main"></div>
 * </pre>
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "main": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }
 * })
 * </pre>
 *
 * Really though, you'll use views to set up multiple views:
 * <pre>
 * <div ui-view></div>
 * <div ui-view="chart"></div>
 * <div ui-view="data"></div>
 * </pre>
 *
 * <pre>
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     },
 *     "chart": {
 *       template: "<chart_thing/>"
 *     },
 *     "data": {
 *       template: "<data_thing/>"
 *     }
 *   }
 * })
 * </pre>
 *
 * Examples for `autoscroll`:
 *
 * <pre>
 * <!-- If autoscroll present with no expression,
 *      then scroll ui-view into view -->
 * <ui-view autoscroll/>
 *
 * <!-- If autoscroll present with valid expression,
 *      then scroll ui-view into view if expression evaluates to true -->
 * <ui-view autoscroll='true'/>
 * <ui-view autoscroll='false'/>
 * <ui-view autoscroll='scopeVariable'/>
 * </pre>
 */
$ViewDirective.$inject = ['$view', '$animate', '$uiViewScroll', '$interpolate'];
function $ViewDirective(   $view,   $animate,   $uiViewScroll,   $interpolate) {

  var views = {};

  function getRenderer(attrs, scope) {
    return {
      enter: function(element, target, cb) {
        var promise = $animate.enter(element, null, target, cb);
        if (promise && promise.then) promise.then(cb);
      },
      leave: function(element, cb) {
        var promise = $animate.leave(element, cb);
        if (promise && promise.then) promise.then(cb);
      }
    };
  }

  function configsEqual(config1, config2) {
    return (config1 === config2) || (config1 && config2 && (
      config1.controller === config2.controller &&
      config1.template   === config2.template &&
      config1.invokeWithContext === config2.invokeWithContext
      ));
  }

  var directive = {
    restrict: 'ECA',
    terminal: true,
    priority: 400,
    transclude: 'element',
    compile: function (tElement, tAttrs, $transclude) {

      return function (scope, $element, attrs) {
        var previousEl, currentEl, currentScope, unregister,
            onloadExp     = attrs.onload || '',
            autoScrollExp = attrs.autoscroll,
            renderer      = getRenderer(attrs, scope),
            viewConfig    = {},
            inherited     = $element.inheritedData('$uiView'),
            name          = $interpolate(attrs.uiView || attrs.name || '')(scope) || '$default';

        var viewData = {
          name: (inherited && inherited.name) ? inherited.name + "." + name : name
        };
        $element.data('$uiView', viewData);

        updateView();

        function configUpdatedCallback(config) {
          if (configsEqual(viewConfig, config)) return;
          updateView(config);
        }

        unregister = $view.register(viewData.name, configUpdatedCallback);
        scope.$on("$destroy", function() {
          unregister();
        });


        function cleanupLastView() {
          if (previousEl) {
            previousEl.remove();
            previousEl = null;
          }

          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }

          if (currentEl) {
            renderer.leave(currentEl, function() {
              previousEl = null;
            });

            previousEl = currentEl;
            currentEl = null;
          }
        }

        function updateView(config) {
          config = config || {};
          var newScope = scope.$new();

          extend(viewData, {
            $template: config.template,
            $$controller: config.controller,
            $$controllerAs: config.config && config.config.controllerAs,
            invokeWithContext: config.invokeWithContext
          });

          var clone = $transclude(newScope, function(clone) {
            renderer.enter(clone.data('$uiView', viewData), $element, function onUiViewEnter() {
              if(currentScope) {
                currentScope.$emit('$viewContentAnimationEnded');
              }

              if (angular.isDefined(autoScrollExp) && !autoScrollExp || scope.$eval(autoScrollExp)) {
                $uiViewScroll(clone);
              }
            });
            cleanupLastView();
          });

          currentEl = clone;
          currentScope = newScope;
          /**
           * @ngdoc event
           * @name ui.router.state.directive:ui-view#$viewContentLoaded
           * @eventOf ui.router.state.directive:ui-view
           * @eventType emits on ui-view directive scope
           * @description           *
           * Fired once the view is **loaded**, *after* the DOM is rendered.
           *
           * @param {Object} event Event object.
           */
          currentScope.$emit('$viewContentLoaded', config || viewConfig);
          currentScope.$eval(onloadExp);
        }
      };
    }
  };

  return directive;
}

$ViewDirectiveFill.$inject = ['$compile', '$controller', '$interpolate'];
function $ViewDirectiveFill (  $compile,   $controller,   $interpolate) {
  return {
    restrict: 'ECA',
    priority: -400,
    compile: function (tElement) {
      var initial = tElement.html();

      return function (scope, $element) {
        var data = $element.data('$uiView'),
          locals = { /* TODO: locals broken; integrate $controller and invokeWithContext? */ };

        if (!data) return;

        $element.html(data.$template || initial);

        var link = $compile($element.contents());

        if (data.$$controller) {
          var controller = $controller(data.$$controller, extend(locals, { $scope: scope }));
          if (data.$$controllerAs) scope[data.$$controllerAs] = controller;

          $element.data('$ngControllerController', controller);
          $element.children().data('$ngControllerController', controller);
        }

        link(scope);
      };
    }
  };
}

angular.module('ui.router.state').directive('uiView', $ViewDirective);
angular.module('ui.router.state').directive('uiView', $ViewDirectiveFill);
