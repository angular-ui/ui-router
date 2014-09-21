var Resolvable, Path, PathElement, ResolveContext;

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
   ------- Resolvable, PathElement, Path, ResolveContext ------------------
   I think these should be private API for now because we may need to iterate it for a while.
   /*

   /*  Resolvable

   The basic building block for the new resolve system.
   Resolvables encapsulate a state's resolve's resolveFn, the resolveFn's declared dependencies, and the wrapped (.promise)
   and unwrapped-when-complete (.data) result of the resolveFn.

   Resolvable.get() either retrieves the Resolvable's existing promise, or else invokes resolve() (which invokes the
   resolveFn) and returns the resulting promise.

   Resolvable.get() and Resolvable.resolve() both execute within a ResolveContext, which is passed as the first
   parameter to those fns.
   */


  Resolvable = function Resolvable(name, resolveFn, state) {
    var self = this;

    // Resolvable: resolveResolvable() This function is aliased to Resolvable.resolve()

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
    function resolveResolvable(resolveContext) {
      // First, set up an overall deferred/promise for this Resolvable
      var deferred = $q.defer();
      self.promise = deferred.promise;

      // Load an assoc-array of all resolvables for this state from the resolveContext
      // omit the current Resolvable from the PathElement in the ResolveContext so we don't try to inject self into self
      var options = {  omitPropsFromPrototype: [ self.name ], flatten: true };
      var ancestorsByName = resolveContext.getResolvableLocals(self.state.name, options);

      // Limit the ancestors Resolvables map to only those that the current Resolvable fn's annotations depends on
      var depResolvables = pick(ancestorsByName, self.deps);

      // Get promises (or synchronously invoke resolveFn) for deps
      var depPromises = map(depResolvables, function(resolvable) {
        return resolvable.get(resolveContext);
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

    // Public API
    extend(this, {
      name: name,
      resolveFn: resolveFn,
      state: state,
      deps: $injector.annotate(resolveFn),
      resolve: resolveResolvable, // aliased function name for stacktraces
      promise: undefined,
      data: undefined,
      get: function(resolveContext) {
        return self.promise || resolveResolvable(resolveContext);
      }
    });
  };

  var resolvePolicies = { eager: 3, lazy: 2, jit: 1 };
  var defaultResolvePolicy = "eager"; // TODO: make this configurable

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

    // returns a promise for all resolvables on this PathElement
    // options.policy: only return promises for those Resolvables which are at the specified policy strictness, or above.
    function resolvePathElement(resolveContext, options) {
      var policyOrdinal = resolvePolicies[options && options.policy || defaultResolvePolicy];

      var policyConf = {
        $$state: angular.isString(self.state.resolvePolicy) ? self.state.resolvePolicy : defaultResolvePolicy,
        $$resolves: angular.isObject(self.state.resolvePolicy) ? self.state.resolvePolicy : defaultResolvePolicy
      };

      forEach(self.resolvables, function(resolvable) {
        var policyString = policyConf.$$resolves[resolvable.name] || policyConf.$$state;
        policyConf[resolvable.name] = resolvePolicies[policyString];
      });

      var resolvablesForPolicy = filter(resolvables, function(resolvable) { return policyConf[resolvable.name] >= policyOrdinal });
      return $q.all(map(resolvablesForPolicy, function(resolvable) { return resolvable.get(resolveContext); }));
    }

    // Injects a function at this PathElement level with available Resolvables
    // First it resolves all resolvables.  When they are done resolving, invokes the function.
    // Returns a promise for the return value of the function.
    // public function
    // fn is the function to inject (onEnter, onExit, controller)
    // locals are the regular-style locals to inject
    // resolveContext is a ResolveContext which is for injecting state Resolvable(s)
    function invokeLater(fn, locals, resolveContext) {
      var deps = $injector.annotate(fn);
      var resolvables = pick(resolveContext.getResolvableLocals(self.state.name), deps);
      var promises = map(resolvables, function(resolvable) { return resolvable.get(resolveContext); });
      return $q.all(promises).then(function() {
        try {
          return self.invokeNow(fn, locals, resolveContext);
        } catch (error) {
          return $q.reject(error);
        }
      });
    }

    // private function? Maybe needs to be public-to-$transition to allow onEnter/onExit to be invoked synchronously
    // and in the correct order, but only after we've manually ensured all the deps are resolved.

    // Injects a function at this PathElement level with available Resolvables
    // Does not wait until all Resolvables have been resolved; you must call PathElement.resolve() (or manually resolve each dep) first
    function invokeNow(fn, locals, resolveContext) {
      var resolvables = resolveContext.getResolvableLocals(self.state.name);
      var moreLocals = map(resolvables, function(resolvable) { return resolvable.data; });
      var combinedLocals = extend({}, locals, moreLocals);
      return $injector.invoke(fn, self.state, combinedLocals);
    }

    // public API so far
    extend(this, {
      state: state,
      resolvables: resolvables,
      resolve: resolvePathElement, // aliased function for stacktraces
      invokeNow: invokeNow, // this might be private later
      invokeLater: invokeLater
    });
  };

  // A Path Object holds an ordered list of PathElements.
  // This object is used by ResolveContext to store resolve status for an entire path of states.
  // It has concat and slice helper methods to return new Paths, based on the current Path.

  // statesOrPathElements must be an array of either state(s) or PathElement(s)
  // states could be "public" state objects for this?
  Path = function Path(statesOrPathElements) {
    var self = this;
    if (!isArray(statesOrPathElements)) throw new Error("states must be an array of state(s) or PathElement(s)", statesOrPathElements);
    var isPathElementArray = (statesOrPathElements.length && (statesOrPathElements[0] instanceof PathElement));

    var elements = statesOrPathElements;
    if (!isPathElementArray) { // they passed in states; convert them to PathElements
      elements = map(elements, function (state) { return new PathElement(state); });
    }

    // resolveContext holds stateful Resolvables (containing possibly resolved data), mapped per state-name.
    function resolvePath(resolveContext, options) {
      return $q.all(map(elements, function(element) { return element.resolve(resolveContext, options); }));
    }

    // returns a ResolveContext for a subpath of this path.
    // The subpath is from the root path element up to and including the toPathElement parameter
    function resolveContext(toPathElement) {
      toPathElement = toPathElement || elements[elements.length - 1];
      var elementIdx = elements.indexOf(toPathElement);
//      if (angular.isNumber(toPathElement)) // maybe allow the param to be the index too
//        elementIdx = toPathElement;
      if (elementIdx == -1) throw new Error("this Path does not contain the toPathElement");
      return new ResolveContext(self.slice(0, elementIdx));
    }

    // Not used
    function invoke(hook, self, locals) {
      if (!hook) return;
      return $injector.invoke(hook, self, locals);
    }

    function invokeFunctionsSync(path, fnName, reverse) {
      var pathElements = elements.slice(0);
      if (reverse) pathElements.reverse();

      forEach(pathElements, function(pathElement) {
        var fn = pathElement.state[fnName];
        if (fn) {
          var result = pathElement.invokeNow(fn, {}, path.resolveContext(pathElement));
          if (!result) return result;
        }
      });
      return true;
    }

    // Public API
    extend(this, {
      resolve: resolvePath,
      resolveContext: resolveContext,
      elements: elements,
      concat: function(path) {
        return new Path(elements.concat(path.elements));
      },
      slice: function(start, end) {
        return new Path(elements.slice(start, end));
      },
      states: function() {
        return pluck(elements, "state");
      },
      $$enter: function(toPath, async) {
        // Async returns promise for true/false. Don't need to pre-resolve anything
        if (async) return invokeFunctionsAsync(toPath, 'onEnter', false);
        // Sync returns truthy/falsy ... all deps must be pre-resolved in toPath
        if (async)
          return invokeFunctionsSync(toPath, 'onEnter', false);
      },
      $$exit: function(fromPath, async) {
        if (async) return invokeFunctionsAsync(fromPath, 'onExit', true);
        return invokeFunctionsSync(fromPath, 'onExit', true);
      }
    });
  };

  // ResolveContext is passed into each resolve() function, and is used to statefully manage Resolve status.
  // ResolveContext is essentially the replacement data structure for $state.$current.locals and we'll have to
  // figure out where to store/manage this data structure.
  // It manages a set of Resolvables that are available at each level of the Path.
  // It follows the list of PathElements and inherit()s the PathElement's Resolvables on top of the
  // previous PathElement's Resolvables.  i.e., it builds a prototypal chain for the PathElements' Resolvables.
  // Before moving on to the next PathElement, it makes a note of what Resolvables are available for the current
  // PathElement, and maps it by state name.

  // ResolveContext constructor takes a path which is assumed to be partially resolved, or
  // not resolved at all, which we're in process of resolving
  ResolveContext = function ResolveContext(path) {
    if (path === undefined) path = new Path([]);
    var resolvablesByState = {}, previousIteration = {};

    forEach(path.elements, function (pathElem) {
      var resolvablesForPE = pathElem.resolvables;
      var resolvesbyName = indexBy(resolvablesForPE, 'name');
      var resolvables = inherit(previousIteration, resolvesbyName); // note prototypal inheritance
      previousIteration = resolvablesByState[pathElem.state.name] = resolvables;
    });

    // Gets resolvables available for a particular state.
    // TODO: This should probably be "for a particular PathElement" instead of state, but PathElements encapsulate a state.
    // This returns the Resolvable map by state name.

    // options.omitPropsFromPrototype
    // Remove the props specified in options.omitPropsFromPrototype from the prototype of the object.

    // This hides a top-level resolvable by name, potentially exposing a parent resolvable of the same name
    // further down the prototype chain.

    // This is used to provide a Resolvable access to all other Resolvables in its same PathElement, yet disallow
    // that Resolvable access to its own injectable Resolvable reference.

    // This is also used to allow a state to override a parent state's resolve while also injecting
    // that parent state's resolve:

    // state({ name: 'G', resolve: { _G: function() { return "G"; } } });
    // state({ name: 'G.G2', resolve: { _G: function(_G) { return _G + "G2"; } } });
    // where injecting _G into a controller will yield "GG2"

    // options.flatten
    // $$resolvablesByState has resolvables organized in a prototypal inheritance chain.  options.flatten will
    // flatten the object from prototypal inheritance to a simple object with all its prototype chain properties
    // exposed with child properties taking precedence over parent properties.
    function getResolvableLocals(stateName, options) {
      var resolvables = (resolvablesByState[stateName] || {});
      options = extend({ flatten: true, omitPropsFromPrototype: [] }, options);

      // Create a shallow clone referencing the original prototype chain.  This is so we can alter the clone's
      // prototype without affecting the actual object (for options.omitPropsFromPrototype)
      var shallowClone = Object.create(Object.getPrototypeOf(resolvables));
      for (var property in resolvables) {
        if (resolvables.hasOwnProperty(property)) { shallowClone[property] = resolvables[property]; }
      }

      // Omit any specified top-level prototype properties
      forEach(options.omitPropsFromPrototype, function(prop) {
        delete(shallowClone[prop]); // possibly exposes the same prop from prototype chain
      });

      if (options.flatten) // Flatten from prototypal chain to simple object
        shallowClone = flattenPrototypeChain(shallowClone);

      return shallowClone;
    }

    extend(this, {
      getResolvableLocals: getResolvableLocals,
      $$resolvablesByState: resolvablesByState
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
          result.$$promises = true; // keep for isResolve()
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
        merge(values, parent.$$inheritedValues);
      }

      // Merge parent values if the parent has already resolved, or merge
      // parent promises and wait if the parent resolve is still in progress.
      if (parent.$$values) {
        merged = merge(values, parent.$$values);
        result.$$inheritedValues = parent.$$values;
        done();
      } else {
        if (parent.$$inheritedValues) {
          result.$$inheritedValues = parent.$$inheritedValues;
        }        
        extend(promises, parent.$$promises);
        parent.then(done, fail);
      }

      // Process each invocable in the plan, but ignore any where a local of the same name exists.
      for (var i = 0, ii = plan.length; i < ii; i += 3) {
        if (locals.hasOwnProperty(plan[i])) done();
        else invoke(plan[i], plan[i + 1], plan[i + 2]);
      }

      function invoke(key, invocable, params) {
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

