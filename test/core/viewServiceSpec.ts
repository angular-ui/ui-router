/// <reference path='../../node_modules/@types/jasmine/index.d.ts' />

import {UIRouter} from "../../src/router";
import {tree2Array} from "../testUtils.ts";
import {StateRegistry} from "../../src/state/stateRegistry";
import {ViewService} from "../../src/view/view";
import {ActiveUIView} from "../../src/view/interface";

let router: UIRouter = null;
let registry: StateRegistry = null;
let $view: ViewService = null;
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

let count = 0;
const makeUIView = (): ActiveUIView => ({
  $type: 'test',
  id: count++,
  name: '$default',
  fqn: '$default',
  config: null,
  creationContext: null,
  configUpdated: function() {}
});

describe("View Service", () => {
  beforeEach(() => {
    router = new UIRouter();
    registry = router.stateRegistry;
    $view = router.viewService;
    tree2Array(statetree, true).forEach(state => registry.register(state));
    registry.stateQueue.autoFlush(router.stateService);
  });

  describe('registerUIView', () => {
    it("should track a ui-view", () => {
      expect($view.available().length).toBe(0);
      $view.registerUIView(makeUIView());
      expect($view.available().length).toBe(1);
    });

    it("should return a deregistration function", () => {
      expect($view.available().length).toBe(0);
      let deregistrationFn = $view.registerUIView(makeUIView());
      expect(typeof deregistrationFn).toBe('function');
      expect($view.available().length).toBe(1);
      deregistrationFn();
      expect($view.available().length).toBe(0);
    });
  });
});