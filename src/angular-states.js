'use strict';

var isDefined = angular.isDefined,
  isFunction = angular.isFunction,
  isString = angular.isString,
  isObject = angular.isObject,
  forEach = angular.forEach,
  extend = angular.extend,
  copy = angular.copy;

function inherit(parent, extra) {
  return extend(new (extend(function() {}, { prototype:parent }))(), extra);
}

/**
 * Extends the destination object `dst` by copying all of the properties from the `src` object(s)
 * to `dst` if the `dst` object has no own property of the same name. You can specify multiple
 * `src` objects.
 *
 * @param {Object} dst Destination object.
 * @param {...Object} src Source object(s).
 * @see angular.extend
 */
function merge(dst) {
  forEach(arguments, function(obj) {
    if (obj !== dst) {
      forEach(obj, function(value, key) {
        if (!dst.hasOwnProperty(key)) dst[key] = value;
      });
    }
  });
  return dst;
}


/**
 * Manages loading of templates.
 * @constructor
 * @name ui.$templateFactory
 * @requires $http
 * @requires $templateCache
 * @requires $injector
 */
$TemplateFactory.inject = [ '$http', '$templateCache', '$injector' ];
function $TemplateFactory(   $http,   $templateCache,   $injector) {

  /**
   * Creates a template from a configuration object. 
   * @function
   * @name ui.$templateFactory#fromConfig
   * @methodOf ui.$templateFactory
   * @param {Object} config  Configuration object for which to load a template. The following
   *    properties are search in the specified order, and the first one that is defined is
   *    used to create the template:
   * @param {String|Function} config.template  html string template or function to load via
   *    {@link ui.$templateFactory#fromString fromString}.
   * @param {String|Function} config.templateUrl  url to load or a function returning the url
   *    to load via {@link ui.$templateFactory#fromUrl fromUrl}.
   * @param {Function} config.templateProvider  function to invoke via
   *    {@link ui.$templateFactory#fromProvider fromProvider}.
   * @param {Object} params  Parameters to pass to the template function.
   * @param {Object} [locals] Locals to pass to `invoke` if the template is loaded via a
   *      `templateProvider`. Defaults to `{ params: params }`.
   * @return {String|promise(String)}  The template html as a string, or a promise for that string,
   *      or `null` if no template is configured.
   */
  this.fromConfig = function (config, params, locals) {
    return (
      isDefined(config.template) ? this.fromString(config.template, params) :
      isDefined(config.templateUrl) ? this.fromUrl(config.templateUrl, params) :
      isDefined(config.templateProvider) ? this.fromProvider(config.templateProvider, params, locals) :
      null
    );
  };

  /**
   * Creates a template from a string or a function returning a string.
   * @function
   * @name ui.$templateFactory#fromString
   * @methodOf ui.$templateFactory
   * @param {String|Function} template  html template as a string or function that returns an html
   *      template as a string.
   * @param {Object} params  Parameters to pass to the template function.
   * @return {String|promise(String)}  The template html as a string, or a promise for that string.
   */
  this.fromString = function (template, params) {
    return isFunction(template) ? template(params) : template;
  };

  /**
   * Loads a template from the a URL via `$http` and `$templateCache`.
   * @function
   * @name ui.$templateFactory#fromUrl
   * @methodOf ui.$templateFactory
   * @param {String|Function} url  url of the template to load, or a function that returns a url.
   * @param {Object} params  Parameters to pass to the url function.
   * @return {String|promise(String)}  The template html as a string, or a promise for that string.
   */
  this.fromUrl = function (url, params) {
    if (isFunction(url)) url = url(params);
    if (url == null) return null;
    else return $http
        .get(url, { cache: $templateCache })
        .then(function(response) { return response.data; });
  };

  /**
   * Creates a template by invoking an injectable provider function.
   * @function
   * @name ui.$templateFactory#fromUrl
   * @methodOf ui.$templateFactory
   * @param {Function} provider Function to invoke via `$injector.invoke`
   * @param {Object} params Parameters for the template.
   * @param {Object} [locals] Locals to pass to `invoke`. Defaults to `{ params: params }`.
   * @return {String|promise(String)} The template html as a string, or a promise for that string.
   */
  this.fromProvider = function (provider, params, locals) {
    return $injector.invoke(provider, null, locals || { params: params });
  };
}


angular.module('ngStates',  [ 'ng' ])
  .service('$templateFactory', $TemplateFactory)

  // Make the factory available as a provider so that providers can use it during configuration
  // TODO: There should be a better way to do this
  .provider('$urlMatcherFactory',
    function () {
      var $urlMatcherFactory = this;

      function quoteRegExp(string) {
        return string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
      }

      function UrlMatcher(pattern) {
        // Find all placeholders and create a compiled pattern
        var placeholder = /:(\w+)|\{(\w+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})*))?\}/g,
            names = {}, compiled = '^', last = 0, m,
            segments = this.segments = [], 
            params = this.params = [];

        function addParameter(id) {
          if (!/^\w+$/.test(id)) throw new Error("Invalid parameter name '" + id + "' in pattern '" + pattern + "'");
          if (names[id]) throw new Error("Duplicate parameter name '" + id + "' in pattern '" + pattern + "'");
          names[id] = true;
          params.push(id);
        }

        this.source = pattern;

        // Split into static segments separated by path parameter placeholders.
        // The number of segments is always 1 more than the number of parameters.
        var id, regexp, segment;
        while ((m = placeholder.exec(pattern)) != null) {
          id = (m[1] != null) ? m[1] : m[2];
          regexp = (m[3] != null) ? m[3] : '[^//]*';
          segment = pattern.substring(last, m.index);
          if (segment.indexOf('?') >= 0) break; // we're into the search part
          compiled += quoteRegExp(segment) + '(' + regexp + ')';
          addParameter(id);
          segments.push(segment);
          last = placeholder.lastIndex;
        }
        segment = pattern.substring(last);

        // Find any search parameter names and remove them from the last segment
        var i = segment.indexOf('?');
        if (i >= 0) {
          this.sourcePath = pattern.substring(0, last + i - 1);
          var search = this.sourceSearch = segment.substring(i);
          segment = segment.substring(0, i);
          // Allow parameters to be separated by '?' as well as '&' to make concat() easier
          forEach(search.substring(1).split(/[&?]/), addParameter);
        } else {
          this.sourcePath = pattern;
          this.sourceSearch = '';
        }

        compiled += quoteRegExp(segment) + '$';
        segments.push(segment);
        this.regexp = new RegExp(compiled);
      }

      UrlMatcher.prototype.concat = function (pattern) {
        // Because order of search parameters is irrelevant, we can add our own search
        // parameters to the end of the new pattern. Parse the new pattern by itself
        // and then join the bits together, but it's much easier to do this on a string level.
        return $urlMatcherFactory.compile(this.sourcePath + pattern + this.sourceSearch);
      };

      UrlMatcher.prototype.toString = function () {
        return this.source;
      };

      UrlMatcher.prototype.exec = function (path, searchParams) {
        var m = this.regexp.exec(path);
        if (m == null) return null;

        var params = this.params, nTotal = params.length,
          nPath = this.segments.length-1,
          values = {}, i;

        for (i=0; i<nPath; i++) values[params[i]] = decodeURIComponent(m[i+1]);
        for (/**/; i<nTotal; i++) values[params[i]] = searchParams[params[i]];

        return values;
      };

      UrlMatcher.prototype.format = function (values) {
        var segments = this.segments, params = this.params;
        if (!values) return segments.join('');

        var nPath = segments.length-1, nTotal = params.length,
          result = segments[0], i, search;

        for (i=0; i<nPath; i++) {
          var value = values[params[i]];
          if (value != null) result += value;
          result += segments[i+1];
        }
        for (/**/; i<nTotal; i++) {
          var value = values[params[i]];
          if (value != null) {
            result += (search ? '&' : '?') + params[i] + '=' + encodeURIComponent(value);
            search = true;
          }
        }

        return result;
      };


      this.compile = function (pattern) {
        return new UrlMatcher(pattern);
      };

      this.isMatcher = function (o) {
        return o instanceof UrlMatcher;
      };

      this.$get = function () {
        return $urlMatcherFactory;
      };
    })

  .provider('$urlRouter',
    [        '$urlMatcherFactoryProvider',
    function ($urlMatcherFactory) {
      var rules = [], otherwise = null;

      // Returns a string that is a prefix of all strings matching the RegExp
      function regExpPrefix(re) {
        var prefix = /^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(re.source);
        return (prefix != null) ? prefix[1].replace(/\\(.)/g, "$1") : '';
      }

      // Interpolates matched values into a String.replace()-style pattern
      function interpolate(pattern, match) {
        return pattern.replace(/\$(\$|\d{1,2})/, function (m, what) {
          return match[what == '$' ? 0 : Number(what)];
        });
      }

      this.rule =
        function (rule) {
          if (!isFunction(rule)) throw new Error("'rule' must be a function");
          rules.push(rule);
          return this;
        };

      this.otherwise =
        function (rule) {
          if (isString(rule)) {
            var redirect = rule;
            rule = function () { return redirect; };
          }
          else if (!isFunction(rule)) throw new Error("'rule' must be a function");
          otherwise = rule;
          return this;
        };


      function handleIfMatch($location, handler, match) {
        if (match == null) return false;
        var result = handler(match, $location);
        return isDefined(result) ? result : true;
      }

      this.when =
        function (what, handler) {
          var rule, redirect;
          if (isString(what)) what = $urlMatcherFactory.compile(what);
          if ($urlMatcherFactory.isMatcher(what)) {
            if (isString(handler)) {
              redirect = $urlMatcherFactory.compile(handler);
              handler = function (match) { return redirect.format(match); };
            }
            else if (!isFunction(handler)) throw new Error("invalid 'handler' in when()");
            rule = function ($location) {
              return handleIfMatch($location, handler, what.exec($location.path(), $location.search()));
            };
            rule.prefix = isString(what.prefix) ? what.prefix : '';
          }
          else if (what instanceof RegExp) {
            if (isString(handler)) {
              redirect = handler;
              handler = function (match) { return interpolate(redirect, match); };
            }
            else if (!isFunction(handler)) throw new Error("invalid 'handler' in when()");
            if (what.global || what.sticky) throw new Error("when() RegExp must not be global or sticky");
            rule = function ($location) {
              return handleIfMatch($location, handler, what.exec($location.path()));
            };
            rule.prefix = regExpPrefix(what);
          }
          else throw new Error("invalid 'what' in when()");
          return this.rule(rule);
        };

      this.$get =
        [        '$location', '$rootScope',
        function ($location,   $rootScope) {
          if (otherwise) rules.push(otherwise);

          // TODO: Optimize groups of rules with non-empty prefix into some sort of decision tree
          function update() {
            var n=rules.length, i, handled;
            for (i=0; i<n; i++) {
              handled = rules[i]($location);
              if (handled) {
                if (isString(handled)) $location.replace().url(handled);
                break;
              }
            }
          }

          $rootScope.$on('$locationChangeSuccess', update);
          return {};
        }];
    }])

  .value('$stateParams', {})

  .provider('$state',
    [        '$urlRouterProvider', '$urlMatcherFactoryProvider',
    function ($urlRouterProvider,   $urlMatcherFactory) {

      var root, states = {}, $state;

      function findState(stateOrName) {
        var state;
        if (isString(stateOrName)) {
          state = states[stateOrName];
          if (!state) throw new Error("No such state '" + stateOrName + "'");
        } else {
          state = states[stateOrName.name];
          if (!state || state !== stateOrName && state.self !== stateOrName) throw new Error("Invalid or unregistered state");
        }
        return state;
      }

      function registerState(state) {
        // Wrap a new object around the state so we can store our private details easily.
        state = inherit(state, {
          self: state,
          toString: function () { return this.name; },
        });

        var name = state.name;
        if (!isString(name)) throw new Error("State must have a name");
        if (states[name]) throw new Error("State '" + name + "'' is already defined");

        // Derive parent state from a hierarchical name only if 'parent' is not explicitly defined.
        var parent = root;
        if (!isDefined(state.parent)) {
          var compositeName = /^(.+)\.[^.]+$/.exec(name);
          if (compositeName != null) {
            parent = findState(compositeName[1]);
          }
        } else if (state.parent != null) {
          parent = findState(state.parent);
        }
        state.parent = parent;

        // Build a URLMatcher if necessary, either via a relative or absolute URL
        if (!state.urlMatcher && state.url != null) { // empty url is valid!
          if (state.url.charAt(0) == '^') {
            state.urlMatcher = $urlMatcherFactory.compile(state.url.substring(1));
          } else {
            var relativeTo = parent; while (!relativeTo.urlMatcher) relativeTo = relativeTo.parent;
            state.urlMatcher = relativeTo.urlMatcher.concat(state.url);
          }
        }

        // Figure out the parameters for this state and ensure they're a super-set of parent's parameters
        var params = state.params = state.urlMatcher ? state.urlMatcher.params : state.parent.params;
        var paramNames = {}; forEach(params, function (p) { paramNames[p] = true; });
        if (parent) {
          forEach(parent.params, function (p) {
            if (!paramNames[p]) throw new Error("State '" + name + "' does not define parameter '" + p + "'");
            paramNames[p] = false;
          });
          var ownParams = state.ownParams = [];
          forEach(paramNames, function (own, p) { if (own) ownParams.push(p); });
        } else {
          state.ownParams = params;
        }

        // If there is no explicit multi-view configuration, make one up so we don't have
        // to handle both cases in the view directive later. Note that having an explicit
        // 'views' property will mean the default unnamed view properties are ignored. This
        // is also a good time to resolve view names to absolute names, so everything is a
        // straight lookup at link time.
        var views = {};
        forEach(!isDefined(state.views) ? { '': state } : state.views, function (view, name) {
          if (name.indexOf('@') < 0) name = name + '@' + state.parent.name;
          views[name] = view;
        });
        state.views = views;

        // Also keep a full path from the root down to this state as this is needed for state activation,
        // as well as a set of all state names for fast lookup via $state.contains()
        state.path = parent ? parent.path.concat(state) : []; // exclude root from path
        var includes = state.includes = parent ? extend({}, parent.includes) : {}; includes[name] = true;
        if (!state.resolve) state.resolve = {};

        // Register the state in the global state list and with $urlRouter if necessary.
        if (!state.abstract && state.urlMatcher) {
          $urlRouterProvider.when(state.urlMatcher, function (params) {
            $state.transitionTo(state, params);
          });
        }
        return states[name] = state;
      }

      // Implicit root state that is always active
      root = registerState({
        name: '',
        url: '^',
        views: null,
        abstract: true,
      });
      root.locals = {};

      // .state(state)
      // .state(name, state)
      this.state = function (name, state) {
        if (isObject(name)) state = name;
        else state.name = name;
        registerState(state);
        return this;
      };

      this.when = function (path, route) {
        if (route.redirectTo != null) {
          // Redirect, configure directly on $urlRouterProvider
          var redirect = route.redirectTo, handler;
          if (isString(redirect)) {
            handler = redirect;
          } else if (isFunction(redirect)) {
            handler = function (params, $location) {
              return redirect(params, $location.path(), $location.search());
            };
          } else {
            throw new Error("Invalid 'redirectTo' in when()");
          }
          $urlRouterProvider.when(path, handler);
          return this;
        } else {
          // Regular route, configure as state
          route.parent = null;
          route.url = '^' + path;
          if (!route.name) route.name = 'route:' + path;
          return this.state(route);
        }
      };

      this.$get =
        [        '$stateParams', '$rootScope', '$q', '$templateFactory', '$injector',
        function ($stateParams,   $rootScope,   $q,   $templateFactory,   $injector) {

          $state = {
            params: {},
            current: root.self,
            $current: root,
            $transition: $q.when(root.self),

            transitionTo: transitionTo,

            is: function (stateOrName) {
              return $state.$current === findState(stateOrName);
            },
            includes: function (stateOrName) {
              return $state.$current.includes[findState(stateOrName).name];
            },
          };

          function transitionTo(to, toParams) {
            to = findState(to); if (to.abstract) throw new Error("Cannot transition to abstract state '" + to + "'");
            var toPath = to.path, from = findState($state.current), fromParams = $state.params, fromPath = from.path;

            $rootScope.$broadcast('$stateChangeStart', to.self, from.self);

            // Starting from the root of the path, keep all levels that haven't changed
            var keep, state, locals = root.locals, toLocals = [];
            for (keep = 0, state = toPath[keep];
                 state && state === fromPath[keep] && equalForKeys(toParams, fromParams, state.ownParams);
                 keep++, state = toPath[keep]) {
              locals = toLocals[keep] = state.locals;
            }

            // Resolve locals for the remaining states, but don't update any global state just
            // yet -- if anything fails to resolve the current state needs to remain untouched.
            // We also set up an inheritance chain for the locals here. This allows the view directive
            // to quickly look up the correct definition for each view in the current state. Even
            // though we create the locals object itself outside resolveState(), it is initially
            // empty and gets filled asynchronously. We need to keep track of the promise for the
            // (fully resolved) current locals, and pass this down the chain.
            var resolved = $q.when(locals);
            for (var l=keep; l<toPath.length; l++, state=toPath[l]) {
              locals = toLocals[l] = (locals ? inherit(locals) : {});
              resolved = resolveState(state, toParams, resolved, locals);
            }

            // Once everything is resolved, we are ready to perform the actual transition
            // and return a promise for the new state. We also keep track of what the
            // current promise is, so that we can detect overlapping transitions and
            // keep only the outcome of the last transition.
            var transition = $state.transition = resolved.then(function () {
              var l, entering, exiting;

              if ($state.transition !== transition) return; // superseded by a new transition

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

              // Update global $state
              $state.$current = to;
              $state.current = to.self;
              $state.params = toParams;
              copy(toParams, $stateParams);
              $rootScope.$broadcast('$stateChangeSuccess', to.self, from.self);

              return $state.current;
            }, function (error) {
              if ($state.transition !== transition) return; // superseded by a new transition
              $rootScope.$broadcast('$stateChangeError', to.self, from.self, error);
              return $q.reject(error);
            });

            return transition;
          }

          function resolveState(state, params, inherited, dst) {
            // We need to track all the promises generated during the resolution process.
            // The first of these is for the fully resolved parent locals.
            var promises = [ inherited ];

            // Make a restricted $stateParams with only the parameters that apply to this state
            // In addition to being available to the controller and onEnter/onExit callbacks,
            // we also need $stateParams to be available for any $injector calls we make
            // during the dependency resolution process.
            var $stateParams = {};
            var locals = { $stateParams: $stateParams };
            forEach(state.params, function (name) {
              $stateParams[name] = params[name];
            });

            function resolve(deps, dst) {
              forEach(deps, function (value, key) {
                promises.push($q
                  .when(isString(value) ? $injector.get(value) : $injector.invoke(value, locals))
                  .then(function (result) {
                    dst[key] = result;
                  }));
              });
            }

            // Resolve 'global' dependencies for the state, i.e. those not specific to a view.
            resolve(state.resolve, dst.globals = { $stateParams: $stateParams });

            // Resolve template and dependencies for all views. Each view receives
            // its own dependencies, which are set up to inherit from the state's deps,
            // and are accessible from the state locals as '$$view$<name>'.
            forEach(state.views, function (view, name) {
              // References to the controller (only instantiated at link time)
              // and the state itself to simplify lookup in the view directive.
              var $view = dst[name] = {
                $$controller: view.controller,
                $$state: state,
              };

              // Template
              promises.push($q
                .when($templateFactory.fromConfig(view, $stateParams, locals) || '')
                .then(function (result) {
                  $view.$template = result;
                }));

              // View-local dependencies
              resolve(view.resolve, $view);
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

          function equalForKeys(a, b, keys) {
            for (var i=0; i<keys.length; i++) {
              var k = keys[i];
              if (a[k] !== b[k]) return false;
            }
            return true;
          }

          return $state;
        }];
    }])

  .directive('ngStateView',
    [        '$state', '$anchorScroll', '$compile', '$controller',
    function ($state,   $anchorScroll,   $compile,   $controller) {
      return {
        restrict: 'ECA',
        terminal: true,
        link: function(scope, element, attr) {
          var viewScope, viewLocals,
            name = attr.ngStateView || attr.name || '',
            onloadExp = attr.onload || '';
          
          // Find the details of the parent view directive (if any) and use it
          // to derive our own qualified view name, then hang our own details
          // off the DOM so child directives can find it.
          var parent = element.parent().inheritedData('$ngStateView');
          name  = name + '@' + (parent ? parent.state.name : '');
          var view = { name: name, state: null };
          element.data('$ngStateView', view);

          scope.$on('$stateChangeSuccess', updateView);
          updateView();

          function updateView() {
            var locals = $state.$current && $state.$current.locals[name];
            if (locals === viewLocals) return; // nothing to do

            // Destroy previous view scope (if any)
            if (viewScope) {
              viewScope.$destroy();
              viewScope = null;
            }

            if (locals) {
              viewLocals = locals;
              view.state = locals.$$state;

              element.html(locals.$template);
              // element.html('<div style="height:0;position:relative;z-index:999"><span style="background:red;color:white;font-size:12px;padding:1px">' + name + '</span></div>' + locals.$template);
              var link = $compile(element.contents());
              viewScope = scope.$new();
              if (locals.$$controller) {
                locals.$scope = viewScope;
                var controller = $controller(locals.$$controller, locals);
                element.contents().data('$ngControllerController', controller);
              }
              link(viewScope);
              viewScope.$emit('$viewContentLoaded');
              viewScope.$eval(onloadExp);

              // TODO: This seems strange, shouldn't $anchorScroll listen for $viewContentLoaded if necessary?
              // $anchorScroll might listen on event...
              $anchorScroll();
            } else {
              viewLocals = null;
              view.state = null;
              element.html('');
            }
          }
        },
      };
    }]);
