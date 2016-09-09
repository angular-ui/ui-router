import { trace, UIRouter TransitionService, StateService } from "../../src/core";
import "../../src/justjs";
import {StateRegistry} from "../../src/state/stateRegistry";
import {services} from "../../src/common/coreservices";
import {UrlRouter} from "../../src/url/urlRouter";

describe('a Future State', function () {
  let router: UIRouter;
  let $registry: StateRegistry;
  let $transitions: TransitionService;
  let $state: StateService;
  let $urlRouter: UrlRouter;

  const wait = (val?) =>
      new Promise((resolve) => setTimeout(() => resolve(val)));

  beforeEach(() => {
    router = new UIRouter();
    $registry = router.stateRegistry;
    $state = router.stateService;
    $transitions = router.transitionService;
    $urlRouter = router.urlRouter;
    router.stateRegistry.stateQueue.autoFlush($state);
  });

  describe('which returns a successful promise', () => {
    let lazyStateDefA = { name: 'A', url: '/a/:id', params: {id: "default"} };
    let futureStateDef;

    beforeEach(() => {
      futureStateDef = {
        name: 'A', url: '/a',
        lazyLoad: () => new Promise(resolve => { resolve({ states: [lazyStateDefA] }); })
      };

      $registry.register(futureStateDef)
    });

    it('should deregister the placeholder (future state)', (done) => {
      expect($state.get().map(x=>x.name)).toEqual(["", "A"]);
      expect($state.get('A')).toBe(futureStateDef);
      expect($state.get('A').lazyLoad).toBeDefined();

      $state.go('A').then(() => {
        expect($state.get().map(x=>x.name)).toEqual(["", "A"]);
        expect($state.get('A')).toBe(lazyStateDefA);
        expect($state.get('A').lazyLoad).toBeUndefined();
        expect($state.current.name).toBe('A');
        done();
      })
    });

    it('should register newly loaded states returned in the `states: ` array', (done) => {
      expect($state.get('A')).toBe(futureStateDef);

      $state.go('A').then(() => {
        expect($state.get().map(x=>x.name)).toEqual(["", "A"]);
        expect($state.get('A')).toBe(lazyStateDefA);
        expect($state.get('A').lazyLoad).toBeUndefined();
        expect($state.current.name).toBe('A');
        done();
      })
    });

    it('should retry the original $state.go()', (done) => {
      $state.go('A', { id: 'abc' }).then(() => {
        expect($state.current.name).toBe('A');
        expect($state.params).toEqualValues({ id: 'abc' });
        done();
      })
    });

    it('triggered by a URL sync should re-parse the URL to activate the lazy loaded state', (done) => {
      services.location.setUrl('/a/def');
      $urlRouter.sync();
      $transitions.onSuccess({}, () => {
        expect($state.current.name).toBe('A');
        expect($state.params).toEqualValues({ id: 'def' });
        done();
      });
    });
  });

  describe('that resolves to multiple states', () => {
    let lazyStateDefA = { name: 'A', url: '/a/:id', params: {id: "default"} };
    let lazyStateDefAB = { name: 'A.B', url: '/b' };
    let futureStateDef;

    beforeEach(() => {
      futureStateDef = {
        name: 'A', url: '/a',
        lazyLoad: () => new Promise(resolve => { resolve({ states: [lazyStateDefA, lazyStateDefAB] }); })
      };
      $registry.register(futureStateDef)
    });

    it('should register all returned states and remove the placeholder', (done) => {
      expect($state.get().map(x=>x.name)).toEqual(["", "A"]);
      expect($state.get('A')).toBe(futureStateDef);
      expect($state.get('A').lazyLoad).toBeDefined();

      $state.go('A').then(() => {
        expect($state.get().map(x=>x.name)).toEqual(["", "A", "A.B"]);
        expect($state.get('A')).toBe(lazyStateDefA);
        expect($state.get('A').lazyLoad).toBeUndefined();
        expect($state.current.name).toBe('A');
        done();
      })
    });

    it('should allow transitions to non-loaded child states', (done) => {
      $state.go('A.B', { id: 'abc' }).then(() => {
        expect($state.current.name).toBe('A.B');
        expect($state.params).toEqualValues({ id: 'abc' });
        done();
      })
    });

    it('should re-parse the URL to activate the final state', (done) => {
      services.location.setUrl('/a/def/b');
      $urlRouter.sync();
      $transitions.onSuccess({}, () => {
        expect($state.current.name).toBe('A.B');
        expect($state.params).toEqualValues({ id: 'def' });
        done();
      });
    });
  });

  it('should not invoke lazyLoad twice', (done) => {
    $state.defaultErrorHandler(function() {});

    let count = 0;
    let futureStateDef = {
      name: 'A', url: '/a',
      lazyLoad: () => new Promise(resolve => {
        count++;
        setTimeout(() => resolve({ states: [{ name: 'A', url: '/a' }] }), 50);
      })
    };
    $registry.register(futureStateDef);

    $state.go('A');
    $state.go('A').then(() => {
      expect(count).toBe(1);
      expect($state.current.name).toBe('A');
      done();
    });
  });

  describe('that return a rejected promise', () => {
    let count, futureStateDef, errors;

    beforeEach(() => {
      errors = [];
      router.stateService.defaultErrorHandler(err => errors.push(err));
      count = 0;
      futureStateDef = {
        name: 'A', url: '/a',
        lazyLoad: () => new Promise((resolve, reject) => {
          if (count++ < 2) {
              reject("nope");
          } else {
              resolve({ states: [{ name: 'A', url: '/a' }] });
          }
        })
      };

      $registry.register(futureStateDef)
    });

    it('should not remove the placeholder', (done) => {
      expect($state.get('A')).toBe(futureStateDef);

      $state.go('A').catch(() => {
        expect(errors).toEqual(['nope']);
        expect($state.get('A')).toBe(futureStateDef);
        done();
      });
    });

    it('should allow lazy loading to be retried', (done) => {
      expect($state.get('A')).toBe(futureStateDef);

      $state.go('A').catch(() => {
        expect(errors).toEqual(['nope']);
        expect($state.get('A')).toBe(futureStateDef);
        expect(count).toBe(1);

        $state.go('A').catch(() => {
          expect(errors).toEqual(['nope', 'nope']);
          expect($state.get('A')).toBe(futureStateDef);
          expect(count).toBe(2);

          // this time it should lazy load
          $state.go('A').then(() => {
            expect(errors).toEqual(['nope', 'nope']);
            expect($state.get('A')).toBeTruthy();
            expect($state.get('A')).not.toBe(futureStateDef);
            expect(count).toBe(3);
            expect($state.current.name).toBe('A');

            done();
          })
        })
      })
    });

  });
});
