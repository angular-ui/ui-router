
$UrlRouterProvider.$inject = ['$urlMatcherFactoryProvider'];
function $UrlRouterProvider(  $urlMatcherFactory) {
  var rules = [], 
      otherwise = null;

  // Returns a string that is a prefix of all strings matching the RegExp
  function regExpPrefix(re) {
    var prefix = /^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(re.source);
    return (prefix != null) ? prefix[1].replace(/\\(.)/g, "$1") : '';
  }

  // Interpolates matched values into a String.replace()-style pattern
  function interpolate(pattern, match) {
    return pattern.replace(/\$(\$|\d{1,2})/, function (m, what) {
      return match[what === '$' ? 0 : Number(what)];
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


  function handleIfMatch($injector, handler, match) {
    if (!match) return false;
    var result = $injector.invoke(handler, handler, { $match: match });
    return isDefined(result) ? result : true;
  }

  this.when =
    function (what, handler) {
      var rule, redirect;
      if (isString(what))
          what = $urlMatcherFactory.compile(what);

      if ($urlMatcherFactory.isMatcher(what)) {
        if (isString(handler)) {
          redirect = $urlMatcherFactory.compile(handler);
          handler = ['$match', function ($match) { return redirect.format($match); }];
        }
        else if (!isFunction(handler) && !isArray(handler))
            throw new Error("invalid 'handler' in when()");

        rule = function ($injector, $location) {
          return handleIfMatch($injector, handler, what.exec($location.path(), $location.search()));
        };
        rule.prefix = isString(what.prefix) ? what.prefix : '';
      }
      else if (what instanceof RegExp) {
        if (isString(handler)) {
          redirect = handler;
          handler = ['$match', function ($match) { return interpolate(redirect, $match); }];
        }
        else if (!isFunction(handler) && !isArray(handler))
            throw new Error("invalid 'handler' in when()");

        if (what.global || what.sticky)
            throw new Error("when() RegExp must not be global or sticky");

        rule = function ($injector, $location) {
          return handleIfMatch($injector, handler, what.exec($location.path()));
        };
        rule.prefix = regExpPrefix(what);
      }
      else
          throw new Error("invalid 'what' in when()");

      return this.rule(rule);
    };

  this.$get =
    [        '$location', '$rootScope', '$injector',
    function ($location,   $rootScope,   $injector) {
      if (otherwise) rules.push(otherwise);

      // TODO: Optimize groups of rules with non-empty prefix into some sort of decision tree
      function update() {
        var n=rules.length, i, handled;
        for (i=0; i<n; i++) {
          handled = rules[i]($injector, $location);
          if (handled) {
            if (isString(handled)) $location.replace().url(handled);
            break;
          }
        }
      }

      $rootScope.$on('$locationChangeSuccess', update);
      return {};
    }];
}

angular.module('ui.router').provider('$urlRouter', $UrlRouterProvider);
