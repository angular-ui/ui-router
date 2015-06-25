var Resolvable, Path, PathElement;

/**
 * @ngdoc object
 * @name ui.router.util.$resolve
 *
 * @requires $q
 * @requires $injector
 *
 * @description
 * Manages resolution of (acyclic) graphs of promises.
 */
$Resolve.$inject = ['$q', '$injector'];
function $Resolve(  $q,    $injector) {

  /*
   ------- Resolvable, PathElement, Path ------------------
   I think these should be private API for now because we may need to iterate it for a while.
   /*

   /*  Resolvable

   The basic building block for the new resolve system.
   Resolvables encapsulate a state's resolve's resolveFn, the resolveFn's declared dependencies, and the wrapped (.promise)
   and unwrapped-when-complete (.data) result of the resolveFn.

   Resolvable.get() either retrieves the Resolvable's existing promise, or else invokes resolve() (which invokes the
   resolveFn) and returns the resulting promise.

   Resolvable.get() and Resolvable.resolve() both execute within a context Path, which is passed as the first
   parameter to those fns.
   */


  Resolvable = function Resolvable(name, resolveFn, state) {
    var self = this;

    // Resolvable: resolveResolvable()

    // synchronous part:
    // - sets up the Resolvable's promise
    // - retrieves dependencies' promises
    // - returns promise for async part

    // asynchronous part:
    // - wait for dependencies promises to resolve
    // - invoke the resolveFn
    // - wait for resolveFn promise to resolve
    // - store unwrapped data
    // - resolve the Resolvable's promise
    function resolveResolvable(pathContext, options) {
      options = options || {};
      if (options.trace) trace.traceResolveResolvable(self, options);
      // First, set up an overall deferred/promise for this Resolvable
      var deferred = $q.defer();
      self.promise = deferred.promise;

      // Load a map of all resolvables for this state from the context path
      // Omit the current Resolvable from the result, so we don't try to inject self into self
      var ancestorsByName = pathContext.getResolvables({  omitOwnLocals: [ self.name ] });

      // Limit the ancestors Resolvables map to only those that the current Resolvable fn's annotations depends on
      var depResolvables = pick(ancestorsByName, self.deps);

      // Get promises (or synchronously invoke resolveFn) for deps
      var depPromises = map(depResolvables, function(resolvable) {
        return resolvable.get(pathContext);
      });

      // Return a promise chain that waits for all the deps to resolve, then invokes the resolveFn passing in the
      // dependencies as locals, then unwraps the resulting promise's data.
      return $q.all(depPromises).then(function invokeResolve(locals) {
        try {
          var result = $injector.invoke(self.resolveFn, state, locals);
          deferred.resolve(result);
        } catch (error) {
          deferred.reject(error);
        }
        return self.promise;
      }).then(function(data) {
        self.data = data;
        return self.promise;
      });
    }

    function resolvableToString() {
      return tpl("Resolvable(name: {name}, state: {state.name}, requires: [{deps}])", self);
    }

    // Public API
    extend(this, {
      name: name,
      resolveFn: resolveFn,
      state: state,
      deps: $injector.annotate(resolveFn),
      resolve: resolveResolvable, // aliased function name for stacktraces
      resolveResolvable: resolveResolvable, // aliased function name for stacktraces
      promise: undefined,
      data: undefined,
      get: function(pathContext, options) {
        return self.promise || resolveResolvable(pathContext, options);
      },
      toString: resolvableToString
    });
  };

  // Eager resolves are resolved before the transition starts.
  // Lazy resolves are resolved before their state is entered.
  // JIT resolves are resolved just-in-time, right before an injected function that depends on them is invoked.
  var resolvePolicies = { eager: 3, lazy: 2, jit: 1 };
  var defaultResolvePolicy = "jit"; // TODO: make this configurable

  // An element in the path which represents a state and that state's Resolvables and their resolve statuses.
  // When the resolved data is ready, it is stored in each Resolvable object within the PathElement

  // Should be passed a state object.  I think maybe state could even be the public state, so users can add resolves
  // on the fly.
  PathElement = function PathElement(state) {
    var self = this;
    // Convert state's resolvable assoc-array into an assoc-array of empty Resolvable(s)
    var resolvables = map(state.resolve || {}, function(resolveFn, resolveName) {
      return new Resolvable(resolveName, resolveFn, state);
    });

    function getResolvables() {
      return resolvables;
    }

    function addResolvables(resolvablesByName) {
      return extend(resolvables, resolvablesByName);
    }

    // returns a promise for all resolvables on this PathElement
    // options.policy: only return promises for those Resolvables which are at the specified policy strictness, or above.
    function resolvePathElement(pathContext, options) {
      options = options || {};
      var policyOrdinal = resolvePolicies[options && options.policy || defaultResolvePolicy];

      var policyConf = {
        $$state: angular.isString(self.state.resolvePolicy) ? self.state.resolvePolicy : defaultResolvePolicy,
        $$resolves: angular.isObject(self.state.resolvePolicy) ? self.state.resolvePolicy : defaultResolvePolicy
      };

      // Isolate only this element's resolvables
      var resolvables = new Path([self]).getResolvables();
      forEach(resolvables, function(resolvable) {
        var policyString = policyConf.$$resolves[resolvable.name] || policyConf.$$state;
        policyConf[resolvable.name] = resolvePolicies[policyString];
      });

      if (options.trace) trace.traceResolvePathElement(self, filter(resolvables, matchesPolicy), options);

      function matchesPolicy(resolvable) { return policyConf[resolvable.name] >= policyOrdinal; }
      function getResolvePromise(resolvable) { return resolvable.get(pathContext, options); }
      var resolvablePromises = map(filter(resolvables, matchesPolicy), getResolvePromise);
      return $q.all(resolvablePromises).then(angular.noop);
    }

    // Injects a function at this PathElement level with available Resolvables
    // First it resolves all resolvables.  When they are done resolving, invokes the function.
    // Returns a promise for the return value of the function.
    // public function
    // fn is the function to inject (onEnter, onExit, controller)
    // locals are the regular-style locals to inject
    // pathContext is a Path which is used to retrieve dependent Resolvables for injecting
    function invokeLater(fn, locals, pathContext, options) {
      options = options || {};
      var deps = $injector.annotate(fn);
      var resolvables = pick(pathContext.pathFromRoot(self).getResolvables(), deps);
      if (options.trace) trace.tracePathElementInvoke(self, fn, deps, extend({ when: "Later"}, options));

      var promises = map(resolvables, function(resolvable) { return resolvable.get(pathContext); });
      return $q.all(promises).then(function() {
        try {
          return self.invokeNow(fn, locals, pathContext, options);
        } catch (error) {
          return $q.reject(error);
        }
      });
    }

    // private function? Maybe needs to be public-to-$transition to allow onEnter/onExit to be invoked synchronously
    // and in the correct order, but only after we've manually ensured all the deps are resolved.

    // Injects a function at this PathElement level with available Resolvables
    // Does not wait until all Resolvables have been resolved; you must call PathElement.resolve() (or manually resolve each dep) first
    function invokeNow(fn, locals, pathContext, options) {
      options = options || {};
      var deps = $injector.annotate(fn);
      var resolvables = pick(pathContext.pathFromRoot(self).getResolvables(), deps);
      if (options.trace) trace.tracePathElementInvoke(self, fn, $injector.annotate(fn), extend({ when: "Now  "}, options));

      var moreLocals = map(resolvables, function(resolvable) { return resolvable.data; });
      var combinedLocals = extend({}, locals, moreLocals);
      return $injector.invoke(fn, self.state, combinedLocals);
    }

    function pathElementToString() {
      var tplData = { state: parse("state.name")(self) || "(root)" };
      return tpl("PathElement({state})", tplData);
    }

    // public API so far
    extend(this, {
      state: state,
      getResolvables: getResolvables,
      addResolvables: addResolvables,
      resolvePathElement: resolvePathElement,
      invokeNow: invokeNow, // this might be private later
      invokeLater: invokeLater,
      toString: pathElementToString
    });
  };

  /**
   *  A Path Object holds an ordered list of PathElements.
   *
   *  This object is used to store resolve status for an entire path of states. It has concat and slice
   *  helper methods to return new Paths, based on the current Path.
   *
   *
   *  Path becomes the replacement data structure for $state.$current.locals.
   *  The Path is used in the three resolve() functions (Path.resolvePath, PathElement.resolvePathElement,
   *  and Resolvable.resolveResolvable) and provides context for injectable dependencies (Resolvables)
   *
   *  @param statesOrPathElements [array]: an array of either state(s) or PathElement(s)
   */

  Path = function Path(statesOrPathElements) {
    var self = this;
    if (!isArray(statesOrPathElements)) throw new Error("states must be an array of state(s) or PathElement(s)", statesOrPathElements);
    var isPathElementArray = (statesOrPathElements.length && (statesOrPathElements[0] instanceof PathElement));

    var elements = statesOrPathElements;
    if (!isPathElementArray) { // they passed in states; convert them to PathElements
      elements = map(elements, function (state) { return new PathElement(state); });
    }

    // Returns a promise for an array of resolved Path Element promises
    function resolvePath(options) {
      options = options || {};
      if (options.trace) trace.traceResolvePath(self, options);
      function elementPromises(element) { return element.resolvePathElement(self, options); }
      return $q.all(map(elements, elementPromises)).then(angular.noop);
    }

    /**
     *  Gets the available Resolvables for the last element of this path.
     *
     * @param options
     *
     * options.omitOwnLocals: array of property names
     *   Omits those Resolvables which are found on the last element of the path.
     *
     *   This will hide a deepest-level resolvable (by name), potentially exposing a parent resolvable of
     *   the same name further up the state tree.
     *
     *   This is used by Resolvable.resolve() in order to provide the Resolvable access to all the other
     *   Resolvables at its own PathElement level, yet disallow that Resolvable access to its own injectable Resolvable.
     *
     *   This is also used to allow a state to override a parent state's resolve while also injecting
     *   that parent state's resolve:
     *
     *   state({ name: 'G', resolve: { _G: function() { return "G"; } } });
     *   state({ name: 'G.G2', resolve: { _G: function(_G) { return _G + "G2"; } } });
     *   where injecting _G into a controller will yield "GG2"
     */
    function getResolvables(options) {
      options = defaults(options, { omitOwnLocals: [] });
      var last = self.last();
      return self.elements.reduce(function(memo, elem) {
        var omitProps = (elem === last) ? options.omitOwnLocals : [];
        var elemResolvables = omit.apply(null, [elem.getResolvables()].concat(omitProps));
        return extend(memo, elemResolvables);
      }, {});
    }

    function clone() {
      throw new Error("Clone not yet implemented");
    }

    // returns a subpath of this path from the root path element up to and including the toPathElement parameter
    function pathFromRoot(toPathElement) {
      var elementIdx = elements.indexOf(toPathElement);
      if (elementIdx == -1) throw new Error("This Path does not contain the toPathElement");
      return self.slice(0, elementIdx + 1);
    }

    function concat(path) {
      return new Path(elements.concat(path.elements));
    }

    function slice(start, end) {
      return new Path(elements.slice(start, end));
    }

    function reverse() {
      elements.reverse(); // TODO: return new Path()
      return self;
    }

    function states() {
      return pluck(elements, "state");
    }

    function elementForState(state) {
      return find(self.elements, pipe(prop('state'), eq(state)));
    }

    function last() {
      return self.elements.length ? self.elements[self.elements.length - 1] : null;
    }

    function pathToString() {
      var tplData = { elements: self.elements.map(function(e) { return e.state.name; }).join(", ") };
      return tpl("Path([{elements}])", tplData);
    }

    // Public API
    extend(this, {
      elements: elements,
      getResolvables: getResolvables,
      resolve: resolvePath,
      resolvePath: resolvePath,
      clone: clone,
      pathFromRoot: pathFromRoot,
      concat: concat,
      slice: slice,
      reverse: reverse,
      states: states,
      elementForState: elementForState,
      last: last,
      toString: pathToString
    });
  };

  // ----------------- 0.2.xx Legacy API here ------------------------
  var VISIT_IN_PROGRESS = 1,
      VISIT_DONE = 2,
      NOTHING = {},
      NO_DEPENDENCIES = [],
      NO_LOCALS = NOTHING,
      NO_PARENT = extend($q.when(NOTHING), { $$promises: NOTHING, $$values: NOTHING });


  /**
   * @ngdoc function
   * @name ui.router.util.$resolve#study
   * @methodOf ui.router.util.$resolve
   *
   * @description
   * Studies a set of invocables that are likely to be used multiple times.
   * <pre>
   * $resolve.study(invocables)(locals, parent, self)
   * </pre>
   * is equivalent to
   * <pre>
   * $resolve.resolve(invocables, locals, parent, self)
   * </pre>
   * but the former is more efficient (in fact `resolve` just calls `study`
   * internally).
   *
   * @param {object} invocables Invocable objects
   * @return {function} a function to pass in locals, parent and self
   */
  this.study = function (invocables) {
    if (!isObject(invocables)) throw new Error("'invocables' must be an object");
    var invocableKeys = Object.keys(invocables || {});

    // Perform a topological sort of invocables to build an ordered plan
    var plan = [], cycle = [], visited = {};

    function visit(value, key) {

      if (visited[key] === VISIT_DONE) return;

      cycle.push(key);

      if (visited[key] === VISIT_IN_PROGRESS) {
        cycle.splice(0, cycle.indexOf(key));
        throw new Error("Cyclic dependency: " + cycle.join(" -> "));
      }
      visited[key] = VISIT_IN_PROGRESS;

      if (isString(value)) {
        plan.push(key, [ function() { return $injector.get(value); }], NO_DEPENDENCIES);
      } else {
        var params = $injector.annotate(value);
        forEach(params, function (param) {
          if (param !== key && invocables.hasOwnProperty(param)) visit(invocables[param], param);
        });
        plan.push(key, value, params);
      }

      cycle.pop();
      visited[key] = VISIT_DONE;
    }

    forEach(invocables, visit);
    invocables = cycle = visited = null; // plan is all that's required

    function isResolve(value) {
      return isObject(value) && value.then && value.$$promises;
    }

    return function (locals, parent, self) {
      if (isResolve(locals) && self === undefined) {
        self = parent; parent = locals; locals = null;
      }
      if (!locals) locals = NO_LOCALS;
      else if (!isObject(locals)) throw new Error("'locals' must be an object");

      if (!parent) parent = NO_PARENT;
      else if (!isResolve(parent)) throw new Error("'parent' must be a promise returned by $resolve.resolve()");

      // To complete the overall resolution, we have to wait for the parent
      // promise and for the promise for each invokable in our plan.
      var resolution = $q.defer(),
          result = resolution.promise,
          promises = result.$$promises = {},
          values = extend({}, locals),
          wait = 1 + plan.length / 3,
          merged = false;

      function done() {
        // Merge parent values we haven't got yet and publish our own $$values
        if (!--wait) {
          if (!merged) merge(values, parent.$$values);
          result.$$values = values;
          result.$$promises = result.$$promises || true; // keep for isResolve()
          delete result.$$inheritedValues;
          resolution.resolve(values);
        }
      }

      function fail(reason) {
        result.$$failure = reason;
        resolution.reject(reason);
      }

      // Short-circuit if parent has already failed
      if (isDefined(parent.$$failure)) {
        fail(parent.$$failure);
        return result;
      }

      if (parent.$$inheritedValues) {
        merge(values, omit(parent.$$inheritedValues, invocableKeys));
      }

      // Merge parent values if the parent has already resolved, or merge
      // parent promises and wait if the parent resolve is still in progress.
      extend(promises, parent.$$promises);
      if (parent.$$values) {
        merged = merge(values, omit(parent.$$values, invocableKeys));
        result.$$inheritedValues = omit(parent.$$values, invocableKeys);
        done();
      } else {
        if (parent.$$inheritedValues) {
          result.$$inheritedValues = omit(parent.$$inheritedValues, invocableKeys);
        }
        parent.then(done, fail);
      }

      // Process each invocable in the plan, but ignore any where a local of the same name exists.
      for (var i = 0, ii = plan.length; i < ii; i += 3) {
        if (locals.hasOwnProperty(plan[i])) done();
        else __invoke(plan[i], plan[i + 1], plan[i + 2]);
      }

      function __invoke(key, invocable, params) {
        // Create a deferred for this invocation. Failures will propagate to the resolution as well.
        var invocation = $q.defer(), waitParams = 0;
        function onfailure(reason) {
          invocation.reject(reason);
          fail(reason);
        }
        // Wait for any parameter that we have a promise for (either from parent or from this
        // resolve; in that case study() will have made sure it's ordered before us in the plan).
        forEach(params, function (dep) {
          if (promises.hasOwnProperty(dep) && !locals.hasOwnProperty(dep)) {
            waitParams++;
            promises[dep].then(function (result) {
              values[dep] = result;
              if (!(--waitParams)) proceed();
            }, onfailure);
          }
        });
        if (!waitParams) proceed();
        function proceed() {
          if (isDefined(result.$$failure)) return;
          try {
            invocation.resolve($injector.invoke(invocable, self, values));
            invocation.promise.then(function (result) {
              values[key] = result;
              done();
            }, onfailure);
          } catch (e) {
            onfailure(e);
          }
        }
        // Publish promise synchronously; invocations further down in the plan may depend on it.
        promises[key] = invocation.promise;
      }

      return result;
    };
  };

  /**
   * @ngdoc function
   * @name ui.router.util.$resolve#resolve
   * @methodOf ui.router.util.$resolve
   *
   * @description
   * Resolves a set of invocables. An invocable is a function to be invoked via
   * `$injector.invoke()`, and can have an arbitrary number of dependencies.
   * An invocable can either return a value directly,
   * or a `$q` promise. If a promise is returned it will be resolved and the
   * resulting value will be used instead. Dependencies of invocables are resolved
   * (in this order of precedence)
   *
   * - from the specified `locals`
   * - from another invocable that is part of this `$resolve` call
   * - from an invocable that is inherited from a `parent` call to `$resolve`
   *   (or recursively
   * - from any ancestor `$resolve` of that parent).
   *
   * The return value of `$resolve` is a promise for an object that contains
   * (in this order of precedence)
   *
   * - any `locals` (if specified)
   * - the resolved return values of all injectables
   * - any values inherited from a `parent` call to `$resolve` (if specified)
   *
   * The promise will resolve after the `parent` promise (if any) and all promises
   * returned by injectables have been resolved. If any invocable
   * (or `$injector.invoke`) throws an exception, or if a promise returned by an
   * invocable is rejected, the `$resolve` promise is immediately rejected with the
   * same error. A rejection of a `parent` promise (if specified) will likewise be
   * propagated immediately. Once the `$resolve` promise has been rejected, no
   * further invocables will be called.
   *
   * Cyclic dependencies between invocables are not permitted and will caues `$resolve`
   * to throw an error. As a special case, an injectable can depend on a parameter
   * with the same name as the injectable, which will be fulfilled from the `parent`
   * injectable of the same name. This allows inherited values to be decorated.
   * Note that in this case any other injectable in the same `$resolve` with the same
   * dependency would see the decorated value, not the inherited value.
   *
   * Note that missing dependencies -- unlike cyclic dependencies -- will cause an
   * (asynchronous) rejection of the `$resolve` promise rather than a (synchronous)
   * exception.
   *
   * Invocables are invoked eagerly as soon as all dependencies are available.
   * This is true even for dependencies inherited from a `parent` call to `$resolve`.
   *
   * As a special case, an invocable can be a string, in which case it is taken to
   * be a service name to be passed to `$injector.get()`. This is supported primarily
   * for backwards-compatibility with the `resolve` property of `$routeProvider`
   * routes.
   *
   * @param {object} invocables functions to invoke or
   * `$injector` services to fetch.
   * @param {object} locals  values to make available to the injectables
   * @param {object} parent  a promise returned by another call to `$resolve`.
   * @param {object} self  the `this` for the invoked methods
   * @return {object} Promise for an object that contains the resolved return value
   * of all invocables, as well as any inherited and local values.
   */
  this.resolve = function (invocables, locals, parent, self) {
    return this.study(invocables)(locals, parent, self);
  };
}

angular.module('ui.router.util').service('$resolve', $Resolve);

