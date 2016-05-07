import {
    UIRouter, TransitionService, StateService, State, Node, tail, PathFactory
} from "../../src/core";

import {tree2Array} from "../stateHelper.ts";
import "../../src/justjs";

describe('HookBuilder:', function() {
  let uiRouter: UIRouter = null;
  let $trans: TransitionService = null;
  let $state: StateService = null;
  let root: State = null;

  let log = "";
  let hookNames = [ "onBefore", "onStart", "onExit", "onRetain", "onEnter", "onFinish", "onSuccess", "onError" ];
  const hook = (name) => () => log += `${name};`;

  beforeEach(() => {
    log = "";
    uiRouter = new UIRouter();
    $trans = uiRouter.transitionService;
    $state = uiRouter.stateService;
    root = uiRouter.stateRegistry.root();

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

    tree2Array(statetree, true).forEach(state => uiRouter.stateRegistry.register(state));
    uiRouter.stateRegistry.stateQueue.autoFlush($state);
  });

  let trans, trans2, hb, hb2, callback;
  beforeEach(function() {
    // Clean out the default UiRouter onBefore hooks
    uiRouter.transitionService.getHooks("onBefore").length = 0;

    // Transition from 'A' to 'A.B.C'
    let A = $state.target('A', null).$state();
    let path = [new Node(root), new Node(A)];
    path = PathFactory.bindTransNodesToPath(path);
    trans = $trans.create(path, $state.target("A.B.C", null));
    hb = trans.hookBuilder();
    expect(hb.getOnBeforeHooks().length).toBe(0);

    // Transition from 'A.B.C' to 'A'
    let A = $state.target('A', null).$state();
    let B = $state.target('A.B', null).$state();
    let C = $state.target('A.B.C', null).$state();
    let fromPath = [new Node(root), new Node(A), new Node(B), new Node(C)];
    fromPath = PathFactory.bindTransNodesToPath(fromPath);
    trans2 = $trans.create(fromPath, $state.target("A", null));
    hb2 = trans2.hookBuilder();

    callback = hook('hook');
    expect(typeof callback).toBe('function')
  });

  const getFn = x => x['fn'];

  describe('HookMatchCriteria', function() {

    describe('.to', function() {
      it("should match a transition with same to state", function() {
        trans.onBefore({to: "A.B.C"}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([callback]);
      });

      it("should not match a transition with a different to state", function() {
        trans.onBefore({to: "A.B"}, callback);
        trans.onBefore({to: "A.B.C.D"}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([]);
      });

      it("should match a transition using a glob", function() {
        trans.onBefore({to: "A.B.*"}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([callback]);
      });

      it("should match a transition using a function", function() {
        let deregister = trans.onBefore({to: (state) => state.name === 'A.B'}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([]);

        trans.onBefore({to: (state) => state.name === 'A.B.C'}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([callback]);
      });
    });


    describe('.from', function() {
      it("should match a transition with same from state", function() {
        trans.onBefore({from: "A"}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([callback]);
      });

      it("should not match a transition with a different from state", function() {
        trans.onBefore({from: "A.B"}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([]);
      });

      it("should match a transition using a function", function() {
        let deregister = trans.onBefore({from: (state) => state.name === 'A.B'}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([]);

        trans.onBefore({from: (state) => state.name === 'A'}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([callback]);
      });
    });


    describe('.to and .from', function() {
      it("should match a transition with same to and from state", function() {
        trans.onBefore({from: "A", to: "A.B.C"}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([callback]);
      });

      it("should not match a transition with a different to or from state", function() {
        trans.onBefore({from: "A", to: "A.B.C.D"}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([]);
      });
    });


    describe('.entering', function() {
      it("should match a transition that will enter the 'entering' state", function() {
        trans.onBefore({entering: "A.B.C"}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([callback]);
      });
    });


    describe('.retained', function() {
      it("should match a transition where the state is already entered, and will not exit", function() {
        trans.onBefore({retained: "A"}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([callback]);
      });

      it("should not match a transition that will not retain the state", function() {
        trans.onBefore({retained: "A.B"}, callback);
        expect(hb.getOnBeforeHooks().map(getFn)).toEqual([]);
      });
    });


    describe('.exiting', function() {
      it("should match a transition that will exit the 'exiting' state", function() {
        trans2.onBefore({exiting: "A.B.C"}, callback);
        expect(hb2.getOnBeforeHooks().map(getFn)).toEqual([callback]);
      });
    });
  });

  describe('built TransitionHooks', function() {
    describe('should be bound to the correct context', function() {
      const context = hook =>
          tail(hook.resolveContext['_path']).state.name;

      it('; onBefore should be bound to the to state', function() {
        trans.onBefore({}, callback);
        expect(hb.getOnBeforeHooks().map(context)).toEqual(["A.B.C"]);
      });

      it('; onStart should be bound to the to state', function() {
        trans.onStart({}, callback);
        expect(hb.getOnStartHooks().map(context)).toEqual(["A.B.C"]);
      });

      it('; onEnter should be bound to the entering state(s)', function() {
        trans.onEnter({}, callback);
        expect(hb.getOnEnterHooks().map(context)).toEqual(["A.B", "A.B.C"]);
      });

      it('; onRetain should be bound to the retained state(s)', function() {
        trans.onRetain({}, callback);
        expect(hb.getOnRetainHooks().map(context)).toEqual(["", "A"]);
      });

      it('; onRetain should be bound to the retained state(s)', function() {
        trans.onRetain({}, callback);
        expect(hb.getOnRetainHooks().map(context)).toEqual(["", "A"]);
      });

      it('; onExit should be bound to the exiting state(s)', function() {
        trans2.onExit({}, callback);
        expect(hb2.getOnExitHooks().map(context)).toEqual(["A.B.C", "A.B"]);
      });

      it('; onFinish should be bound to the to state', function() {
        trans.onFinish({}, callback);
        expect(hb.getOnFinishHooks().map(context)).toEqual(["A.B.C"]);
      });

      it('; onSuccess should be bound to the to state', function() {
        trans.onSuccess({}, callback);
        expect(hb.getOnSuccessHooks().map(context)).toEqual(["A.B.C"]);
      });

      it('; onError should be bound to the to state', function() {
        trans.onStart({}, () => { throw new Error('shuckydarn') });
        trans.onError({}, callback);
        expect(hb.getOnErrorHooks().map(context)).toEqual(["A.B.C"]);
      });

    });
  });
});
