import { UIRouter
    TransitionService,
    StateService,
} from "../../src/core";
import "../../src/justjs";
import {tree2Array} from "../testUtils.ts";
import {TransitionOptions} from "../../src/transition/interface";
import {LocationServices, services} from "../../src/common/coreservices";

describe('stateService', function () {
  let router: UIRouter;
  let $transitions: TransitionService;
  let $state: StateService;
  let $loc: LocationServices;

  const wait = (val?) =>
      new Promise((resolve) => setTimeout(() => resolve(val)));

  beforeEach(() => {
    router = new UIRouter();
    $loc = services.location;
    $state = router.stateService;
    $transitions = router.transitionService;
    router.stateRegistry.stateQueue.autoFlush($state);

    var stateTree = {
      first: {},
      second: {},
      third: {},
      A: {
        url: '/a',
        B: {
          url: '/b',
          C: {
            url: '/c',
            D: {
              url: '/d'
            }
          }
        }
      }
    };

    let states = tree2Array(stateTree, false);
    states.forEach(state => router.stateRegistry.register(state));
  });

  describe('transitionTo', () => {

    it("should handle redirects", ((done) => {
      $transitions.onStart({ to: 'D'}, trans => (log.push('redirect'), trans.router.stateService.target('C')));
      $transitions.onStart({ to: 'C'}, trans => { cOpts = trans.options(); });

      var log = [], transition = $state.go("D").transition;
      var cOpts: TransitionOptions = {};

      wait().then(() => {
        expect(log).toEqual(['redirect']);
        expect(cOpts.redirectedFrom).toBe(transition);
        expect(cOpts.source).toBe("redirect");
      })
      .then(done, done);
    }));

    it("should not update the URL in response to synchronizing URL", ((done) => {
      $loc.url('/a/b/c');
      spyOn($loc, 'url').and.callThrough();
      router.urlRouter.sync();

      wait().then(() => {
        expect($state.current.name).toBe('C');
        let pushedUrls = $loc.url.calls.all().map(x => x.args[0]).filter(x => x !== undefined);
        expect(pushedUrls).toEqual([]);
        expect($loc.path()).toBe('/a/b/c');
        done();
      })
    }));

    it("should update the URL in response to synchronizing URL then redirecting", ((done) => {
      $transitions.onStart({ to: 'C' }, () => $state.target('D'));

      $loc.url('/a/b/c');
      spyOn($loc, 'url').and.callThrough();
      router.urlRouter.sync();

      wait().then(() => {
        expect($state.current.name).toBe('D');
        let pushedUrls = $loc.url.calls.all().map(x => x.args[0]).filter(x => x !== undefined);
        expect(pushedUrls).toEqual(['/a/b/c/d']);
        expect($loc.path()).toBe('/a/b/c/d');
        done();
      })
    }));
  });
});