/**
 * These are the UI-Router angular 1 directives.
 *
 * These directives are used in templates to create viewports and navigate to states
 *
 * @preferred @module ng1_directives
 */ /** for typedoc */
import {Obj, extend, forEach, toJson, tail} from "../../common/common";
import {isString, isObject} from "../../common/predicates";
import {UIViewData} from "./viewDirective";
import {parse} from "../../common/hof";
import {PathNode} from "../../path/node";
import {StateOrName} from "../../state/interface";
import IAugmentedJQuery = angular.IAugmentedJQuery;
import {StateService} from "../../state/stateService";
import ITimeoutService = angular.ITimeoutService;
import IScope = angular.IScope;
import IInterpolateService = angular.IInterpolateService;
import {TransitionService} from "../../transition/transitionService";
import {State} from "../../state/stateObject";
import {UIRouter} from "../../router";

/** @hidden */
function parseStateRef(ref: string, current: string) {
  let preparsed = ref.match(/^\s*({[^}]*})\s*$/), parsed;
  if (preparsed) ref = current + '(' + preparsed[1] + ')';
  parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\((.*)\))?$/);
  if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
  return { state: parsed[1], paramExpr: parsed[3] || null };
}

/** @hidden */
function stateContext(el: IAugmentedJQuery) {
  let $uiView: UIViewData = (el.parent() as IAugmentedJQuery).inheritedData('$uiView');
  let path: PathNode[] = parse('$cfg.path')($uiView);
  return path ? tail(path).state.name : undefined;
}

interface TypeInfo {
  attr: string;
  isAnchor: boolean;
  clickable: boolean;
}

/** @hidden */
function getTypeInfo(el: IAugmentedJQuery): TypeInfo {
  // SVGAElement does not use the href attribute, but rather the 'xlinkHref' attribute.
  var isSvg = Object.prototype.toString.call(el.prop('href')) === '[object SVGAnimatedString]';
  var isForm = el[0].nodeName === "FORM";

  return {
    attr: isForm ? "action" : (isSvg ? 'xlink:href' : 'href'),
    isAnchor: el.prop("tagName").toUpperCase() === "A",
    clickable: !isForm
  };
}

/** @hidden */
function clickHook(el: IAugmentedJQuery, $state: StateService, $timeout: ITimeoutService, type: TypeInfo, current: Function) {
  return function(e: JQueryMouseEventObject) {
    var button = e.which || e.button, target = current();

    if (!(button > 1 || e.ctrlKey || e.metaKey || e.shiftKey || el.attr('target'))) {
      // HACK: This is to allow ng-clicks to be processed before the transition is initiated:
      var transition = $timeout(function() {
        $state.go(target.state, target.params, target.options);
      });
      e.preventDefault();

      // if the state has no URL, ignore one preventDefault from the <a> directive.
      var ignorePreventDefaultCount = type.isAnchor && !target.href ? 1: 0;

      e.preventDefault = function() {
        if (ignorePreventDefaultCount-- <= 0) $timeout.cancel(transition);
      };
    }
  };
}

/** @hidden */
function defaultOpts(el: IAugmentedJQuery, $state: StateService) {
  return {
    relative: stateContext(el) || $state.$current,
    inherit: true,
    source: "sref"
  };
}

/**
 * `ui-sref`: A directive for linking to a state
 *
 * A directive that binds a link (`<a>` tag) to a state.
 * If the state has an associated URL, the directive will automatically generate and
 * update the `href` attribute via the [[StateService.href]]  method.
 * Clicking the link will trigger a state transition with optional parameters.
 *
 * Also middle-clicking, right-clicking, and ctrl-clicking on the link will be
 * handled natively by the browser.
 *
 * You can also use relative state paths within ui-sref, just like the relative
 * paths passed to `$state.go()`.
 * You just need to be aware that the path is relative to the state that the link lives in.
 * In other words, the state that created the view containing the link.
 *
 * You can specify options to pass to [[StateService.go]] using the `ui-sref-opts` attribute.
 * Options are restricted to `location`, `inherit`, and `reload`.
 *
 * Here's an example of how you'd use ui-sref and how it would compile.
 * If you have the following template:
 *
 * @example
 * ```html
 *
 * <pre>
 * <a ui-sref="home">Home</a> | <a ui-sref="about">About</a> | <a ui-sref="{page: 2}">Next page</a>
 *
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a ui-sref="contacts.detail({ id: contact.id })">{{ contact.name }}</a>
 *     </li>
 * </ul>
 * </pre>
 * ```
 *
 * Then the compiled html would be (assuming Html5Mode is off and current state is contacts):
 *
 * ```html
 *
 * <pre>
 * <a href="#/home" ui-sref="home">Home</a> | <a href="#/about" ui-sref="about">About</a> | <a href="#/contacts?page=2" ui-sref="{page: 2}">Next page</a>
 *
 * <ul>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/1" ui-sref="contacts.detail({ id: contact.id })">Joe</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/2" ui-sref="contacts.detail({ id: contact.id })">Alice</a>
 *     </li>
 *     <li ng-repeat="contact in contacts">
 *         <a href="#/contacts/3" ui-sref="contacts.detail({ id: contact.id })">Bob</a>
 *     </li>
 * </ul>
 *
 * <a ui-sref="home" ui-sref-opts="{reload: true}">Home</a>
 * </pre>
 * ```
 *
 * @param {string} ui-sref 'stateName' can be any valid absolute or relative state
 * @param {Object} ui-sref-opts options to pass to [[StateService.go]]
 */
let uiSref = ['$state', '$timeout',
function $StateRefDirective($state: StateService, $timeout: ITimeoutService) {
  return {
    restrict: 'A',
    require: ['?^uiSrefActive', '?^uiSrefActiveEq'],
    link: function(scope: IScope, element: IAugmentedJQuery, attrs: any, uiSrefActive: any) {
      var ref    = parseStateRef(attrs.uiSref, $state.current.name);
      var def: Def = { state: ref.state, href: null, params: null, options: null };
      var type   = getTypeInfo(element);
      var active = uiSrefActive[1] || uiSrefActive[0];
      var unlinkInfoFn: Function = null;
      var hookFn;

      def.options = extend(defaultOpts(element, $state), attrs.uiSrefOpts ? scope.$eval(attrs.uiSrefOpts) : {});

      var update = function(val?: any) {
        if (val) def.params = angular.copy(val);
        def.href = $state.href(ref.state, def.params, def.options);

        if (unlinkInfoFn) unlinkInfoFn();
        if (active) unlinkInfoFn = active.$$addStateInfo(ref.state, def.params);
        if (def.href !== null) attrs.$set(type.attr, def.href);
      };

      if (ref.paramExpr) {
        scope.$watch(ref.paramExpr, function(val) { if (val !== def.params) update(val); }, true);
        def.params = angular.copy(scope.$eval(ref.paramExpr));
      }
      update();

      if (!type.clickable) return;
      hookFn = clickHook(element, $state, $timeout, type, function() { return def; });
      element.bind("click", hookFn);
      scope.$on('$destroy', function() {
        element.unbind("click", hookFn);
      });
    }
  };
}];

/**
 * `ui-state`: A dynamic version of `ui-sref`
 *
 * Much like ui-sref, but will accept named $scope properties to evaluate for a state definition,
 * params and override options.
 *
 * @example
 * ```html
 *
 * <li ng-repeat="nav in navlinks">
 *   <a ui-state="nav.statename">{{nav.description}}</a>
 * </li>
 *
 * @param {string} ui-state 'stateName' can be any valid absolute or relative state
 * @param {Object} ui-state-params params to pass to [[StateService.href]]
 * @param {Object} ui-state-opts options to pass to [[StateService.go]]
 */
let uiState = ['$state', '$timeout',
function $StateRefDynamicDirective($state: StateService, $timeout: ITimeoutService) {
  return {
    restrict: 'A',
    require: ['?^uiSrefActive', '?^uiSrefActiveEq'],
    link: function(scope: IScope, element: IAugmentedJQuery, attrs: any, uiSrefActive: any) {
      var type   = getTypeInfo(element);
      var active = uiSrefActive[1] || uiSrefActive[0];
      var group  = [attrs.uiState, attrs.uiStateParams || null, attrs.uiStateOpts || null];
      var watch  = '[' + group.map(function(val) { return val || 'null'; }).join(', ') + ']';
      var def: Def = { state: null, params: null, options: null, href: null };
      var unlinkInfoFn: Function = null;
      var hookFn;

      function runStateRefLink (group: any[]) {
        def.state = group[0]; def.params = group[1]; def.options = group[2];
        def.href = $state.href(def.state, def.params, def.options);

        if (unlinkInfoFn) unlinkInfoFn();
        if (active) unlinkInfoFn = active.$$addStateInfo(def.state, def.params);
        if (def.href) attrs.$set(type.attr, def.href);
      }

      scope.$watch(watch, runStateRefLink, true);
      runStateRefLink(scope.$eval(watch));

      if (!type.clickable) return;
      hookFn = clickHook(element, $state, $timeout, type, function() { return def; });
      element.bind("click", hookFn);
      scope.$on('$destroy', function() {
        element.unbind("click", hookFn);
      });
    }
  };
}];


/**
 * `ui-sref-active` and `ui-sref-active-eq`: A directive that adds a CSS class when a `ui-sref` is active
 *
 * A directive working alongside ui-sref to add classes to an element when the
 * related ui-sref directive's state is active, and removing them when it is inactive.
 * The primary use-case is to simplify the special appearance of navigation menus
 * relying on `ui-sref`, by having the "active" state's menu button appear different,
 * distinguishing it from the inactive menu items.
 *
 * ui-sref-active can live on the same element as ui-sref or on a parent element. The first
 * ui-sref-active found at the same level or above the ui-sref will be used.
 *
 * Will activate when the ui-sref's target state or any child state is active. If you
 * need to activate only when the ui-sref target state is active and *not* any of
 * it's children, then you will use ui-sref-active-eq
 *
 * Given the following template:
 * @example
 * ```html
 *
 * <pre>
 * <ul>
 *   <li ui-sref-active="active" class="item">
 *     <a href ui-sref="app.user({user: 'bilbobaggins'})">@bilbobaggins</a>
 *   </li>
 * </ul>
 * </pre>
 * ```
 *
 *
 * When the app state is "app.user" (or any children states), and contains the state parameter "user" with value "bilbobaggins",
 * the resulting HTML will appear as (note the 'active' class):
 *
 * ```html
 *
 * <pre>
 * <ul>
 *   <li ui-sref-active="active" class="item active">
 *     <a ui-sref="app.user({user: 'bilbobaggins'})" href="/users/bilbobaggins">@bilbobaggins</a>
 *   </li>
 * </ul>
 * </pre>
 * ```
 *
 * The class name is interpolated **once** during the directives link time (any further changes to the
 * interpolated value are ignored).
 *
 * Multiple classes may be specified in a space-separated format:
 *
 * ```html
 * <pre>
 * <ul>
 *   <li ui-sref-active='class1 class2 class3'>
 *     <a ui-sref="app.user">link</a>
 *   </li>
 * </ul>
 * </pre>
 * ```
 *
 * It is also possible to pass ui-sref-active an expression that evaluates
 * to an object hash, whose keys represent active class names and whose
 * values represent the respective state names/globs.
 * ui-sref-active will match if the current active state **includes** any of
 * the specified state names/globs, even the abstract ones.
 *
 * Given the following template, with "admin" being an abstract state:
 * @example
 * ```html
 *
 * <pre>
 * <div ui-sref-active="{'active': 'admin.*'}">
 *   <a ui-sref-active="active" ui-sref="admin.roles">Roles</a>
 * </div>
 * </pre>
 * ```
 *
 * When the current state is "admin.roles" the "active" class will be applied
 * to both the <div> and <a> elements. It is important to note that the state
 * names/globs passed to ui-sref-active shadow the state provided by ui-sref.
 */
let uiSrefActive = ['$state', '$stateParams', '$interpolate', '$transitions', '$uiRouter',
function $StateRefActiveDirective($state: StateService, $stateParams: Obj, $interpolate: IInterpolateService, $transitions: TransitionService, $uiRouter: UIRouter) {
  return  {
    restrict: "A",
    controller: ['$scope', '$element', '$attrs', '$timeout',
      function ($scope: IScope, $element: IAugmentedJQuery, $attrs: any, $timeout: ITimeoutService) {
      var states: any[] = [], activeClasses: Obj = {}, activeEqClass: string, uiSrefActive: any;

      // There probably isn't much point in $observing this
      // uiSrefActive and uiSrefActiveEq share the same directive object with some
      // slight difference in logic routing
      activeEqClass = $interpolate($attrs.uiSrefActiveEq || '', false)($scope);

      try {
        uiSrefActive = $scope.$eval($attrs.uiSrefActive);
      } catch (e) {
        // Do nothing. uiSrefActive is not a valid expression.
        // Fall back to using $interpolate below
      }
      uiSrefActive = uiSrefActive || $interpolate($attrs.uiSrefActive || '', false)($scope);
      if (isObject(uiSrefActive)) {
        forEach(uiSrefActive, function(stateOrName: StateOrName, activeClass: string) {
          if (isString(stateOrName)) {
            var ref = parseStateRef(stateOrName, $state.current.name);
            addState(ref.state, $scope.$eval(ref.paramExpr), activeClass);
          }
          else if(isArray(stateOrName)) {
                  forEach(stateOrName, function(value, key) {
                      var ref = parseStateRef(value, $state.current.name);
                      addState(ref.state, $scope.$eval(ref.paramExpr), activeClass);
                  });
                }
        });
      }

      // Allow uiSref to communicate with uiSrefActive[Equals]
      this.$$addStateInfo = function (newState: string, newParams: Obj) {
        // we already got an explicit state provided by ui-sref-active, so we
        // shadow the one that comes from ui-sref
        if (isObject(uiSrefActive) && states.length > 0) {
          return;
        }
        var deregister = addState(newState, newParams, uiSrefActive);
        update();
        return deregister;
      };

      function updateAfterTransition(trans) { trans.promise.then(update); }
      $scope.$on('$stateChangeSuccess', update);
      $scope.$on('$destroy', <any> $transitions.onStart({}, updateAfterTransition));
      if ($uiRouter.globals.transition) {
        updateAfterTransition($uiRouter.globals.transition);
      }

      function addState(stateName: string, stateParams: Obj, activeClass: string) {
        var state = $state.get(stateName, stateContext($element));
        var stateHash = createStateHash(stateName, stateParams);

        var stateInfo = {
          state: state || { name: stateName },
          params: stateParams,
          hash: stateHash
        };

        states.push(stateInfo);
        activeClasses[stateHash] = activeClass;

        return function removeState() {
          var idx = states.indexOf(stateInfo);
          if (idx !== -1) states.splice(idx, 1);
        }
      }

      /**
       * @param {string} state
       * @param {Object|string} [params]
       * @return {string}
       */
      function createStateHash(state: string, params: (Obj|string)) {
        if (!isString(state)) {
          throw new Error('state should be a string');
        }
        if (isObject(params)) {
          return state + toJson(params);
        }
        params = $scope.$eval(params as string);
        if (isObject(params)) {
          return state + toJson(params);
        }
        return state;
      }

      // Update route state
      function update() {
        for (var i = 0; i < states.length; i++) {
          if (anyMatch(states[i].state, states[i].params)) {
            addClass($element, activeClasses[states[i].hash]);
          } else {
            removeClass($element, activeClasses[states[i].hash]);
          }

          if (exactMatch(states[i].state, states[i].params)) {
            addClass($element, activeEqClass);
          } else {
            removeClass($element, activeEqClass);
          }
        }
      }

      function addClass(el: IAugmentedJQuery, className: string) { $timeout(function () { el.addClass(className); }); }
      function removeClass(el: IAugmentedJQuery, className: string) { el.removeClass(className); }
      function anyMatch(state: State, params: Obj) { return $state.includes(state.name, params); }
      function exactMatch(state: State, params: Obj) { return $state.is(state.name, params); }

      update();
    }]
  };
}];

interface Def { state: string; href: string; params: Obj; options: any; }
angular.module('ui.router.state')
    .directive('uiSref', uiSref)
    .directive('uiSrefActive', uiSrefActive)
    .directive('uiSrefActiveEq', uiSrefActive)
    .directive('uiState', uiState);
