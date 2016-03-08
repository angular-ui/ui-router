/** @module view */ /** for typedoc */
import {extend} from "../common/common";
import {isDefined, isFunction} from "../common/predicates";
import {trace} from "../common/trace";
import {ViewConfig} from "../view/view";
import {UIViewData} from "../view/interface";
import {RejectType} from "../transition/rejectFactory";

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
 *
 * Resolve data:
 *
 * The resolved data from the state's `resolve` block is placed on the scope as `$resolve` (this
 * can be customized using [[ViewDeclaration.resolveAs]]).  This can be then accessed from the template.
 *
 * Note that when `controllerAs` is being used, `$resolve` is set on the controller instance *after* the
 * controller is instantiated.  The `$onInit()` hook can be used to perform initialization code which
 * depends on `$resolve` data.
 *
 * @example
 * ```
 *
 * $stateProvider.state('home', {
 *   template: '<my-component user="$resolve.user"></my-component>',
 *   resolve: {
 *     user: function(UserService) { return UserService.fetchUser(); }
 *   }
 * });
 * ```
 */
$ViewDirective.$inject = ['$view', '$animate', '$uiViewScroll', '$interpolate', '$q'];
function $ViewDirective(   $view,   $animate,   $uiViewScroll,   $interpolate,   $q) {

  function getRenderer(attrs, scope) {
    return {
      enter: function(element, target, cb) {
        if (angular.version.minor > 2) {
          $animate.enter(element, null, target).then(cb);
        } else {
          $animate.enter(element, null, target, cb);
        }
      },
      leave: function(element, cb) {
        if (angular.version.minor > 2) {
          $animate.leave(element).then(cb);
        } else {
          $animate.leave(element, cb);
        }
      }
    };
  }

  function configsEqual(config1, config2) {
    return config1 === config2;
  }

  let rootData = {
    context: $view.rootContext()
  };

  let directive = {
    count: 0,
    restrict: 'ECA',
    terminal: true,
    priority: 400,
    transclude: 'element',
    compile: function (tElement, tAttrs, $transclude) {

      return function (scope, $element, attrs) {
        let previousEl, currentEl, currentScope, unregister,
            onloadExp     = attrs.onload || '',
            autoScrollExp = attrs.autoscroll,
            renderer      = getRenderer(attrs, scope),
            viewConfig    = undefined,
            inherited     = $element.inheritedData('$uiView') || rootData,
            name          = $interpolate(attrs.uiView || attrs.name || '')(scope) || '$default';

        let viewData: UIViewData = {
          id: directive.count++,                                   // Global sequential ID for ui-view tags added to DOM
          name: name,                                              // ui-view name (<div ui-view="name"></div>
          fqn: inherited.name ? inherited.fqn + "." + name : name, // fully qualified name, describes location in DOM
          config: null,                                            // The ViewConfig loaded (from a state.views definition)
          configUpdated: configUpdatedCallback,                    // Called when the matching ViewConfig changes
          get creationContext() { return inherited.context; }      // The context in which this ui-view "tag" was created
        };

        trace.traceUiViewEvent("Linking", viewData);

        function configUpdatedCallback(config?: ViewConfig) {
          if (configsEqual(viewConfig, config)) return;
          trace.traceUiViewConfigUpdated(viewData, config && config.context);

          viewConfig = config;
          updateView(config);
        }

        $element.data('$uiView', viewData);

        updateView();

        unregister = $view.registerUiView(viewData);
        scope.$on("$destroy", function() {
          trace.traceUiViewEvent("Destroying/Unregistering", viewData);
          unregister();
        });

        function cleanupLastView() {
          if (previousEl) {
            trace.traceUiViewEvent("Removing (previous) el", previousEl.data('$uiView'));
            previousEl.remove();
            previousEl = null;
          }

          if (currentScope) {
            trace.traceUiViewEvent("Destroying scope", viewData);
            currentScope.$destroy();
            currentScope = null;
          }

          if (currentEl) {
            let _viewData = currentEl.data('$uiView');
            trace.traceUiViewEvent("Animate out", _viewData);
            renderer.leave(currentEl, function() {
              _viewData.$$animLeave.resolve();
              previousEl = null;
            });

            previousEl = currentEl;
            currentEl = null;
          }
        }

        function updateView(config?: ViewConfig) {
          config = config || <any> {};
          let newScope = scope.$new();
          trace.traceUiViewScopeCreated(viewData, newScope);
          let animEnter = $q.defer(), animLeave = $q.defer();

          let $uiViewData = extend({}, viewData, {
            context: config.context,
            $template: config.template,
            $controller: config.controller,
            $controllerAs: config.controllerAs,
            $resolveAs: config.resolveAs,
            $locals: config.locals,
            $animEnter: animEnter.promise,
            $animLeave: animLeave.promise,
            $$animLeave: animLeave
          });

          let cloned = $transclude(newScope, function(clone) {
            renderer.enter(clone.data('$uiView', $uiViewData), $element, function onUiViewEnter() {
              animEnter.resolve();
              if (currentScope) {
                currentScope.$emit('$viewContentAnimationEnded');
              }

              if (isDefined(autoScrollExp) && !autoScrollExp || scope.$eval(autoScrollExp)) {
                $uiViewScroll(clone);
              }
            });
            cleanupLastView();
          });

          currentEl = cloned;
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

$ViewDirectiveFill.$inject = ['$compile', '$controller', '$transitions', '$view', '$q'];
function $ViewDirectiveFill (  $compile,   $controller,   $transitions,   $view,   $q) {
  return {
    restrict: 'ECA',
    priority: -400,
    compile: function (tElement) {
      let initial = tElement.html();

      return function (scope, $element) {
        let data = $element.data('$uiView');
        if (!data) return;

        $element.html(data.$template || initial);
        trace.traceUiViewFill(data, $element.html());

        let link = $compile($element.contents());
        let controller = data.$controller;
        let controllerAs = data.$controllerAs;
        let resolveAs = data.$resolveAs;
        let locals = data.$locals;

        scope[resolveAs] = locals;
        
        if (controller) {
          let controllerInstance = $controller(controller, extend(locals, { $scope: scope, $element: $element }));
          if (controllerAs) {
            scope[controllerAs] = controllerInstance;
            scope[controllerAs][resolveAs] = locals;
          }

          // TODO: Use $view service as a central point for registering component-level hooks
          // Then, when a component is created, tell the $view service, so it can invoke hooks
          // $view.componentLoaded(controllerInstance, { $scope: scope, $element: $element });
          // scope.$on('$destroy', () => $view.componentUnloaded(controllerInstance, { $scope: scope, $element: $element }));

          // TODO: move this hook to $view or /hooks/onInitHook.ts or something
          if (isFunction(controllerInstance.$onInit)) controllerInstance.$onInit();

          // TODO: move this hook to $view or /hooks/onParamsChanged.ts or something
          if (isFunction(controllerInstance.uiOnParamsChanged)) {
            
            update.$inject = ['$transition$'];
            function update($transition$) {
              controllerInstance.uiOnParamsChanged($transition$.params("to"), $transition$.params("from"));
            }
            
            onDynamic.$inject = ['$error$', '$transition$'];
            function onDynamic($error$, $transition$) {
              if ($error$.type === RejectType.IGNORED) update($transition$);
            }
            
            let deregister = [
              $transitions.onSuccess({}, update),
              $transitions.onError({}, onDynamic)
            ];

            scope.$on('$destroy', () => deregister.forEach(x => x()));
          }
          
          // TODO: create canDeactivate hook (controller sugar)
          // if (isFunction(controllerInstance.canDeactivate)) {
          //   let deregister = [
          //   scope.$on($transitions.onStart({exiting: uiViewState}, controllerInstance.canDeactivate.bind(controllerInstance)));
          // } 

          $element.data('$ngControllerController', controllerInstance);
          $element.children().data('$ngControllerController', controllerInstance);
        }

        link(scope);
      };
    }
  };
}

angular.module('ui.router.state').directive('uiView', $ViewDirective);
angular.module('ui.router.state').directive('uiView', $ViewDirectiveFill);
