
import {UIRouter} from "../../src/router";
import {tree2Array} from "../stateHelper.ts";
import {find} from "../../src/common/common";


let statetree = {
  A: {
    AA: {
      AAA:  {
        url: "/:fooId", params: { fooId: "" }
      }
    }
  }
};

describe("hooks", () => {
  let router, $state, states, init;
  beforeEach(() => {
    router = new UIRouter();
    $state = router.stateService;
    states = tree2Array(statetree, false);
    init = () => {
      states.forEach(state => router.stateRegistry.register(state));
      router.stateRegistry.stateQueue.autoFlush($state);
    }
  })

  describe('redirectTo:', () => {
    it("should redirect to a state by name from the redirectTo: string", (done) => {
      find(states, s => s.name === 'A').redirectTo = "AAA";
      init();

      $state.go('A').then(() => {
        expect(router.globals.current.name).toBe('AAA')
        done()
      })
    })

    it("should redirect to a state by name from the redirectTo: object", (done) => {
      find(states, s => s.name === 'A').redirectTo = { state: "AAA" }
      init();

      $state.go('A').then(() => {
        expect(router.globals.current.name).toBe('AAA')
        done()
      })
    })

    it("should redirect to a state and params by name from the redirectTo: object", (done) => {
      find(states, s => s.name === 'A').redirectTo = { state: "AAA", params: { fooId: 'abc'} };
      init();

      $state.go('A').then(() => {
        expect(router.globals.current.name).toBe('AAA')
        expect(router.globals.params.fooId).toBe('abc')
        done()
      })
    })

    it("should redirect to a TargetState returned from the redirectTo: function", (done) => {
      find(states, s => s.name === 'A').redirectTo =
          () => $state.target("AAA");
      init();

      $state.go('A').then(() => {
        expect(router.globals.current.name).toBe('AAA')
        done()
      })
    })

    it("should redirect after waiting for a promise for a state name returned from the redirectTo: function", (done) => {
      find(states, s => s.name === 'A').redirectTo = () => new Promise((resolve) => {
        setTimeout(() => resolve("AAA"), 50)
      });
      init();

      $state.go('A').then(() => {
        expect(router.globals.current.name).toBe('AAA');
        done()
      })
    })

    it("should redirect after waiting for a promise for a {state, params} returned from the redirectTo: function", (done) => {
      find(states, s => s.name === 'A').redirectTo = () => new Promise((resolve) => {
        setTimeout(() => resolve({ state: "AAA", params: { fooId: "FOO" } }), 50)
      });
      init();

      $state.go('A').then(() => {
        expect(router.globals.current.name).toBe('AAA');
        expect(router.globals.params.fooId).toBe('FOO');
        done()
      })
    })

    it("should redirect after waiting for a promise for a TargetState returned from the redirectTo: function", (done) => {
      find(states, s => s.name === 'A').redirectTo = () => new Promise((resolve) => {
        setTimeout(() => resolve($state.target("AAA")), 50)
      });
      init();

      $state.go('A').then(() => {
        expect(router.globals.current.name).toBe('AAA');
        done()
      })
    })

    it("should not redirect if the redirectTo: function returns something other than a string, { state, params}, TargetState (or promise for)", (done) => {
      find(states, s => s.name === 'A').redirectTo = () => new Promise((resolve) => {
        setTimeout(() => resolve(12345), 50)
      });
      init();

      $state.go('A').then(() => {
        expect(router.globals.current.name).toBe('A');
        done()
      })
    })
  })

});