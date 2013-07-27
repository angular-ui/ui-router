$StateProvider.$inject = ['$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider'];
function $StateProvider(   $urlRouterProvider,   $urlMatcherFactory,           $locationProvider) {

  var root, states = {}, $state;

  // Builds state properties from definition passed to registerState()
  var stateBuilder = {

    // Derive parent state from a hierarchical name only if 'parent' is not explicitly defined.
    // state.children = [];
    // if (parent) parent.children.push(state);
    parent: function(state) {
      if (isDefined(state.parent) && state.parent) return findState(state.parent);
      // regex matches any valid composite state name
      // would match "contact.list" but not "contacts"
      var compositeName = /^(.+)\.[^.]+$/.exec(state.name);
      return compositeName ? findState(compositeName[1]) : root;
    },

    // inherit 'data' from parent and override by own values (if any)
    data: function(state) {
      if (state.parent && state.parent.data) {
        state.data = state.self.data = angular.extend({}, state.parent.data, state.data);
      }
      return state.data;
    },

    // Build a URLMatcher if necessary, either via a relative or absolute URL
    url: function(state) {
      var url = state.url;

      if (isString(url)) {
        if (url.charAt(0) == '^') {
          return $urlMatcherFactory.compile(url.substring(1));
        }
        return (state.parent.navigable || root).url.concat(url);
      }
      var isMatcher = (
        isObject(url) && isFunction(url.exec) && isFunction(url.format) && isFunction(url.concat)
      );

      if (isMatcher || url == null) {
        return url;
      }
      throw new Error("Invalid url '" + url + "' in state '" + state + "'");
    },

    // Keep track of the closest ancestor state that has a URL (i.e. is navigable)
    navigable: function(state) {
      return state.url ? state : (state.parent ? state.parent.navigable : null);
    },

    // Derive parameters for this state and ensure they're a super-set of parent's parameters
    params: function(state) {
      if (!state.params) {
        return state.url ? state.url.parameters() : state.parent.params;
      }
      if (!isArray(state.params)) throw new Error("Invalid params in state '" + state + "'");
      if (state.url) throw new Error("Both params and url specicified in state '" + state + "'");
      return state.params;
    },

    // If there is no explicit multi-view configuration, make one up so we don't have
    // to handle both cases in the view directive later. Note that having an explicit
    // 'views' property will mean the default unnamed view properties are ignored. This
    // is also a good time to resolve view names to absolute names, so everything is a
    // straight lookup at link time.
    views: function(state) {
      var views = {};

      forEach(isDefined(state.views) ? state.views : { '': state }, function (view, name) {
        if (name.indexOf('@') < 0) name += '@' + state.parent.name;
        views[name] = view;
      });
      return views;
    },

    ownParams: function(state) {
      if (!state.parent) {
        return state.params;
      }
      var paramNames = {}; forEach(state.params, function (p) { paramNames[p] = true; });

      forEach(state.parent.params, function (p) {
        if (!paramNames[p]) {
          throw new Error("Missing required parameter '" + p + "' in state '" + state.name + "'");
        }
        paramNames[p] = false;
      });
      var ownParams = [];

      forEach(paramNames, function (own, p) {
        if (own) ownParams.push(p);
      });
      return ownParams;
    },

    // Keep a full path from the root down to this state as this is needed for state activation.
    path: function(state) {
      return state.parent ? state.parent.path.concat(state) : []; // exclude root from path
    },

    // Speed up $state.contains() as it's used a lot
    includes: function(state) {
      var includes = state.parent ? extend({}, state.parent.includes) : {};
      includes[state.name] = true;
      return includes;
    }
  };


  function findState(stateOrName, base) {
    var isStr = isString(stateOrName),
        name = isStr ? stateOrName : stateOrName.name,
        path = isStr ? name.match(/^((?:(?:\^)(?:\.)?){1,})(.+)/) : null;

    if (path && path.length) {
      if (!base) throw new Error("No reference point given for path '"  + stateOrName + "'");
      var rel = path[1].split("."), i = 0, pathLength = rel.length - 1, current = base;

      for (; i < pathLength; i++) {
        if (rel[i] === "^") current = current.parent;
        if (!current) throw new Error("Path '" + name + "' not valid for state '" + base.name + "'");
      }
      name = current.name + "." + path[2];
    }
    var state = states[name];

    if (state && (isStr || (!isStr && (state === stateOrName || state.self === stateOrName)))) {
      return state;
    }
    throw new Error(isStr ? "No such state '" + name + "'" : "Invalid or unregistered state");
  }


  function registerState(state) {
    // Wrap a new object around the state so we can store our private details easily.
    state = inherit(state, {
      self: state,
      resolve: state.resolve || {},
      toString: function() { return this.name; }
    });

    var name = state.name;
    if (!isString(name) || name.indexOf('@') >= 0) throw new Error("State must have a valid name");
    if (states[name]) throw new Error("State '" + name + "'' is already defined");

    for (var key in stateBuilder) {
      state[key] = stateBuilder[key](state);
    }
    states[name] = state;

    // Register the state in the global state list and with $urlRouter if necessary.
    if (!state['abstract'] && state.url) {
      $urlRouterProvider.when(state.url, ['$match', '$stateParams', function ($match, $stateParams) {
        if ($state.$current.navigable != state || !equalForKeys($match, $stateParams)) {
          $state.transitionTo(state, $match, false);
        }
      }]);
    }
    return state;
  }


  // Implicit root state that is always active
  root = registerState({
    name: '',
    url: '^',
    views: null,
    'abstract': true
  });
  root.locals = { globals: { $stateParams: {} } };
  root.navigable = null;


  // .state(state)
  // .state(name, state)
  this.state = state;
  function state(name, definition) {
    /*jshint validthis: true */
    if (isObject(name)) definition = name;
    else definition.name = name;
    registerState(definition);
    return this;
  }

  // $urlRouter is injected just to ensure it gets instantiated
  this.$get = $get;
  $get.$inject = ['$rootScope', '$q', '$view', '$injector', '$stateParams', '$location', '$urlRouter'];
  function $get(   $rootScope,   $q,   $view,   $injector,   $stateParams,   $location,   $urlRouter) {

    var TransitionSuperseded = $q.reject(new Error('transition superseded'));
    var TransitionPrevented = $q.reject(new Error('transition prevented'));

    $state = {
      params: {},
      current: root.self,
      $current: root,
      transition: null
    };

    // $state.go = function go(to, params) {
    // };

    $state.transitionTo = function transitionTo(to, toParams, updateLocation) {
      if (!isDefined(updateLocation)) updateLocation = true;

      to = findState(to);
      if (to['abstract']) throw new Error("Cannot transition to abstract state '" + to + "'");
      var toPath = to.path,
          from = $state.$current, fromParams = $state.params, fromPath = from.path;

      // Starting from the root of the path, keep all levels that haven't changed
      var keep, state, locals = root.locals, toLocals = [];
      for (keep = 0, state = toPath[keep];
           state && state === fromPath[keep] && equalForKeys(toParams, fromParams, state.ownParams);
           keep++, state = toPath[keep]) {
        locals = toLocals[keep] = state.locals;
      }

      // If we're going to the same state and all locals are kept, we've got nothing to do.
      // But clear 'transition', as we still want to cancel any other pending transitions.
      // TODO: We may not want to bump 'transition' if we're called from a location change that we've initiated ourselves,
      // because we might accidentally abort a legitimate transition initiated from code?
      if (to === from && locals === from.locals) {
        $state.transition = null;
        return $q.when($state.current);
      }

      // Normalize/filter parameters before we pass them to event handlers etc.
      toParams = normalize(to.params, toParams || {});

      // Broadcast start event and cancel the transition if requested
      var evt = $rootScope.$broadcast('$stateChangeStart', to.self, toParams, from.self, fromParams);
      if (evt.defaultPrevented) return TransitionPrevented;

      // Resolve locals for the remaining states, but don't update any global state just
      // yet -- if anything fails to resolve the current state needs to remain untouched.
      // We also set up an inheritance chain for the locals here. This allows the view directive
      // to quickly look up the correct definition for each view in the current state. Even
      // though we create the locals object itself outside resolveState(), it is initially
      // empty and gets filled asynchronously. We need to keep track of the promise for the
      // (fully resolved) current locals, and pass this down the chain.
      var resolved = $q.when(locals);
      for (var l=keep; l<toPath.length; l++, state=toPath[l]) {
        locals = toLocals[l] = inherit(locals);
        resolved = resolveState(state, toParams, state===to, resolved, locals);
      }

      // Once everything is resolved, we are ready to perform the actual transition
      // and return a promise for the new state. We also keep track of what the
      // current promise is, so that we can detect overlapping transitions and
      // keep only the outcome of the last transition.
      var transition = $state.transition = resolved.then(function () {
        var l, entering, exiting;

        if ($state.transition !== transition) return TransitionSuperseded;

        // Exit 'from' states not kept
        for (l=fromPath.length-1; l>=keep; l--) {
          exiting = fromPath[l];
          if (exiting.self.onExit) {
            $injector.invoke(exiting.self.onExit, exiting.self, exiting.locals.globals);
          }
          exiting.locals = null;
        }

        // Enter 'to' states not kept
        for (l=keep; l<toPath.length; l++) {
          entering = toPath[l];
          entering.locals = toLocals[l];
          if (entering.self.onEnter) {
            $injector.invoke(entering.self.onEnter, entering.self, entering.locals.globals);
          }
        }

        // Update globals in $state
        $state.$current = to;
        $state.current = to.self;
        $state.params = toParams;
        copy($state.params, $stateParams);
        $state.transition = null;

        // Update $location
        var toNav = to.navigable;
        if (updateLocation && toNav) {
          $location.url(toNav.url.format(toNav.locals.globals.$stateParams));
        }

        $rootScope.$broadcast('$stateChangeSuccess', to.self, toParams, from.self, fromParams);

        return $state.current;
      }, function (error) {
        if ($state.transition !== transition) return TransitionSuperseded;

        $state.transition = null;
        $rootScope.$broadcast('$stateChangeError', to.self, toParams, from.self, fromParams, error);

        return $q.reject(error);
      });

      return transition;
    };

    $state.is = function (stateOrName) {
      return $state.$current === findState(stateOrName);
    };

    $state.includes = function (stateOrName) {
      return $state.$current.includes[findState(stateOrName).name];
    };

    $state.href = function (stateOrName, params, options) {
      options = extend({ lossy: true }, options || {});
      var state = findState(stateOrName);
      var nav = (state && options.lossy) ? state.navigable : state;
      var url = (nav && nav.url) ? nav.url.format(normalize(state.params, params || {})) : null;
      return !$locationProvider.html5Mode() && url ? "#" + url : url;
    };

    $state.getConfig = function (stateOrName) {
      var state = findState(stateOrName);
      return state.self || null;
    };

    function resolveState(state, params, paramsAreFiltered, inherited, dst) {
      // We need to track all the promises generated during the resolution process.
      // The first of these is for the fully resolved parent locals.
      var promises = [inherited];

      // Make a restricted $stateParams with only the parameters that apply to this state if
      // necessary. In addition to being available to the controller and onEnter/onExit callbacks,
      // we also need $stateParams to be available for any $injector calls we make during the
      // dependency resolution process.
      var $stateParams = (paramsAreFiltered) ? params : filterByKeys(state.params, params);
      var locals = { $stateParams: $stateParams };

      // Resolves the values from an individual 'resolve' dependency spec
      function resolve(deps, dst) {
        forEach(deps, function (value, key) {
          promises.push($q
            .when(isString(value) ?
                $injector.get(value) :
                $injector.invoke(value, state.self, locals))
            .then(function (result) {
              dst[key] = result;
            }));
        });
      }

      // Resolve 'global' dependencies for the state, i.e. those not specific to a view.
      // We're also including $stateParams in this; that way the parameters are restricted
      // to the set that should be visible to the state, and are independent of when we update
      // the global $state and $stateParams values.
      var globals = dst.globals = { $stateParams: $stateParams };
      resolve(state.resolve, globals);
      globals.$$state = state; // Provide access to the state itself for internal use

      // Resolve template and dependencies for all views.
      forEach(state.views, function (view, name) {
        // References to the controller (only instantiated at link time)
        var _$view = dst[name] = {
          $$controller: view.controller
        };

        // Template
        promises.push($q
          .when($view.load(name, { view: view, locals: locals, notify: false }) || '')
          .then(function (result) {
            _$view.$template = result;
          }));

        // View-local dependencies. If we've reused the state definition as the default
        // view definition in .state(), we can end up with state.resolve === view.resolve.
        // Avoid resolving everything twice in that case.
        if (view.resolve !== state.resolve) resolve(view.resolve, _$view);
      });

      // Once we've resolved all the dependencies for this state, merge
      // in any inherited dependencies, and merge common state dependencies
      // into the dependency set for each view. Finally return a promise
      // for the fully popuplated state dependencies.
      return $q.all(promises).then(function (values) {
        merge(dst.globals, values[0].globals); // promises[0] === inherited
        forEach(state.views, function (view, name) {
          merge(dst[name], dst.globals);
        });
        return dst;
      });
    }

    return $state;
  }

  function normalize(keys, values) {
    var normalized = {};

    forEach(keys, function (name) {
      var value = values[name];
      normalized[name] = (value != null) ? String(value) : null;
    });
    return normalized;
  }

  function equalForKeys(a, b, keys) {
    // If keys not provided, assume keys from object 'a'
    if (!keys) {
      keys = [];
      for (var n in a) keys.push(n); // Used instead of Object.keys() for IE8 compatibility
    }

    for (var i=0; i<keys.length; i++) {
      var k = keys[i];
      if (a[k] != b[k]) return false; // Not '===', values aren't necessarily normalized
    }
    return true;
  }

  function filterByKeys(keys, values) {
    var filtered = {};

    forEach(keys, function (name) {
      filtered[name] = values[name];
    });
    return filtered;
  }
}

angular.module('ui.state')
  .value('$stateParams', {})
  .provider('$state', $StateProvider);
