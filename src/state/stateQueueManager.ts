/** @module state */ /** for typedoc */
import {extend, inherit, pluck, equalForKeys} from "../common/common";
import {isString} from "../common/predicates";
import {StateDeclaration} from "./interface";
import {State} from "./stateObject";
import {StateBuilder} from "./stateBuilder";
import {StateService} from "./stateService";
import {UrlRouterProvider} from "../url/urlRouter";
import {RawParams} from "../params/interface";

export class StateQueueManager {
  queue: State[];
  private $state: StateService;

  constructor(
      public states: { [key: string]: State; },
      public builder: StateBuilder,
      public $urlRouterProvider: UrlRouterProvider) {
    this.queue = [];
  }

  register(config: StateDeclaration) {
    let {states, queue, $state} = this;
    // Wrap a new object around the state so we can store our private details easily.
    // @TODO: state = new State(extend({}, config, { ... }))
    let state = inherit(new State(), extend({}, config, {
      self: config,
      resolve: config.resolve || [],
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

  flush($state: StateService) {
    let {queue, states, builder} = this;
    let result: State, state: State, orphans: State[] = [], orphanIdx: number,
        previousQueueLength = {};

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
        // throw new Error(`Cannot register orphaned state '${state.name}'`);
        return states;
      } else if (orphanIdx < 0) {
        orphans.push(state);
      }

      queue.push(state);
    }
    return states;
  }

  autoFlush($state: StateService) {
    this.$state = $state;
    this.flush($state);
  }

  attachRoute($state: StateService, state: State) {
    let {$urlRouterProvider} = this;
    if (state.abstract || !state.url) return;

    $urlRouterProvider.when(state.url, ['$match', '$stateParams', function ($match: RawParams, $stateParams: RawParams) {
      if ($state.$current.navigable !== state || !equalForKeys($match, $stateParams)) {
        $state.transitionTo(state, $match, { inherit: true, location: false });
      }
    }]);
  }
}
