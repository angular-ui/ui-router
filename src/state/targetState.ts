/** @module state */ /** for typedoc */

import {StateDeclaration, StateOrName} from "./interface";
import {ParamsOrArray} from "../params/interface";
import {TransitionOptions} from "../transition/interface";

import {State} from "./module";

/**
 * @ngdoc object
 * @name ui.router.state.type:TargetState
 *
 * @description
 * Encapsulate the desired target of a transition.
 * Wraps an identifier for a state, a set of parameters, and transition options with the definition of the state.
 *
 * @param {StateOrName} _identifier  An identifier for a state. Either a fully-qualified path, or the object
 *            used to define the state.
 * @param {IState} _definition The `State` object definition.
 * @param {ParamsOrArray} _params Parameters for the target state
 * @param {TransitionOptions} _options Transition options.
 */
export class TargetState {
  private _params: ParamsOrArray;

  constructor(
    private _identifier: StateOrName,
    private _definition?: State,
    _params: ParamsOrArray = {},
    private _options: TransitionOptions = {}
  ) {
    this._params = _params || {};
  }

  name() {
    return this._definition && this._definition.name || this._identifier;
  }

  identifier(): StateOrName {
    return this._identifier;
  }

  params(): ParamsOrArray {
    return this._params;
  }

  $state(): State {
    return this._definition;
  }

  state(): StateDeclaration {
    return this._definition && this._definition.self;
  }

  options() {
    return this._options;
  }

  exists(): boolean {
    return !!(this._definition && this._definition.self);
  }

  valid(): boolean {
    return !this.error();
  }

  error(): string {
    let base = <any> this.options().relative;
    if (!this._definition && !!base) {
      let stateName = base.name ? base.name : base;
      return `Could not resolve '${this.name()}' from state '${stateName}'`;
    }
    if (!this._definition)
      return `No such state '${this.name()}'`;
    if (!this._definition.self)
      return `State '${this.name()}' has an invalid definition`;
  }
}
