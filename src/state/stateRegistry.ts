/** @module state */ /** for typedoc */

import {State} from "./stateObject";
import {StateMatcher} from "./stateMatcher";
import {StateBuilder} from "./stateBuilder";
import {StateQueueManager} from "./stateQueueManager";
import {UrlMatcherFactory} from "../url/urlMatcherFactory";
import {StateDeclaration} from "./interface";
import {BuilderFunction} from "./stateBuilder";
import {StateOrName} from "./interface";

export class StateRegistry {
  private _root: State;
  private states: { [key: string]: State } = {};

  matcher: StateMatcher;
  private builder: StateBuilder;
  stateQueue: StateQueueManager;

  constructor(urlMatcherFactory: UrlMatcherFactory, urlRouterProvider) {
    this.matcher = new StateMatcher(this.states);
    this.builder = new StateBuilder(this.matcher, urlMatcherFactory);
    this.stateQueue = new StateQueueManager(this.states, this.builder, urlRouterProvider);

    let rootStateDef: StateDeclaration = {
      name: '',
      url: '^',
      views: null,
      params: {
        '#': { value: null, type: 'hash' }
      },
      abstract: true
    };

    let _root = this._root = this.stateQueue.register(rootStateDef);
    _root.navigable = null;
  }

  root() {
    return this._root;
  }

  register(stateDefinition: StateDeclaration) {
    return this.stateQueue.register(stateDefinition);
  }

  get(): StateDeclaration[];
  get(stateOrName: StateOrName, base: StateOrName): StateDeclaration;
  get(stateOrName?: StateOrName, base?: StateOrName): any {
    if (arguments.length === 0) 
      return <StateDeclaration[]> Object.keys(this.states).map(name => this.states[name].self);
    let found = this.matcher.find(stateOrName, base);
    return found && found.self || null;
  }

  decorator(name: string, func: BuilderFunction) {
    return this.builder.builder(name, func);
  }
}