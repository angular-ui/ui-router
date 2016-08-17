/** @module ng1_directives */ /** for typedoc */
"use strict";
import {extend, unnestR, filter, tail} from "../../common/common";
import {isDefined, isFunction, isString} from "../../common/predicates";
import {trace} from "../../common/trace";
import {ActiveUIView} from "../../view/interface";
import {Ng1ViewConfig} from "../statebuilders/views";
import {TransitionService} from "../../transition/transitionService";
import {parse} from "../../common/hof";
import {ResolveContext} from "../../resolve/resolveContext";
import {Transition} from "../../transition/transition";
import {PathNode} from "../../path/node";
import {Param} from "../../params/param";
import {kebobString} from "../../common/strings";
import {HookRegOptions} from "../../transition/interface";
import {Ng1Controller, Ng1StateDeclaration} from "../interface";
import {getLocals} from "../services";
import {ViewService} from "../../view/view";
import IAnimateService = angular.IAnimateService;
import IInterpolateService = angular.IInterpolateService;
import {$QLike} from "../../common/coreservices";
import {Obj} from "../../common/common";
import IScope = angular.IScope;
import ITranscludeFunction = angular.ITranscludeFunction;
import IAugmentedJQuery = angular.IAugmentedJQuery;
import ICompileService = angular.ICompileService;
import IControllerService = angular.IControllerService;
import ITimeoutService = angular.ITimeoutService;

/** @hidden */
export type UIViewData = {
  $cfg: Ng1ViewConfig;
  $uiView: ActiveUIView;
}

/** @hidden */
export type UIViewAnimData = {
  $animEnter: Promise<any>;
  $animLeave: Promise<any>;
  $$animLeave: { resolve: () => any; } // "deferred"
}

/**
 * `ui-view`: A viewport directive which is filled in by a view from the active state.
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
 * A view can be unnamed or named.
 * @example
 * ```html
 *
 * <!-- Unnamed -->
 * <div ui-view></div>
 *
 * <!-- Named -->
 * <div ui-view="viewName"></div>
 * ```
 *
 * You can only have one unnamed view within any template (or root html). If you are only using a
 * single view and it is unnamed then you can populate it like so:
 * ```
 *
 * <div ui-view></div>
 * $stateProvider.state("home", {
 *   template: "<h1>HELLO!</h1>"
 * })
 * ```
 *
 * The above is a convenient shortcut equivalent to specifying your view explicitly with the {@link ui.router.state.$stateProvider#views `views`}
 * config property, by name, in this case an empty name:
 * ```js
 *
 * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }
 * })
 * ```
 *
 * But typically you'll only use the views property if you name your view or have more than one view
 * in the same template. There's not really a compelling reason to name a view if its the only one,
 * but you could if you wanted, like so:
 *
 * ```html
 *
 * <div ui-view="main"></div>
 * ```
 *
 * ```js
 *
 * $stateProvider.state("home", {
 *   views: {
 *     "main": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }
 * })
 * ```
 *
 * Really though, you'll use views to set up multiple views:
 * ```html
 *
 * <div ui-view></div>
 * <div ui-view="chart"></div>
 * <div ui-view="data"></div>
 * ```
 *
 * ```js
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
 * ```
 *
 * Examples for `autoscroll`:
 *
 * ```html
 *
 * <!-- If autoscroll present with no expression,
 *      then scroll ui-view into view -->
 * <ui-view autoscroll/>
 *
 * <!-- If autoscroll present with valid expression,
 *      then scroll ui-view into view if expression evaluates to true -->
 * <ui-view autoscroll='true'/>
 * <ui-view autoscroll='false'/>
 * <ui-view autoscroll='scopeVariable'/>
 * ```
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
 * ```js
 *
 * $stateProvider.state('home', {
 *   template: '<my-component user="$resolve.user"></my-component>',
 *   resolve: {
 *     user: function(UserService) { return UserService.fetchUser(); }
 *   }
 * });
 * ```
 */
let uiView = ['$view', '$animate', '$uiViewScroll', '$interpolate', '$q',
function $ViewDirective($view: ViewService, $animate: any, $uiViewScroll: any, $interpolate: IInterpolateService, $q: $QLike) {

  function getRenderer(attrs: Obj, scope: IScope) {
    return {
      enter: function(element: JQuery, target: any, cb: Function) {
        if (angular.version.minor > 2) {
          $animate.enter(element, null, target).then(cb);
        } else {
          $animate.enter(element, null, target, cb);
        }
      },
      leave: function(element: JQuery, cb: Function) {
        if (angular.version.minor > 2) {
          $animate.leave(element).then(cb);
        } else {
          $animate.leave(element, cb);
        }
      }
    };
  }

  function configsEqual(config1: Ng1ViewConfig, config2: Ng1ViewConfig) {
    return config1 === config2;
  }

  let rootData = {
    $cfg: { viewDecl: { $context: $view.rootContext() } },
    $uiView: { }
  };

  let directive = {
    count: 0,
    restrict: 'ECA',
    terminal: true,
    priority: 400,
    transclude: 'element',
    compile: function (tElement: JQuery, tAttrs: Obj, $transclude: ITranscludeFunction) {

      return function (scope: IScope, $element: IAugmentedJQuery, attrs: Obj) {
        let previousEl: JQuery, currentEl: JQuery,
            currentScope: IScope, unregister: Function,
            onloadExp     = attrs['onload'] || '',
            autoScrollExp = attrs['autoscroll'],
            renderer      = getRenderer(attrs, scope),
            viewConfig    = undefined as Ng1ViewConfig,
            inherited     = $element.inheritedData('$uiView') || rootData,
            name          = $interpolate(attrs['uiView'] || attrs['name'] || '')(scope) || '$default';

        let activeUIView: ActiveUIView = {
          $type: 'ng1',
          id: directive.count++,                                   // Global sequential ID for ui-view tags added to DOM
          name: name,                                              // ui-view name (<div ui-view="name"></div>
          fqn: inherited.$uiView.fqn ? inherited.$uiView.fqn + "." + name : name, // fully qualified name, describes location in DOM
          config: null,                                            // The ViewConfig loaded (from a state.views definition)
          configUpdated: configUpdatedCallback,                    // Called when the matching ViewConfig changes
          get creationContext() {                                  // The context in which this ui-view "tag" was created
            return parse('$cfg.viewDecl.$context')(inherited);
          }
        };

        trace.traceUIViewEvent("Linking", activeUIView);

        function configUpdatedCallback(config?: Ng1ViewConfig) {
          if (config && !(config instanceof Ng1ViewConfig)) return;
          if (configsEqual(viewConfig, config)) return;
          trace.traceUIViewConfigUpdated(activeUIView, config && config.viewDecl && config.viewDecl.$context);

          viewConfig = config;
          updateView(config);
        }

        $element.data('$uiView', { $uiView: activeUIView });

        updateView();

        unregister = $view.registerUIView(activeUIView);
        scope.$on("$destroy", function() {
          trace.traceUIViewEvent("Destroying/Unregistering", activeUIView);
          unregister();
        });

        function cleanupLastView() {
          if (previousEl) {
            trace.traceUIViewEvent("Removing (previous) el", previousEl.data('$uiView'));
            previousEl.remove();
            previousEl = null;
          }

          if (currentScope) {
            trace.traceUIViewEvent("Destroying scope", activeUIView);
            currentScope.$destroy();
            currentScope = null;
          }

          if (currentEl) {
            let _viewData = currentEl.data('$uiViewAnim');
            trace.traceUIViewEvent("Animate out", _viewData);
            renderer.leave(currentEl, function() {
              _viewData.$$animLeave.resolve();
              previousEl = null;
            });

            previousEl = currentEl;
            currentEl = null;
          }
        }

        function updateView(config?: Ng1ViewConfig) {
          let newScope = scope.$new();
          let animEnter = $q.defer(), animLeave = $q.defer();
          
          let $uiViewData: UIViewData = {
            $cfg: config,
            $uiView: activeUIView,
          };

          let $uiViewAnim: UIViewAnimData = {
            $animEnter: animEnter.promise,
            $animLeave: animLeave.promise,
            $$animLeave: animLeave
          };

          let cloned = $transclude(newScope, function(clone) {
            clone.data('$uiViewAnim', $uiViewAnim);
            clone.data('$uiView', $uiViewData);
            renderer.enter(clone, $element, function onUIViewEnter() {
              animEnter.resolve();
              if (currentScope) currentScope.$emit('$viewContentAnimationEnded');

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
}];

$ViewDirectiveFill.$inject = ['$compile', '$controller', '$transitions', '$view', '$timeout'];
/** @hidden */
function $ViewDirectiveFill ($compile: ICompileService, $controller: IControllerService, $transitions: TransitionService, $view: ViewService, $timeout: ITimeoutService) {
  const getControllerAs = parse('viewDecl.controllerAs');
  const getResolveAs = parse('viewDecl.resolveAs');

  return {
    restrict: 'ECA',
    priority: -400,
    compile: function (tElement: JQuery) {
      let initial = tElement.html();

      return function (scope: IScope, $element: JQuery) {
        let data: UIViewData = $element.data('$uiView');
        if (!data) return;

        let cfg: Ng1ViewConfig = data.$cfg || <any> { viewDecl: {} };
        $element.html(cfg.template || initial);
        trace.traceUIViewFill(data.$uiView, $element.html());

        let link = $compile($element.contents());
        let controller = cfg.controller;
        let controllerAs: string = getControllerAs(cfg);
        let resolveAs: string = getResolveAs(cfg);
        let resolveCtx: ResolveContext = cfg.path && new ResolveContext(cfg.path);
        let locals = resolveCtx && getLocals(resolveCtx);

        scope[resolveAs] = locals;
        
        if (controller) {
          let controllerInstance = $controller(controller, extend({}, locals, { $scope: scope, $element: $element }));
          if (controllerAs) {
            scope[controllerAs] = controllerInstance;
            scope[controllerAs][resolveAs] = locals;
          }

          // TODO: Use $view service as a central point for registering component-level hooks
          // Then, when a component is created, tell the $view service, so it can invoke hooks
          // $view.componentLoaded(controllerInstance, { $scope: scope, $element: $element });
          // scope.$on('$destroy', () => $view.componentUnloaded(controllerInstance, { $scope: scope, $element: $element }));

          $element.data('$ngControllerController', controllerInstance);
          $element.children().data('$ngControllerController', controllerInstance);

          registerControllerCallbacks($transitions, controllerInstance, scope, cfg);
        }

        // Wait for the component to appear in the DOM
        if (isString(cfg.viewDecl.component)) {
          let cmp = cfg.viewDecl.component;
          let kebobName = kebobString(cmp);
          let getComponentController = () => {
            let directiveEl = [].slice.call($element[0].children)
                .filter((el: Element) => el && el.tagName && el.tagName.toLowerCase() === kebobName) ;
            return directiveEl && angular.element(directiveEl).data(`$${cmp}Controller`);
          };

          let deregisterWatch = scope.$watch(getComponentController, function(ctrlInstance) {
            if (!ctrlInstance) return;
            registerControllerCallbacks($transitions, ctrlInstance, scope, cfg);
            deregisterWatch();
          });
        }

        link(scope);
      };
    }
  };
}

/** @hidden */
let hasComponentImpl = typeof (angular as any).module('ui.router')['component'] === 'function';

/** @hidden TODO: move these callbacks to $view and/or `/hooks/components.ts` or something */
function registerControllerCallbacks($transitions: TransitionService, controllerInstance: Ng1Controller, $scope: IScope, cfg: Ng1ViewConfig) {
  // Call $onInit() ASAP
  if (isFunction(controllerInstance.$onInit) && !(cfg.viewDecl.component && hasComponentImpl)) controllerInstance.$onInit();

  let viewState: Ng1StateDeclaration = tail(cfg.path).state.self;

  var hookOptions: HookRegOptions = { bind: controllerInstance };
  // Add component-level hook for onParamsChange
  if (isFunction(controllerInstance.uiOnParamsChanged)) {
    let resolveContext: ResolveContext = new ResolveContext(cfg.path);
    let viewCreationTrans = resolveContext.getResolvable('$transition$').data;

    // Fire callback on any successful transition
    const paramsUpdated = ($transition$: Transition) => {
      // Exit early if the $transition$ is the same as the view was created within.
      // Exit early if the $transition$ will exit the state the view is for.
      if ($transition$ === viewCreationTrans || $transition$.exiting().indexOf(viewState) !== -1) return;

      let toParams = $transition$.params("to");
      let fromParams = $transition$.params("from");
      let toSchema: Param[] = $transition$.treeChanges().to.map((node: PathNode) => node.paramSchema).reduce(unnestR, []);
      let fromSchema: Param[] = $transition$.treeChanges().from.map((node: PathNode) => node.paramSchema).reduce(unnestR, []);

      // Find the to params that have different values than the from params
      let changedToParams = toSchema.filter((param: Param) => {
        let idx = fromSchema.indexOf(param);
        return idx === -1 || !fromSchema[idx].type.equals(toParams[param.id], fromParams[param.id]);
      });

      // Only trigger callback if a to param has changed or is new
      if (changedToParams.length) {
        let changedKeys = changedToParams.map(x => x.id);
        // Filter the params to only changed/new to params.  `$transition$.params()` may be used to get all params.
        controllerInstance.uiOnParamsChanged(filter(toParams, (val, key) => changedKeys.indexOf(key) !== -1), $transition$);
      }
    };
    $scope.$on('$destroy', <any> $transitions.onSuccess({}, paramsUpdated, hookOptions));
  }

  // Add component-level hook for uiCanExit
  if (isFunction(controllerInstance.uiCanExit)) {
    var criteria = {exiting: viewState.name};
    $scope.$on('$destroy', <any> $transitions.onBefore(criteria, controllerInstance.uiCanExit, hookOptions));
  }
}

angular.module('ui.router.state').directive('uiView', uiView);
angular.module('ui.router.state').directive('uiView', $ViewDirectiveFill);
