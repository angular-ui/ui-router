/** @module state */ /** for typedoc */
import {extend, inherit, pluck, equalForKeys, abstractKey} from "../common/common";
import {isString} from "../common/predicates";
import {StateDeclaration} from "./interface";
import {State} from "./module";
import {StateBuilder} from "./stateBuilder";
import {StateService} from "./stateService";

export class StateQueueManager {
  queue: State[];
  private $state: StateService;

  constructor(
      public states: { [key: string]: State; },
      public builder: StateBuilder,
      public $urlRouterProvider) {
    this.queue = [];
  }

  register(config: StateDeclaration) {
    let {states, queue, $state} = this;
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

    queue.push(state);

    if (this.$state) {
      this.flush($state);
    }
    return state;
  }

  flush($state) {
    let {queue, states, builder} = this;
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
  }

  autoFlush($state) {
    this.$state = $state;
    this.flush($state);
  }

  attachRoute($state, state) {
    let {$urlRouterProvider} = this;
    if (state[abstractKey] || !state.url) return;

    $urlRouterProvider.when(state.url, ['$match', '$stateParams', function ($match, $stateParams) {
      if ($state.$current.navigable !== state || !equalForKeys($match, $stateParams)) {
        $state.transitionTo(state, $match, { inherit: true });
      }
    }]);
  }
}
