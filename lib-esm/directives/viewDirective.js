/**
 * @ng1api
 * @module directives
 */ /** for typedoc */
import { ng as angular } from "../angular";
import { noop } from "angular";
import { extend, unnestR, filter, tail, isDefined, isFunction, isString, trace, parse, ResolveContext, kebobString } from "@uirouter/core";
import { Ng1ViewConfig } from "../statebuilders/views";
import { getLocals } from "../services";
/**
 * `ui-view`: A viewport directive which is filled in by a view from the active state.
 *
 * ### Attributes
 *
 * - `name`: (Optional) A view name.
 *   The name should be unique amongst the other views in the same state.
 *   You can have views of the same name that live in different states.
 *   The ui-view can be targeted in a View using the name ([[Ng1StateDeclaration.views]]).
 *
 * - `autoscroll`: an expression. When it evaluates to true, the `ui-view` will be scrolled into view when it is activated.
 *   Uses [[$uiViewScroll]] to do the scrolling.
 *
 * - `onload`: Expression to evaluate whenever the view updates.
 *
 * #### Example:
 * A view can be unnamed or named.
 * ```html
 * <!-- Unnamed -->
 * <div ui-view></div>
 *
 * <!-- Named -->
 * <div ui-view="viewName"></div>
 *
 * <!-- Named (different style) -->
 * <ui-view name="viewName"></ui-view>
 * ```
 *
 * You can only have one unnamed view within any template (or root html). If you are only using a
 * single view and it is unnamed then you can populate it like so:
 *
 * ```html
 * <div ui-view></div>
 * $stateProvider.state("home", {
 *   template: "<h1>HELLO!</h1>"
 * })
 * ```
 *
 * The above is a convenient shortcut equivalent to specifying your view explicitly with the
 * [[Ng1StateDeclaration.views]] config property, by name, in this case an empty name:
 *
 * ```js
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
 * <div ui-view="main"></div>
 * ```
 *
 * ```js
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
 *
 * ```html
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
 * #### Examples for `autoscroll`:
 * ```html
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
 * can be customized using [[Ng1ViewDeclaration.resolveAs]]).  This can be then accessed from the template.
 *
 * Note that when `controllerAs` is being used, `$resolve` is set on the controller instance *after* the
 * controller is instantiated.  The `$onInit()` hook can be used to perform initialization code which
 * depends on `$resolve` data.
 *
 * #### Example:
 * ```js
 * $stateProvider.state('home', {
 *   template: '<my-component user="$resolve.user"></my-component>',
 *   resolve: {
 *     user: function(UserService) { return UserService.fetchUser(); }
 *   }
 * });
 * ```
 */
export var uiView;
uiView = ['$view', '$animate', '$uiViewScroll', '$interpolate', '$q',
    function $ViewDirective($view, $animate, $uiViewScroll, $interpolate, $q) {
        function getRenderer(attrs, scope) {
            return {
                enter: function (element, target, cb) {
                    if (angular.version.minor > 2) {
                        $animate.enter(element, null, target).then(cb);
                    }
                    else {
                        $animate.enter(element, null, target, cb);
                    }
                },
                leave: function (element, cb) {
                    if (angular.version.minor > 2) {
                        $animate.leave(element).then(cb);
                    }
                    else {
                        $animate.leave(element, cb);
                    }
                }
            };
        }
        function configsEqual(config1, config2) {
            return config1 === config2;
        }
        var rootData = {
            $cfg: { viewDecl: { $context: $view._pluginapi._rootViewContext() } },
            $uiView: {}
        };
        var directive = {
            count: 0,
            restrict: 'ECA',
            terminal: true,
            priority: 400,
            transclude: 'element',
            compile: function (tElement, tAttrs, $transclude) {
                return function (scope, $element, attrs) {
                    var previousEl, currentEl, currentScope, unregister, onloadExp = attrs['onload'] || '', autoScrollExp = attrs['autoscroll'], renderer = getRenderer(attrs, scope), viewConfig = undefined, inherited = $element.inheritedData('$uiView') || rootData, name = $interpolate(attrs['uiView'] || attrs['name'] || '')(scope) || '$default';
                    var activeUIView = {
                        $type: 'ng1',
                        id: directive.count++,
                        name: name,
                        fqn: inherited.$uiView.fqn ? inherited.$uiView.fqn + "." + name : name,
                        config: null,
                        configUpdated: configUpdatedCallback,
                        get creationContext() {
                            var fromParentTagConfig = parse('$cfg.viewDecl.$context')(inherited);
                            // Allow <ui-view name="foo"><ui-view name="bar"></ui-view></ui-view>
                            // See https://github.com/angular-ui/ui-router/issues/3355
                            var fromParentTag = parse('$uiView.creationContext')(inherited);
                            return fromParentTagConfig || fromParentTag;
                        }
                    };
                    trace.traceUIViewEvent("Linking", activeUIView);
                    function configUpdatedCallback(config) {
                        if (config && !(config instanceof Ng1ViewConfig))
                            return;
                        if (configsEqual(viewConfig, config))
                            return;
                        trace.traceUIViewConfigUpdated(activeUIView, config && config.viewDecl && config.viewDecl.$context);
                        viewConfig = config;
                        updateView(config);
                    }
                    $element.data('$uiView', { $uiView: activeUIView });
                    updateView();
                    unregister = $view.registerUIView(activeUIView);
                    scope.$on("$destroy", function () {
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
                            var _viewData_1 = currentEl.data('$uiViewAnim');
                            trace.traceUIViewEvent("Animate out", _viewData_1);
                            renderer.leave(currentEl, function () {
                                _viewData_1.$$animLeave.resolve();
                                previousEl = null;
                            });
                            previousEl = currentEl;
                            currentEl = null;
                        }
                    }
                    function updateView(config) {
                        var newScope = scope.$new();
                        var animEnter = $q.defer(), animLeave = $q.defer();
                        var $uiViewData = {
                            $cfg: config,
                            $uiView: activeUIView,
                        };
                        var $uiViewAnim = {
                            $animEnter: animEnter.promise,
                            $animLeave: animLeave.promise,
                            $$animLeave: animLeave
                        };
                        /**
                         * @ngdoc event
                         * @name ui.router.state.directive:ui-view#$viewContentLoading
                         * @eventOf ui.router.state.directive:ui-view
                         * @eventType emits on ui-view directive scope
                         * @description
                         *
                         * Fired once the view **begins loading**, *before* the DOM is rendered.
                         *
                         * @param {Object} event Event object.
                         * @param {string} viewName Name of the view.
                         */
                        newScope.$emit('$viewContentLoading', name);
                        var cloned = $transclude(newScope, function (clone) {
                            clone.data('$uiViewAnim', $uiViewAnim);
                            clone.data('$uiView', $uiViewData);
                            renderer.enter(clone, $element, function onUIViewEnter() {
                                animEnter.resolve();
                                if (currentScope)
                                    currentScope.$emit('$viewContentAnimationEnded');
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
$ViewDirectiveFill.$inject = ['$compile', '$controller', '$transitions', '$view', '$q', '$timeout'];
/** @hidden */
function $ViewDirectiveFill($compile, $controller, $transitions, $view, $q, $timeout) {
    var getControllerAs = parse('viewDecl.controllerAs');
    var getResolveAs = parse('viewDecl.resolveAs');
    return {
        restrict: 'ECA',
        priority: -400,
        compile: function (tElement) {
            var initial = tElement.html();
            tElement.empty();
            return function (scope, $element) {
                var data = $element.data('$uiView');
                if (!data) {
                    $element.html(initial);
                    $compile($element.contents())(scope);
                    return;
                }
                var cfg = data.$cfg || { viewDecl: {}, getTemplate: noop };
                var resolveCtx = cfg.path && new ResolveContext(cfg.path);
                $element.html(cfg.getTemplate($element, resolveCtx) || initial);
                trace.traceUIViewFill(data.$uiView, $element.html());
                var link = $compile($element.contents());
                var controller = cfg.controller;
                var controllerAs = getControllerAs(cfg);
                var resolveAs = getResolveAs(cfg);
                var locals = resolveCtx && getLocals(resolveCtx);
                scope[resolveAs] = locals;
                if (controller) {
                    var controllerInstance = $controller(controller, extend({}, locals, { $scope: scope, $element: $element }));
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
                    registerControllerCallbacks($q, $transitions, controllerInstance, scope, cfg);
                }
                // Wait for the component to appear in the DOM
                if (isString(cfg.viewDecl.component)) {
                    var cmp_1 = cfg.viewDecl.component;
                    var kebobName = kebobString(cmp_1);
                    var tagRegexp_1 = new RegExp("^(x-|data-)?" + kebobName + "$", "i");
                    var getComponentController = function () {
                        var directiveEl = [].slice.call($element[0].children)
                            .filter(function (el) { return el && el.tagName && tagRegexp_1.exec(el.tagName); });
                        return directiveEl && angular.element(directiveEl).data("$" + cmp_1 + "Controller");
                    };
                    var deregisterWatch_1 = scope.$watch(getComponentController, function (ctrlInstance) {
                        if (!ctrlInstance)
                            return;
                        registerControllerCallbacks($q, $transitions, ctrlInstance, scope, cfg);
                        deregisterWatch_1();
                    });
                }
                link(scope);
            };
        }
    };
}
/** @hidden */
var hasComponentImpl = typeof angular.module('ui.router')['component'] === 'function';
/** @hidden incrementing id */
var _uiCanExitId = 0;
/** @hidden TODO: move these callbacks to $view and/or `/hooks/components.ts` or something */
function registerControllerCallbacks($q, $transitions, controllerInstance, $scope, cfg) {
    // Call $onInit() ASAP
    if (isFunction(controllerInstance.$onInit) && !(cfg.viewDecl.component && hasComponentImpl)) {
        controllerInstance.$onInit();
    }
    var viewState = tail(cfg.path).state.self;
    var hookOptions = { bind: controllerInstance };
    // Add component-level hook for onParamsChange
    if (isFunction(controllerInstance.uiOnParamsChanged)) {
        var resolveContext = new ResolveContext(cfg.path);
        var viewCreationTrans_1 = resolveContext.getResolvable('$transition$').data;
        // Fire callback on any successful transition
        var paramsUpdated = function ($transition$) {
            // Exit early if the $transition$ is the same as the view was created within.
            // Exit early if the $transition$ will exit the state the view is for.
            if ($transition$ === viewCreationTrans_1 || $transition$.exiting().indexOf(viewState) !== -1)
                return;
            var toParams = $transition$.params("to");
            var fromParams = $transition$.params("from");
            var toSchema = $transition$.treeChanges().to.map(function (node) { return node.paramSchema; }).reduce(unnestR, []);
            var fromSchema = $transition$.treeChanges().from.map(function (node) { return node.paramSchema; }).reduce(unnestR, []);
            // Find the to params that have different values than the from params
            var changedToParams = toSchema.filter(function (param) {
                var idx = fromSchema.indexOf(param);
                return idx === -1 || !fromSchema[idx].type.equals(toParams[param.id], fromParams[param.id]);
            });
            // Only trigger callback if a to param has changed or is new
            if (changedToParams.length) {
                var changedKeys_1 = changedToParams.map(function (x) { return x.id; });
                // Filter the params to only changed/new to params.  `$transition$.params()` may be used to get all params.
                var newValues = filter(toParams, function (val, key) { return changedKeys_1.indexOf(key) !== -1; });
                controllerInstance.uiOnParamsChanged(newValues, $transition$);
            }
        };
        $scope.$on('$destroy', $transitions.onSuccess({}, paramsUpdated, hookOptions));
    }
    // Add component-level hook for uiCanExit
    if (isFunction(controllerInstance.uiCanExit)) {
        var id_1 = _uiCanExitId++;
        var cacheProp_1 = '_uiCanExitIds';
        // Returns true if a redirect transition already answered truthy
        var prevTruthyAnswer_1 = function (trans) {
            return !!trans && (trans[cacheProp_1] && trans[cacheProp_1][id_1] === true || prevTruthyAnswer_1(trans.redirectedFrom()));
        };
        // If a user answered yes, but the transition was later redirected, don't also ask for the new redirect transition
        var wrappedHook = function (trans) {
            var promise, ids = trans[cacheProp_1] = trans[cacheProp_1] || {};
            if (!prevTruthyAnswer_1(trans)) {
                promise = $q.when(controllerInstance.uiCanExit(trans));
                promise.then(function (val) { return ids[id_1] = (val !== false); });
            }
            return promise;
        };
        var criteria = { exiting: viewState.name };
        $scope.$on('$destroy', $transitions.onBefore(criteria, wrappedHook, hookOptions));
    }
}
angular.module('ui.router.state').directive('uiView', uiView);
angular.module('ui.router.state').directive('uiView', $ViewDirectiveFill);
//# sourceMappingURL=viewDirective.js.map