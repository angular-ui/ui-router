import {extend, inherit, isString, pluck, equalForKeys, abstractKey} from "../common/common";
import {IStateDeclaration} from "./interface";
import {State} from "./state";

export function StateQueueManager(states, builder, $urlRouterProvider, $state) {
  let queue = [];

  let queueManager = extend(this, {
    register: function(config: IStateDeclaration, pre?: boolean) {
      // Wrap a new object around the state so we can store our private details easily.
      // @TODO: state = new State(extend({}, config, { ... }))
      let state = inherit(new State(), extend({}, config, {
        self: config,
        resolve: config.resolve || {},
        toString: () => config.name
      }));

      if (!isString(state.name)) throw new Error("State must have a valid name");
      if (states.hasOwnProperty(state.name) || pluck(queue, 'name').indexOf(state.name) !== -1)
        throw new Error(`State '${state.name}' is already defined`);

      queue[pre ? "unshift" : "push"](state);

      if (queueManager.autoFlush) {
        queueManager.flush($state);
      }
      return state;
    },

    flush: function($state) {
      let result, state, orphans = [], orphanIdx, previousQueueLength = {};

      while (queue.length > 0) {
        state = queue.shift();
        result = builder.build(state);
        orphanIdx = orphans.indexOf(state);

        if (result) {
          if (states.hasOwnProperty(state.name))
            throw new Error(`State '${name}' is already defined`);
          states[state.name] = state;
          this.attachRoute($state, state);
          if (orphanIdx >= 0) orphans.splice(orphanIdx, 1);
          continue;
        }

        let prev = previousQueueLength[state.name];
        previousQueueLength[state.name] = queue.length;
        if (orphanIdx >= 0 && prev === queue.length) {
          // Wait until two consecutive iterations where no additional states were dequeued successfully.
          throw new Error(`Cannot register orphaned state '${state.name}'`);
        } else if (orphanIdx < 0) {
          orphans.push(state);
        }

        queue.push(state);
      }
      return states;
    },

    autoFlush: false,

    attachRoute: function($state, state) {
      if (state[abstractKey] || !state.url) return;

      $urlRouterProvider.when(state.url, ['$match', '$stateParams', function ($match, $stateParams) {
        if ($state.$current.navigable !== state || !equalForKeys($match, $stateParams)) {
          $state.transitionTo(state, $match, { inherit: true, location: false });
        }
      }]);
    }
  });
}
