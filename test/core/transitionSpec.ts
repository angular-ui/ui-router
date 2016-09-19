import {PathNode} from "../../src/path/node";

import { UIRouter
    RejectType, Rejection,
    pluck,
    services,
    TransitionService,
    StateService,
    Rejection,
    Resolvable,
    Transition,
} from "../../src/core";
import "../../src/justjs";
import {tree2Array, PromiseResult} from "../testUtils.ts";

describe('transition', function () {

  let router: UIRouter;
  let $transitions: TransitionService;
  let $state: StateService;

  function makeTransition(from, to, options?): Transition {
    let fromState = $state.target(from).$state();
    let fromPath = fromState.path.map(state => new PathNode(state));
    return $transitions.create(fromPath, $state.target(to, null, options));
  }

  const wait = (val?) =>
      new Promise((resolve) => setTimeout(() => resolve(val)));

  // Use this in a .then(go('from', 'to')) when you want to run a transition you expect to succeed
  const go = (from, to, options?) =>
      () => makeTransition(from, to, options).run().then(wait);

  // Use this in a .then(goFail('from', 'to')) when you want to run a transition you expect to fail
  const goFail = (from, to, options?) =>
      () => makeTransition(from, to, options).run().catch(wait);

  beforeEach(() => {
    router = new UIRouter();
    $state = router.stateService;
    $transitions = router.transitionService;
    router.stateRegistry.stateQueue.autoFlush($state);

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

    let states = tree2Array(stateTree, false);
    states.forEach(state => router.stateRegistry.register(state));
  });

  describe('provider', () => {
    describe('async event hooks:', () => {
      it('$transition$.promise should resolve on success', (done) => {
        var result = new PromiseResult();
        $transitions.onStart({ from: "*", to: "second" }, function($transition$) {
          result.setPromise($transition$.promise);
        });

        Promise.resolve()
            .then(go("", "second"))
            .then(() => expect(result.called()).toEqual({ resolve: true, reject: false, complete: true }))
            .then(done);
      });

      it('$transition$.promise should reject on error', (done) => {
        var result = new PromiseResult();

        $transitions.onStart({ from: "*", to: "third" }, function($transition$) {
          result.setPromise($transition$.promise);
          throw new Error("transition failed");
        });

        Promise.resolve()
            .then(goFail("", "third"))
            .then(() => {
              expect(result.called()).toEqual({resolve: false, reject: true, complete: true});
              expect(result.get().reject.message).toEqual("transition failed");
            })
            .then(done);
      });

      it('$transition$.promise should reject on error in synchronous hooks', ((done) => {
        var result = new PromiseResult();

        $transitions.onBefore({ from: "*", to: "third" }, function($transition$) {
          result.setPromise($transition$.promise);
          throw new Error("transition failed");
        });

        Promise.resolve()
            .then(goFail("", "third"))
            .then(() => {
              expect(result.called()).toEqual({ resolve: false, reject: true, complete: true });
              expect(result.get().reject.detail.message).toEqual("transition failed");
            })
            .then(done);
      }));

      it('should receive the transition as the first parameter', ((done) => {
        var t = null;

        $transitions.onStart({ from: "*", to: "second" }, function(trans) {
          t = trans;
        });

        var tsecond = makeTransition("", "second");
        tsecond.run()
            .then(wait)
            .then(() => expect(t).toBe(tsecond))
            .then(done);
      }));

      // Test for #2972 and https://github.com/ui-router/react/issues/3
      it('should reject transitions that are superseded by a new transition', ((done) => {
        $state.defaultErrorHandler(function() {});
        router.stateRegistry.register({
          name: 'slowResolve',
          resolve: {
            foo: () => new Promise(resolve => setTimeout(resolve, 50))
          }
        });

        let results = { success: 0, error: 0 };
        let success = () => results.success++;
        let error = () => results.error++;
        $transitions.onBefore({}, trans => { trans.promise.then(success, error) });

        $state.go('slowResolve');

        setTimeout(() => $state.go('slowResolve').transition.promise.then(() => {
          expect(results).toEqual({success: 1, error: 1});
          done();
        }), 20);
      }));

      describe('.onStart()', function() {
        it('should fire matching events when transition starts', ((done) => {
          var t = null;
          $transitions.onStart({ from: "first", to: "second" }, function($transition$) {
            t = $transition$;
          });

          Promise.resolve()
              .then(go("first", "third"))
              .then(() => expect(t).toBeNull())
              .then(go("first", "second"))
              .then(() => expect(t).not.toBeNull())
              .then(done);
        }));

        it('should get Transition as an argument, and a null state', ((done) => {
          var args = { trans: undefined, state: undefined };
          $transitions.onStart({ from: "*", to: "third" }, <any> function(trans, state) {
            args.trans = trans;
            args.state = state;
          });

          var transition = makeTransition("", "third");
          var result = new PromiseResult(transition.promise);
          transition.run()
              .then(wait)
              .then(() => {
                expect(result.called()).toEqual({ resolve: true, reject: false, complete: true });
                expect(typeof args.trans.from).toBe('function');
                expect(args.state).toBeNull()
              })
              .then(done);
        }));
      });

      describe('.onEnter()', function() {
        it('should get Transition and the state being entered as arguments', ((done) => {
          var states = [];
          var args = { trans: undefined, state: undefined, third: undefined };

          $transitions.onEnter({ entering: "*" }, <any> function(trans, state, third) {
            states.push(state);
            args.trans = trans;
            args.third = third;
          });

          Promise.resolve()
              .then(go("", "D"))
              .then(() => {
                expect(pluck(states, 'name')).toEqual(['A', 'B', 'C', 'D']);
                expect(typeof args.trans.from).toBe('function');
                expect(args.third).toBeUndefined();
              })
              .then(done)
        }));

        it('should be called on only states being entered', ((done) => {
          $transitions.onEnter({ entering: "**" }, function(trans, state) { states.push(state); });

          var states = [];
          Promise.resolve()
              .then(go("B", "D"))
              .then(() => expect(pluck(states, 'name')).toEqual([ 'C', 'D' ]))
              .then(() => states = [])
              .then(go("H", "D"))
              .then(() => expect(pluck(states, 'name')).toEqual([ 'B', 'C', 'D' ]))
              .then(done)
        }));

        it('should be called only when from state matches and the state being enter matches to', ((done) => {
          $transitions.onEnter({ from: "*", entering: "C" }, function(trans, state) { states.push(state); });
          $transitions.onEnter({ from: "B", entering: "C" }, function(trans, state) { states2.push(state); });

          var states = [], states2 = [];
          Promise.resolve()
              .then(go("A", "D"))
              .then(() => {
                expect(pluck(states, 'name')).toEqual([ 'C' ]);
                expect(pluck(states2, 'name')).toEqual([ ]);
              })

              .then(() => { states = []; states2 = []; })
              .then(go("B", "D"))
              .then(() => {
                expect(pluck(states, 'name')).toEqual([ 'C' ]);
                expect(pluck(states2, 'name')).toEqual([ 'C' ]);
              })

              .then(done);
        }));
      });

      describe('.onExit()', function() {
        it('should get Transition, the state being exited, and Injector as arguments', ((done) => {
          var args = { trans: undefined, state: undefined, third: undefined };

          $transitions.onExit({ exiting: "**" }, <any> function(trans, state, third) {
            states.push(state);
            args.trans = trans;
            args.third = third;
          });

          var states = [];
          Promise.resolve()
              .then(go("D", "H"))
              .then(() => {
                expect(pluck(states, 'name')).toEqual([ 'D', 'C', 'B' ]);
                expect(typeof args.trans.from).toBe('function');
                expect(args.third).toBeUndefined();
              })
              .then(done);

        }));

        it('should be called on only states being exited', ((done) => {
          $transitions.onExit({ exiting: "*" }, function(trans, state) { states.push(state); });

          var states = [];
          Promise.resolve()
              .then(go("D", "B"))
              .then(() => expect(pluck(states, 'name')).toEqual([ 'D', 'C' ]))
              .then(() => states = [])
              .then(go("H", "D"))
              .then(() => expect(pluck(states, 'name')).toEqual([ 'H', 'G' ]))
              .then(done);
        }));

        it('should be called only when the to state matches and the state being exited matches the from state', ((done) => {
          $transitions.onExit({ exiting: "D", to: "*" }, function(trans, state) { states.push(state); });
          $transitions.onExit({ exiting: "D", to: "C" }, function(trans, state) { states2.push(state); });

          var states = [], states2 = [];
          Promise.resolve()
              .then(go("D", "B"))
              .then(() => {
                expect(pluck(states, 'name')).toEqual([ 'D' ]);
                expect(pluck(states2, 'name')).toEqual([ ]);
              })
              .then(() => { states = []; states2 = []; })
              .then(go("D", "C"))
              .then(() => {
                expect(pluck(states, 'name')).toEqual([ 'D' ]);
                expect(pluck(states2, 'name')).toEqual([ 'D' ]);
              })
              .then(done);
        }));
      });

      describe('.onSuccess()', function() {
        beforeEach(() => $state.defaultErrorHandler(function() {}));

        it('should only be called if the transition succeeds', ((done) => {
          $transitions.onSuccess({ from: "*", to: "*" }, function(trans) { states.push(trans.to().name); });
          $transitions.onEnter({ from: "A", entering: "C" }, function() { return false; });

          var states = [];
          Promise.resolve()
              .then(goFail("A", "C"))
              .then(() => expect(states).toEqual([ ]))
              .then(() => states = [])
              .then(go("B", "C"))
              .then(() => expect(states).toEqual([ 'C' ]))
              .then(done);
        }));

        it('should be called even if other .onSuccess() callbacks fail (throw errors, etc)', ((done) => {
          $transitions.onSuccess({ from: "*", to: "*" }, function() { throw new Error("oops!"); });
          $transitions.onSuccess({ from: "*", to: "*" }, function(trans) { states.push(trans.to().name); });

          var states = [];
          Promise.resolve()
              .then(go("B", "C"))
              .then(() => expect(states).toEqual([ 'C' ]))
              .then(done);
        }));
      });

      describe('.onError()', function() {
        it('should be called if the transition aborts.', ((done) => {
          $transitions.onEnter({ from: "A", entering: "C" }, function() { return false; });
          $transitions.onError({ }, function(trans) { states.push(trans.to().name); });

          var states = [];
          Promise.resolve()
              .then(goFail("A", "D"))
              .then(() => expect(states).toEqual([ 'D' ]))
              .then(done);
        }));

        it('should be called if any part of the transition fails.', ((done) => {
          $transitions.onEnter({ from: "A", entering: "C" }, function() { throw new Error("oops!");  });
          $transitions.onError({ }, function(trans) { states.push(trans.to().name); });

          var states = [];
          Promise.resolve()
              .then(goFail("A", "D"))
              .then(() => expect(states).toEqual([ 'D' ]))
              .then(done);
        }));

        it('should be called for only handlers matching the transition.', ((done) => {
          $transitions.onEnter({ from: "A", entering: "C" }, function() { throw new Error("oops!");  });
          $transitions.onError({ from: "*", to: "*" }, function() { hooks.push("splatsplat"); });
          $transitions.onError({ from: "A", to: "C" }, function() { hooks.push("AC"); });
          $transitions.onError({ from: "A", to: "D" }, function() { hooks.push("AD"); });

          var hooks = [];
          Promise.resolve()
              .then(goFail("A", "D"))
              .then(() => expect(hooks).toEqual([ 'splatsplat', 'AD' ]))
              .then(done);
        }));
      });

      // Test for #2866
      it('should have access to the failure reason in transition.error().', ((done) => {
        let error = new Error("oops!");
        let transError;
        $transitions.onEnter({ from: "A", entering: "C" }, function() { throw error;  });
        $transitions.onError({ }, function(trans) { transError = trans.error(); });

        Promise.resolve()
            .then(goFail("A", "D"))
            .then(() => expect(transError).toBe(error))
            .then(done);
      }));

      it("return value of 'false' should reject the transition with ABORT status", ((done) => {
        var states = [], rejection, transition = makeTransition("", "D");
        $transitions.onEnter({ entering: "*" }, function(trans, state) { states.push(state); });
        $transitions.onEnter({ from: "*", entering: "C" }, function() { return false; });

        transition.promise.catch(function(err) { rejection = err; });
        transition.run()
            .catch(wait)
            .then(() => {
              expect(pluck(states, 'name')).toEqual([ 'A', 'B', 'C' ]);
              expect(rejection.type).toEqual(RejectType.ABORTED);
            })
            .then(done);
      }));

      it("return value of type Transition should abort the transition with SUPERSEDED status", ((done) => {
        var states = [], rejection, transition = makeTransition("A", "D");
        $transitions.onEnter({ entering: "*" }, function(trans, state) { states.push(state); });
        $transitions.onEnter({ from: "*", entering: "C" }, () => $state.target("B"));
        transition.promise.catch(function(err) { rejection = err; });

        transition.run()
            .catch(wait)
            .then(() => {
              expect(pluck(states, 'name')).toEqual([ 'B', 'C' ]);
              expect(rejection.type).toEqual(RejectType.SUPERSEDED);
              expect(rejection.detail.name()).toEqual("B");
              expect(rejection.redirected).toEqual(true);
            })
            .then(done);
      }));

      it("hooks which start a new transition should cause the old transition to be rejected.", ((done) => {
        var current = null;
        function currenTransition() {
          return current;
        }

        var states = [], rejection, transition2, transition2success,
            transition = current = makeTransition("A", "D", { current: currenTransition });

        $transitions.onEnter({ entering: "*", to: "*" }, function(trans, state) { states.push(state); });
        $transitions.onEnter({ from: "A", entering: "C" }, function() {
          transition2 = current = makeTransition("A", "G", { current: currenTransition }); // similar to using $state.go() in a controller, etc.
          transition2.run();
        });

        transition.promise.catch(function(err) { rejection = err; });
        transition.run()
            .then(wait, wait)
            .then(() => {
              // .onEnter() from A->C should have set transition2.
              transition2.promise.then(function() { transition2success = true; });
            })
            .then(wait, wait)
            .then(() => {
              expect(pluck(states, 'name')).toEqual([ 'B', 'C', 'G' ]);
              expect(rejection instanceof Rejection).toBeTruthy();
              expect(rejection.type).toEqual(RejectType.SUPERSEDED);
              expect(rejection.detail.to().name).toEqual("G");
              expect(rejection.detail.from().name).toEqual("A");
              expect(rejection.redirected).toBeUndefined();

              expect(transition2success).toBe(true);
            })
            .then(done);
      }));

      it("hooks which return a promise should resolve the promise before continuing", (done) => {
        var log = [], transition = makeTransition("A", "D");
        $transitions.onEnter({ from: "*", entering: "*" }, function(trans, state) {
          log.push("#"+state.name);

          return new Promise((resolve) =>
              setTimeout(() => {
                log.push("^" + state.name);
                resolve();
              })
          );
        });

        transition.run()
            .then(wait, wait)
            .then(() => expect(log.join('')).toBe("#B^B#C^C#D^D"))
            .then(done);
      });

      it("hooks which return a promise should resolve the promise before continuing", ((done) => {
        var log = [], transition = makeTransition("A", "D");
        var $q = services.$q;
        var defers = { B: $q.defer(), C: $q.defer(), D: $q.defer() };
        function resolveDeferredFor(name) {
          log.push("^" + name);
          defers[name].resolve("ok, go ahead!");
          return wait();
        }

        $transitions.onEnter({ entering: '**' }, function waitWhileEnteringState(trans, state) {
          log.push("#"+state.name);
          return defers[state.name].promise;
        });

        transition.promise.then(function() { log.push("DONE"); });
        transition.run();

        wait().then(() => expect(log.join(';')).toBe("#B"))

            .then(() => resolveDeferredFor("B"))
            .then(() => expect(log.join(';')).toBe("#B;^B;#C"))

            .then(() => resolveDeferredFor("C"))
            .then(() => expect(log.join(';')).toBe("#B;^B;#C;^C;#D"))

            .then(() => resolveDeferredFor("D"))
            .then(() => expect(log.join(';')).toBe("#B;^B;#C;^C;#D;^D;DONE"))

            .then(done, done);
      }));

      it("hooks can add resolves to a $transition$ and they will be available to be injected elsewhere", ((done) => {
        var log = [], transition = makeTransition("A", "D");
        var $q = services.$q;
        var defer = $q.defer();

        $transitions.onEnter({ entering: '**'}, function logEnter(trans, state) {
          log.push("Entered#"+state.name);
        }, { priority: -1 });

        $transitions.onEnter({ entering: "B" }, function addResolves($transition$: Transition) {
          log.push("adding resolve");
          var resolveFn = function () { log.push("resolving"); return defer.promise; };
          $transition$.addResolvable(new Resolvable('newResolve', resolveFn));
        });

        $transitions.onEnter({ entering: "C" }, function useTheNewResolve(trans) {
          log.push(trans.injector().get('newResolve'));
        });

        transition.promise.then(function() { log.push("DONE!"); });

        transition.run();

        wait().then(() => expect(log.join(';')).toBe("adding resolve;Entered#B;resolving"))
            .then(() => defer.resolve("resolvedval"))
            .then(wait, wait)
            .then(() => expect(log.join(';')).toBe("adding resolve;Entered#B;resolving;resolvedval;Entered#C;Entered#D;DONE!"))
            .then(done, done);
      }));
    });
  });

  describe('Transition() instance', function() {
    describe('.entering', function() {
      it('should return the path elements being entered', (() => {
        var t = makeTransition("", "A");
        expect(pluck(t.entering(), 'name')).toEqual([ "A" ]);

        t = makeTransition("", "D");
        expect(pluck(t.entering(), 'name')).toEqual([ "A", "B", "C", "D" ]);
      }));

      it('should not include already entered elements', (() => {
        let t = makeTransition("B", "D");
        expect(pluck(t.entering(), 'name')).toEqual([ "C", "D" ]);
      }));
    });

    describe('.exiting', function() {
      it('should return the path elements being exited', (() => {
        var t = makeTransition("D", "C");
        expect(pluck(t.exiting(), 'name')).toEqual([ 'D' ]);

        t = makeTransition("D", "A");
        expect(pluck(t.exiting(), 'name')).toEqual([ "D", "C", "B" ]);
      }));
    });

    describe('.is', function() {
      it('should match globs', (() => {
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

      it('should match using functions', (() => {
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