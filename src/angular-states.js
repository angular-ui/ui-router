(function () {
  var angular = window.angular,
    isDefined = angular.isDefined,
    isFunction = angular.isFunction,
    isString = angular.isString,
    forEach = angular.forEach,
    extend = angular.extend,
    copy = angular.copy;

  function inherit(parent, extra) {
    return extend(new (extend(function() {}, { prototype:parent }))(), extra);
  }

  angular.module('ngStates',  [ 'ng' ])

    .service('$templateFactory',
      [        '$http', '$templateCache', '$injector',
      function ($http,   $templateCache,   $injector) {
        this.fromString = function (template, params) {
          return isFunction(template) ? template(params) : template;
        };
        this.fromUrl = function (url, params) {
          if (isFunction(url)) url = url(params);
          if (url == null) return null;
          else return $http
              .get(url, { cache: $templateCache })
              .then(function(response) { return response.data; });
        };
        this.fromProvider = function (provider, params) {
          return $injector.invoke(provider, null, { params: params });
        };
        this.fromConfig = function (config, params) {
          return (
            isDefined(config.template) ? this.fromString(config.template, params) :
            isDefined(config.templateUrl) ? this.fromUrl(config.templateUrl, params) :
            isDefined(config.templateProvider) ? this.fromProvider(config.templateProvider, params) :
            null
          );
        };
      }])

    .service('$urlMatcherFactory',
      function () {
        function quoteRegExp(string) {
          return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        }

        function UrlMatcher(pattern) {
          // Find all placeholders and create a compiled pattern
          var placeholder = /:(\w+)|\{(\w+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})*))?\}/g,
              segments = [], names = {}, params = [], compiled = '^', last = 0, m;
          while ((m = placeholder.exec(pattern)) !== null) {
            var id = (m[1] != null) ? m[1] : m[2];
            var regexp = (m[3] != null) ? m[3] : '[^//]*';
            var segment = pattern.substring(last, m.index);
            compiled += quoteRegExp(segment) + '(' + regexp + ')';
            if (names[id]) throw new Error('Duplicate parameter name "' + id + '" in pattern "' + pattern + '"');
            names[id] = true;
            params.push(id);
            segments.push(segment);
            last = placeholder.lastIndex;
          }
          var segment = pattern.substring(last);
          compiled += quoteRegExp(segment) + '$';
          segments.push(segment);
          this.regexp = new RegExp(compiled);
          this.params = params;
          this.segments = segments;
          this.source = pattern;
        }
        UrlMatcher.prototype.toString = function () {
          return this.source;
        };
        UrlMatcher.prototype.exec = function (string) {
          var m = this.regexp.exec(string), params = this.params;
          if (m === null) return null;
          var values = {};
          for (var i=0; i<params.length; i++) {
            values[params[i]] = m[i+1];
          }
          return values;
        };
        UrlMatcher.prototype.format = function (values) {
          var segments = this.segments, params = this.params;
          if (!values) return segments.join('');
          var result = segments[0];
          for (var i=0; i<params.length; i++) {
            var value = values[params[i]];
            if (value != null) result += value;
            result += segments[i+1];
          }
          return result;
        };

        this.compile = function (pattern) {
          return new UrlMatcher(pattern);
        };
      })

    .value('$stateParams', {})

    .provider('$state',
      function () {
        function State(name, opts, parent) {
          var m = /^(?:((?:\w+\.)*\w+)\.)?\w+$/.exec(name), parentName = m[1], parent;
          if (m === null) throw new Error('Invalid state identifier "' + name + '"');
          if (parentName && !(parent = State.all[parentName])) throw new Error('Parent state "' + parentName + '" is not defined');

          extend(this, opts);
          this.name = name;
          this.parent = parent;
          this.chain = parent ? parent.chain.concat(this) : [ this ];
          this.url = this.url || '';

          State.all[name] = this;
        }
        State.all = {};

        State.prototype.fullUrl = function () {
          return (this.parent ? this.parent.fullUrl() : '') + this.url;
        };
        State.prototype.includes = function (name) {
          return name === '' || this.name === name || this.name.substring(0, name.length+1) === name+'.';
        };
        State.prototype.is = function (name) {
          return this.name == name;
        };
        State.prototype.toString = function () {
          return this.name;
        };
        State.compileAll = function($urlMatcherFactory) {
          var rules = State.rules = [];
          // Compile all rules and collect concrete rules
          forEach(State.all, function (state) {
            var rule = state.rule = $urlMatcherFactory.compile(state.fullUrl()); rule.state = state;
            if (!state.abstract) rules.push(rule);
            state.rule = rule;
          });
          // Post-process each state separately due to undefined iteration order
          forEach(State.all, function (state) {
            state.ownParamNames = state.parent ? state.rule.params.slice(state.parent.rule.params.length) : state.rule.params;
          });
        }
        State.parameterize = function ($location) {
          var rules = State.rules, path = $location.path();
          for (var i=0; i<rules.length; i++) {
            var rule = rules[i], params = rule.exec(path);
            if (params) return inherit(rule.state, {
              state: rule.state,
              params: extend({}, $location.search(), params),
              pathParams: params,
              locals: null,
              chain: null,
            });
          }
          return null;
        };

        this.state = function state(name, opts) {
          new State(name, opts);
          return this;
        };

        this.$get =
          [        '$stateParams', '$rootScope', '$location', '$urlMatcherFactory', '$q', '$templateFactory', '$injector',
          function ($stateParams,   $rootScope,   $location,   $urlMatcherFactory,   $q,   $templateFactory,   $injector) {
            State.compileAll($urlMatcherFactory);

            function resolve(state, locals, params) {
              var keys = [], values = [];

              forEach(state.resolve || {}, function (value, key) {
                keys.push(key);
                values.push(isString(value) ? $injector.get(value) : $injector.invoke(value));
              });

              var template = $templateFactory.fromConfig(state, params);
              if (template != null) {
                keys.push('$template');
                values.push(template);
              }

              return $q.all(values).then(function(values) {
                forEach(values, function(value, index) {
                  locals[keys[index]] = value;
                });
                return locals;
              });
            }

            function equalForKeys(a, b, keys) {
              for (var i=0; i<keys.length; i++) {
                var k = keys[i];
                if (a[k] !== b[k]) return false;
              }
              return true;
            }

            function activate(next, last) {
              var nextStateChain = next.state.chain,
                  level = 0, state = nextStateChain[level],
                  chain = [], locals

              // Keep existing resolved locals for unchanged parent states
              if (last && last.chain) {
                var lastChain = last.chain, lastStateChain = last.state.chain;
                for (;
                     state && state === lastStateChain[level] &&
                     equalForKeys(next.pathParams, last.pathParams, state.ownParamNames);
                     level++, state=nextStateChain[level]) {
                  chain.push(locals = lastChain[level]);
                }
              }
              // Resolve remaining states
              var resolving = [];
              for (;
                   state;
                   level++, state=nextStateChain[level]) {
                chain.push(locals = locals ? inherit(locals, {}): {});
                resolving.push(resolve(state, locals, next.params));
              }

              return $q.all(resolving).then(function () {
                next.chain = chain;
                next.locals = locals;
                return next;
              });
            };

            var $state = {
              current: null,
              // Convenience shortcuts
              is: function (name) { return $state.current && $state.current.is(name) },
              includes: function (name) { return $state.current && $state.current.includes(name) },
            };

            function update() {
              var last = $state.current, next = State.parameterize($location);
              $rootScope.$broadcast('$stateChangeStart', next, last);
              $state.current = next;

              (next ? activate(next, last) : $q.when(null))
                .then(function () {
                  if ($state.current === next) {
                    copy(next ? next.params : {}, $stateParams);
                    $rootScope.$broadcast('$stateChangeSuccess', next, last);
                  }
                }, function (error) {
                  if ($state.current === next) {
                    $rootScope.$broadcast('$stateChangeError', next, last, error);
                  }
                });
            }

            $rootScope.$on('$locationChangeSuccess', update);
            return $state;
          }];
      })

    .directive('ngStateView',
      [        '$state', '$anchorScroll', '$compile', '$controller',
      function ($state,   $anchorScroll,   $compile,   $controller) {
        return {
          restrict: 'ECA',
          terminal: true,
          link: function(scope, element, attr) {
            var lastScope, lastLocals,
              level = attr.level || 0, // TODO: Find a better mechanism for this, either implicit or a name, not a numeric level
              onloadExp = attr.onload || '';
              
            scope.$on('$stateChangeSuccess', update);
            update();

            function destroyLastScope() {
              if (lastScope) {
                lastScope.$destroy();
                lastScope = null;
              }
            }

            function clearContent() {
              element.html('');
              destroyLastScope();
            }

            function update() {
              var current = $state.current;
              if (current) {
                var state = current.state.chain[level],
                    locals = current.chain[level];
                if (state) {
                  if (locals === lastLocals) return; // nothing to do
                  lastLocals = locals;
                  var template = locals.$template;
                  if (template) {
                    element.html(template);
                    destroyLastScope();

                    var link = $compile(element.contents());
                    lastScope = scope.$new();
                    if (state.controller) {
                      locals.$scope = lastScope;
                      var controller = $controller(state.controller, locals);
                      element.contents().data('$ngControllerController', controller);
                    }
                    // TODO: Does it make sense to bind parameters in scope?
                    // forEach(state.ownParamNames, function (name) {
                    //   lastScope[name] = current.params[name];
                    // });

                    link(lastScope);
                    lastScope.$emit('$viewContentLoaded');
                    lastScope.$eval(onloadExp);

                    // TODO: This seems strange, shouldn't $anchorScroll listen for $viewContentLoaded if necessary?
                    // $anchorScroll might listen on event...
                    $anchorScroll();
                    return;
                  }
                }
              }
              clearContent();
            }
          },
        };
      }]);
})();
