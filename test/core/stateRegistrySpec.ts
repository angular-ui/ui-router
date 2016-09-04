import {UIRouter} from "../../src/router";
import {tree2Array} from "../testUtils.ts";
import {StateRegistry} from "../../src/state/stateRegistry";
import {services} from "../../src/common/coreservices";

let router: UIRouter = null;
let registry: StateRegistry = null;
let statetree = {
  A: {
    B: {
      C: {
        D: {

        }
      }
    }
  }
};

describe("StateRegistry", () => {
  beforeEach(() => {
    router = new UIRouter();
    registry = router.stateRegistry;
    tree2Array(statetree, true).forEach(state => registry.register(state));
    registry.stateQueue.autoFlush(router.stateService);
  });

  describe('register', () => {
    it("should queue children until their parents exist", () => {
      registry.register({ name: 'A.B.C.D.E.F' });
      registry.register({ name: 'A.B.C.D.E.F.G' });
      expect(registry.get().map(x=>x.name)).toEqual(['', 'A', 'A.B', 'A.B.C', 'A.B.C.D']);

      registry.register({ name: 'A.B.C.D.E' });
      expect(registry.get().map(x=>x.name)).toEqual(['', 'A', 'A.B', 'A.B.C', 'A.B.C.D',
        'A.B.C.D.E', 'A.B.C.D.E.F', 'A.B.C.D.E.F.G']);
    });
  });

  describe('deregister', () => {
    it("should remove a state by name", () => {
      registry.deregister('A.B.C.D');
      expect(registry.get().map(x=>x.name)).toEqual(['', 'A', 'A.B', 'A.B.C']);
    });

    it("should remove a state by reference", () => {
      let state = registry.get('A.B.C.D');
      registry.deregister(state);
      expect(registry.get().map(x=>x.name)).toEqual(['', 'A', 'A.B', 'A.B.C']);
    });

    it("should remove a state tree", () => {
      registry.register({ name: 'A.B.X' });
      expect(registry.get().map(x=>x.name)).toEqual(['', 'A', 'A.B', 'A.B.C', 'A.B.C.D', 'A.B.X']);

      let state = registry.get('A.B');
      registry.deregister(state);
      expect(registry.get().map(x=>x.name)).toEqual(['', 'A']);
    });

    it("should also remove the state's url rule", () => {
      let $state = router.stateService;
      let state: any = { name: 'A.B.X', url: '/foo' };
      registry.register(state);

      spyOn($state, "transitionTo");
      services.location.setUrl("/foo");
      router.urlRouter.sync();
      expect($state.transitionTo['calls'].mostRecent().args[0]).toBe(state.$$state());

      registry.deregister(state);
      $state.transitionTo['calls'].reset();
      router.urlRouter.sync();
      expect($state.transitionTo['calls'].count()).toBe(0);
      expect(router.urlRouter['urlRouterProvider'].rules.length).toBe(0);
    });
  });

  describe('onStatesChanged callback', () => {
    let changes;
    beforeEach(() => {
      changes = { registered: [], deregistered: []};
      registry.onStatesChanged((event, states) =>
          changes[event] = changes[event].concat(states));
    });

    it("should be invoked with `registered` when a state is registered", () => {
      let state = { name: 'A.B.C.D.E' };
      registry.register(state);

      expect(registry.get().map(x=>x.name)).toEqual(['', 'A', 'A.B', 'A.B.C', 'A.B.C.D', 'A.B.C.D.E']);

      expect(changes.registered).toEqual([state]);
    });

    it("should be invoked with `registered` when multiple queued states are registered", () => {
      let fState = { name: 'A.B.C.D.E.F' };
      let eState = { name: 'A.B.C.D.E' };

      registry.register(fState);

      expect(changes.registered).toEqual([]);

      registry.register(eState);
      expect(changes.registered).toEqual([eState, fState]);

      expect(registry.get().map(x=>x.name)).toEqual(['', 'A', 'A.B', 'A.B.C', 'A.B.C.D', 'A.B.C.D.E', 'A.B.C.D.E.F']);
    });

    it("should be invoked with `deregistered` when a state is deregistered", () => {
      registry.deregister('A.B.C.D');

      expect(changes.deregistered.map(x=>x.name)).toEqual(['A.B.C.D']);
      expect(registry.get().map(x=>x.name)).toEqual(['', 'A', 'A.B', 'A.B.C']);
    });

    it("should be invoked with `deregistered` when a state tree is deregistered", () => {
      registry.deregister('A.B');

      expect(changes.deregistered.map(x=>x.name)).toEqual(['A.B.C.D', 'A.B.C', 'A.B']);
      expect(registry.get().map(x=>x.name)).toEqual(['', 'A']);
    });

    it("should support multiple registered callbacks", () => {
      let log = "";
      registry.onStatesChanged((event, states) => log += `1: [${event}:${states.map(s=>s.name).join(',')}]`);
      registry.onStatesChanged((event, states) => log += `2: [${event}:${states.map(s=>s.name).join(',')}]`);
      registry.register({name: 'A2'});

      expect(log).toEqual("1: [registered:A2]2: [registered:A2]");

      log = "";
      registry.register({name: 'A3.B'});
      registry.register({name: 'A3'});
      expect(log).toEqual("1: [registered:A3,A3.B]2: [registered:A3,A3.B]");
    });

    it("should remove the callback when the deregister function is invoked", () => {
      let log = "";
      let deregister1fn = registry.onStatesChanged((event, states) => log += `1: [${event}:${states.map(s=>s.name).join(',')}]`);
      registry.onStatesChanged((event, states) => log += `2: [${event}:${states.map(s=>s.name).join(',')}]`);
      registry.register({name: 'A2'});

      expect(log).toEqual("1: [registered:A2]2: [registered:A2]");

      deregister1fn();

      log = "";
      registry.register({name: 'A3.B'});
      registry.register({name: 'A3'});
      expect(log).toEqual("2: [registered:A3,A3.B]");
    });

  });
});