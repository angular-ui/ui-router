import {Node} from "../src/path/node";
var module = angular.mock.module;
import uiRouter from "../src/ui-router";
import { RejectType } from "../src/transition/rejectFactory";
import { extend, forEach, map, omit, pick, pluck } from "../src/common/common";
import {PathFactory} from "../src/path/pathFactory";
import {StateMatcher} from "../src/state/stateMatcher";
import {StateBuilder} from "../src/state/stateBuilder";
import {TargetState} from "../src/state/targetState";
import {StateQueueManager} from "../src/state/stateQueueManager";
import {TransitionRejection} from "../src/transition/rejectFactory";

describe('transition', function () {

  var transitionProvider, matcher, pathFactory, statesMap, queue;

  var targetState = function(identifier, params = {}, options?) {
    options = options || {};
    var stateDefinition = matcher.find(identifier, options.relative);
    return new TargetState(identifier, stateDefinition, params, options);
  };

  beforeEach(module('ui.router', function ($transitionsProvider, $urlMatcherFactoryProvider) {
    transitionProvider = $transitionsProvider;
    var stateTree = {
      first: {},
      second: {},
      third: {},
      A: {
        B: {
          C: {
            D: {}
          },
          E: {
            F: {}
          }
        },
        G: {
          H: {
            I: {}
          }
        }
      }
    };

    matcher = new StateMatcher(statesMap = {});
    pathFactory = new PathFactory(function() { return root; });
    var builder = new StateBuilder(function() { return root; }, matcher, $urlMatcherFactoryProvider);
    queue = new StateQueueManager(statesMap, builder, { when: function() {} }, null);
    var root = queue.register({ name: '', url: '^', views: null, 'abstract': true});
    root.navigable = null;

    forEach(stateTree, function(topLevelState, key) {
      registerStates(root, topLevelState, key);
    });

    var stateProps = ["resolve", "resolvePolicy", "data", "template", "templateUrl", "url", "name", "params"];
    function registerStates(parent, state, name) {
      var substates = omit.apply(null, [state].concat(stateProps));
      var thisState = pick.apply(null, [state].concat(stateProps));
      thisState = extend(thisState, { name: name, parent: parent });

      queue.register(thisState);
      forEach(substates, function (value, key) {
        registerStates(thisState, value, key);
      });
    }
  }));

  var makeTransition;

  beforeEach(inject(function ($transitions, $state) {
    matcher = new StateMatcher(statesMap);
    queue.flush($state);
    makeTransition = function makeTransition(from, to, options) {
      let fromState = targetState(from).$state();
      let fromPath = PathFactory.bindTransNodesToPath(fromState.path.map(state => new Node(state)));
      return $transitions.create(fromPath, targetState(to, null, options));
    };
  }));

  describe('provider', function() {
    describe('async event hooks:', function() {
      function PromiseResult(promise?) {
        var self = this, _promise;
        var resolve, reject, complete;

        this.setPromise = function(promise) {
          if (_promise) throw new Error("Already have with'd a promise.");
          _promise = promise;
          _promise.
            then(function (data) { resolve = data || true; })
            .catch(function (err) { reject = err || true; })
            .finally(function () { complete = true; });
        };
        this.get = function() { return { resolve: resolve, reject: reject, complete: complete }; };
        this.called = function() { return map(self.get(), function(val, key) { return val !== undefined }); };

        if (promise) this.setPromise(promise);
      }

      it('$transition$.promise should resolve on success', inject(function($transitions, $q) {
        var result = new PromiseResult();
        transitionProvider.onStart({ from: "*", to: "second" }, function($transition$) {
          result.setPromise($transition$.promise);
        });

        makeTransition("", "second").run(); $q.flush();
        expect(result.called()).toEqual({ resolve: true, reject: false, complete: true });
      }));

      it('$transition$.promise should reject on error', inject(function($transitions, $q) {
        var result = new PromiseResult();

        transitionProvider.onStart({ from: "*", to: "third" }, function($transition$) {
          result.setPromise($transition$.promise);
          throw new Error("transition failed");
        });

        makeTransition("", "third").run(); $q.flush();
        expect(result.called()).toEqual({ resolve: false, reject: true, complete: true });
        expect(result.get().reject.message).toEqual("transition failed");
      }));

      it('should inject $transition$', inject(function($transitions, $q) {
        var t = null;

        transitionProvider.onStart({ from: "*", to: "second" }, function($transition$) {
          t = $transition$;
        });

        var tsecond = makeTransition("", "second");
        tsecond.run(); $q.flush();
        expect(t).toBe(tsecond);
      }));

      describe('.on()', function() {
        it('should fire matching events when transition starts', inject(function($transitions, $q) {
          var t = null;
          transitionProvider.onStart({ from: "first", to: "second" }, function($transition$) {
            t = $transition$;
          });

          makeTransition("first", "third").run(); $q.flush();
          expect(t).toBeNull();

          makeTransition("first", "second").run(); $q.flush();
          expect(t).not.toBeNull();
        }));

        it('should not inject $state$', inject(function($transitions, $q) {
          transitionProvider.onStart({ from: "*", to: "third" }, function($state$) {
            var foo = $state$;
          });

          var transition = makeTransition("", "third");
          var result = new PromiseResult(transition.promise);
          transition.run(); $q.flush();

          expect(result.called()).toEqual({ resolve: false, reject: true, complete: true });
          expect(result.get().reject.message).toContain("Unknown provider: $state$");
        }));
      });

      describe('.onEnter()', function() {
        it('should inject $state$', inject(function($transitions, $q) {
          var states = [];
          transitionProvider.onEnter({ from: "*", to: "*" }, function($state$) {
            states.push($state$);
          });

          makeTransition("", "D").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual(['A', 'B', 'C', 'D']);
        }));

        it('should be called on only states being entered', inject(function($transitions, $q) {
          transitionProvider.onEnter({ from: "*", to: "*" }, function($state$) { states.push($state$); });

          var states = [];
          makeTransition("B", "D").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'C', 'D' ]);

          states = [];
          makeTransition("H", "D").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'B', 'C', 'D' ]);
        }));

        it('should be called only when from state matches and the state being enter matches to', inject(function($transitions, $q) {
          transitionProvider.onEnter({ from: "*", to: "C" }, function($state$) { states.push($state$); });
          transitionProvider.onEnter({ from: "B", to: "C" }, function($state$) { states2.push($state$); });

          var states = [], states2 = [];
          makeTransition("A", "D").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'C' ]);
          expect(pluck(states2, 'name')).toEqual([ ]);

          states = []; states2 = [];
          makeTransition("B", "D").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'C' ]);
          expect(pluck(states2, 'name')).toEqual([ 'C' ]);
        }));
      });

      describe('.onExit()', function() {
        it('should inject the state being exited as $state$', inject(function($transitions, $q) {
          transitionProvider.onExit({ from: "*", to: "*" }, function($state$) { states.push($state$); });

          var states = [];
          makeTransition("D", "H").run(); $q.flush();

          expect(pluck(states, 'name')).toEqual([ 'D', 'C', 'B' ]);
        }));

        it('should be called on only states being exited', inject(function($transitions, $q) {
          transitionProvider.onExit({ from: "*", to: "*" }, function($state$) { states.push($state$); });

          var states = [];
          makeTransition("D", "B").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'D', 'C' ]);

          states = [];
          makeTransition("H", "D").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'H', 'G' ]);
        }));

        it('should be called only when the to state matches and the state being exited matches the from state', inject(function($transitions, $q) {
          transitionProvider.onExit({ from: "D", to: "*" }, function($state$) { states.push($state$); });
          transitionProvider.onExit({ from: "D", to: "C" }, function($state$) { states2.push($state$); });

          var states = [], states2 = [];
          makeTransition("D", "B").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'D' ]);
          expect(pluck(states2, 'name')).toEqual([ ]);

          states = []; states2 = [];
          makeTransition("D", "C").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'D' ]);
          expect(pluck(states2, 'name')).toEqual([ 'D' ]);
        }));
      });

      describe('.onSuccess()', function() {
        it('should only be called if the transition succeeds', inject(function($transitions, $q) {
          transitionProvider.onSuccess({ from: "*", to: "*" }, function($transition$) { states.push($transition$.to().name); });
          transitionProvider.onEnter({ from: "A", to: "C" }, function() { return false; });

          var states = [];
          makeTransition("A", "C").run(); $q.flush();
          expect(states).toEqual([ ]);

          states = [];
          makeTransition("B", "C").run(); $q.flush();
          expect(states).toEqual([ 'C' ]);
        }));

        it('should be called even if other .onSuccess() callbacks fail (throw errors, etc)', inject(function($transitions, $q) {
          transitionProvider.onSuccess({ from: "*", to: "*" }, function($transition$) { throw new Error("oops!"); });
          transitionProvider.onSuccess({ from: "*", to: "*" }, function($transition$) { states.push($transition$.to().name); });

          var states = [];
          makeTransition("B", "C").run(); $q.flush();
          expect(states).toEqual([ 'C' ]);
        }));
      });

      describe('.onError()', function() {
        it('should be called if the transition aborts.', inject(function($transitions, $q) {
          transitionProvider.onEnter({ from: "A", to: "C" }, function($transition$) { return false;  });
          transitionProvider.onError({ from: "*", to: "*" }, function($transition$) { states.push($transition$.to().name); });

          var states = [];
          makeTransition("A", "D").run(); $q.flush();
          expect(states).toEqual([ 'D' ]);
        }));

        it('should be called if any part of the transition fails.', inject(function($transitions, $q) {
          transitionProvider.onEnter({ from: "A", to: "C" }, function($transition$) { throw new Error("oops!");  });
          transitionProvider.onError({ from: "*", to: "*" }, function($transition$) { states.push($transition$.to().name); });

          var states = [];
          makeTransition("A", "D").run(); $q.flush();
          expect(states).toEqual([ 'D' ]);
        }));

        it('should be called for only handlers matching the transition.', inject(function($transitions, $q) {
          transitionProvider.onEnter({ from: "A", to: "C" }, function($transition$) { throw new Error("oops!");  });
          transitionProvider.onError({ from: "*", to: "*" }, function($transition$) { hooks.push("splatsplat"); });
          transitionProvider.onError({ from: "A", to: "C" }, function($transition$) { hooks.push("AC"); });
          transitionProvider.onError({ from: "A", to: "D" }, function($transition$) { hooks.push("AD"); });

          var hooks = [];
          makeTransition("A", "D").run(); $q.flush();
          expect(hooks).toEqual([ 'splatsplat', 'AD' ]);
        }));
      });

      it("return value of 'false' should reject the transition with ABORT status", inject(function($transitions, $q) {
        var states = [], rejection, transition = makeTransition("", "D");
        transitionProvider.onEnter({ from: "*", to: "*" }, function($state$) { states.push($state$); });
        transitionProvider.onEnter({ from: "*", to: "C" }, function() { return false; });

        transition.promise.catch(function(err) { rejection = err; });
        transition.run(); $q.flush();
        expect(pluck(states, 'name')).toEqual([ 'A', 'B', 'C' ]);
        expect(rejection.type).toEqual(RejectType.ABORTED);
      }));

      it("return value of type Transition should abort the transition with SUPERSEDED status", inject(function($transitions, $q) {
        var states = [], rejection, transition = makeTransition("A", "D");
        transitionProvider.onEnter({ from: "*", to: "*" }, function($state$) { states.push($state$); });
        transitionProvider.onEnter({ from: "*", to: "C" }, function($state, $transition$) {
          return targetState("B");
        });
        transition.promise.catch(function(err) { rejection = err; });

        transition.run(); $q.flush();

        expect(pluck(states, 'name')).toEqual([ 'B', 'C' ]);
        expect(rejection.type).toEqual(RejectType.SUPERSEDED);
        expect(rejection.detail.name()).toEqual("B");
        expect(rejection.redirected).toEqual(true);
      }));

      it("hooks which start a new transition should cause the old transition to be rejected.", inject(function($transitions, $q) {
        var current = null;
        function currenTransition() {
          return current;
        }

        var states = [], rejection, transition2, transition2success,
          transition = current = makeTransition("A", "D", { current: currenTransition });

        transitionProvider.onEnter({ from: "*", to: "*" }, function($state$) { states.push($state$); });
        transitionProvider.onEnter({ from: "A", to: "C" }, function() {
          transition2 = current = makeTransition("A", "G", { current: currenTransition }); // similar to using $state.go() in a controller, etc.
          transition2.run();
        });

        transition.promise.catch(function(err) { rejection = err; });
        transition.run();
        $q.flush();

        // .onEnter() from A->C should have set transition2.
        transition2.promise.then(function() { transition2success = true; });
        $q.flush();

        expect(pluck(states, 'name')).toEqual([ 'B', 'C', 'G' ]);
        // TODO: change back to instanceof check after imports/exports is cleaned up
        expect(rejection.constructor.name).toBe('TransitionRejection');
        expect(rejection.type).toEqual(RejectType.SUPERSEDED);
        expect(rejection.detail.to().name).toEqual("G");
        expect(rejection.detail.from().name).toEqual("A");
        expect(rejection.redirected).toBeUndefined();

        expect(transition2success).toBe(true);
      }));

      it("hooks which return a promise should resolve the promise before continuing", inject(function($transitions, $q, $timeout) {
        var log = [], transition = makeTransition("A", "D");
        transitionProvider.onEnter({ from: "*", to: "*" }, function($state$) {
          log.push("#"+$state$.name);
          return $timeout(function() {
            log.push("^"+$state$.name);
          });
        });
        transition.run();
        $timeout.flush();

        expect(log.join('')).toBe("#B^B#C^C#D^D");
      }));

      it("hooks which return a promise should resolve the promise before continuing", inject(function($transitions, $q, $timeout) {
        var log = [], transition = makeTransition("A", "D");
        var defers = { B: $q.defer(), C: $q.defer(), D: $q.defer() };
        function resolveDeferredFor(name) {
          log.push("^" + name);
          defers[name].resolve("ok, go ahead!");
          $timeout.flush();
        }

        transitionProvider.onEnter({}, function waitWhileEnteringState($state$) {
          log.push("#"+$state$.name);
          return defers[$state$.name].promise;
        });

        transition.promise.then(function() { log.push("DONE"); });
        transition.run();
        $timeout.flush();

        expect(log.join(';')).toBe("#B");
        resolveDeferredFor("B"); expect(log.join(';')).toBe("#B;^B;#C");
        resolveDeferredFor("C"); expect(log.join(';')).toBe("#B;^B;#C;^C;#D");
        resolveDeferredFor("D"); expect(log.join(';')).toBe("#B;^B;#C;^C;#D;^D;DONE");
      }));

      it("hooks can add resolves to a $transition$ and they will be available to be injected elsewhere", inject(function($transitions, $q, $timeout) {
        var log = [], transition = makeTransition("A", "D");
        var defer = $q.defer();

        transitionProvider.onEnter({}, function logEnter($state$) { log.push("Entered#"+$state$.name); }, {priority: -1});

        transitionProvider.onEnter({ to: "B" }, function addResolves($transition$) {
          log.push("adding resolve");
          $transition$.addResolves({
            newResolve: function () { log.push("resolving"); return defer.promise; }
          })
        });

        transitionProvider.onEnter({ to: "C" }, function useTheNewResolve(newResolve) {
          log.push(newResolve);
        });

        transition.promise.then(function() { log.push("DONE!"); });
        transition.run();
        $timeout.flush();

        expect(log.join(';')).toBe("adding resolve;Entered#B;resolving");
        defer.resolve("resolvedval");
        $timeout.flush();
        expect(log.join(';')).toBe("adding resolve;Entered#B;resolving;resolvedval;Entered#C;Entered#D;DONE!");
      }));
    });
  });

  describe('Transition() instance', function() {
    describe('.entering', function() {
      it('should return the path elements being entered', inject(function($transitions) {
        var t = makeTransition("", "A");
        expect(pluck(t.entering(), 'name')).toEqual([ "A" ]);

        t = makeTransition("", "D");
        expect(pluck(t.entering(), 'name')).toEqual([ "A", "B", "C", "D" ]);
      }));

      it('should not include already entered elements', inject(function($transitions) {
        let t = makeTransition("B", "D");
        expect(pluck(t.entering(), 'name')).toEqual([ "C", "D" ]);
      }));
    });

    describe('.exiting', function() {
      it('should return the path elements being exited', inject(function($transitions) {
        var t = makeTransition("D", "C");
        expect(pluck(t.exiting(), 'name')).toEqual([ 'D' ]);

        t = makeTransition("D", "A");
        expect(pluck(t.exiting(), 'name')).toEqual([ "D", "C", "B" ]);
      }));
    });

    describe('.is', function() {
      it('should match globs', inject(function($transitions) {
        var t = makeTransition("", "first");

        expect(t.is({ to: "first" })).toBe(true);
        expect(t.is({ from: "" })).toBe(true);
        expect(t.is({ to: "first", from: "" })).toBe(true);

        expect(t.is({ to: ["first", "second"] })).toBe(true);
        expect(t.is({ to: ["first", "second"], from: ["", "third"] })).toBe(true);
        expect(t.is({ to: "first", from: "**" })).toBe(true);

        expect(t.is({ to: "second" })).toBe(false);
        expect(t.is({ from: "first" })).toBe(false);
        expect(t.is({ to: "first", from: "second" })).toBe(false);

        expect(t.is({ to: ["", "third"] })).toBe(false);
        expect(t.is({ to: "**", from: "first" })).toBe(false);
      }));

      it('should match using functions', inject(function($transitions) {
        var t = makeTransition("", "first");

        expect(t.is({ to: function(state) { return state.name === "first"; } })).toBe(true);
        expect(t.is({ from: function(state) { return state.name === ""; } })).toBe(true);
        expect(t.is({
          to: function(state) { return state.name === "first"; },
          from: function(state) { return state.name === ""; }
        })).toBe(true);

        expect(t.is({
          to: function(state) { return state.name === "first"; },
          from: "**"
        })).toBe(true);

        expect(t.is({ to: function(state) { return state.name === "second"; } })).toBe(false);
        expect(t.is({ from: function(state) { return state.name === "first"; } })).toBe(false);
        expect(t.is({
          to: function(state) { return state.name === "first"; },
          from: function(state) { return state.name === "second"; }
        })).toBe(false);

//        expect(t.is({ to: ["", "third"] })).toBe(false);
//        expect(t.is({ to: "**", from: "first" })).toBe(false);
      }));
    });
  });

});