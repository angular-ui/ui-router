import {abstractKey} from "../common/common";
import {IState, IStateDeclaration, IStateOrName} from "./interface";
import {IRawParams} from "../params/interface"

/**
 * @ngdoc object
 * @name ui.router.state.type:StateReference
 *
 * @description
 * Wraps a state and a set of parameters with the value used to identify the state. Allows states
 * to be referenced in a consistent way in application code, separate from state definitions.
 *
 * @param {*} identifier  An identifier for a state. Either a fully-qualified path, or the object
 *            used to define the state.
 * @param {State} definition The `State` object definition.
 * @param {Object} params Parameters attached to the current state reference.
 * @param {Object} params Parameters attached to the current state reference.
 * @param {Object} base Optional. Base state used during lookup of state definition by identifier.
 *
 * @returns {Function}
 */
export default class StateReference {
  constructor(private _identifier: IStateOrName, private _definition?: IState, private _params?: IRawParams, private _base?) { }

  name() {
    return this._definition && this._definition.name || this._identifier;
  }

  identifier(): IStateOrName {
    return this._identifier;
  }

  $state(): IState {
    return this._definition;
  }

  state(): IStateDeclaration {
    return this._definition && this._definition.self;
  }

  params(): IRawParams
  params(newParams: IRawParams): StateReference
  params(newParams?): any {
    if (newParams)
      return new StateReference(this._identifier, this._definition, newParams, this._base);
    return this._params;
  }

  base() {
    return this._base;
  }

  exists(): boolean {
    return !!(this._definition && this._definition.self);
  }

  valid(): boolean {
    var def = this._definition;
    return !!(this.exists() && !def.self[abstractKey] && def.params.$$validates(this._params));
  }

  error(): string {
      if (!this._definition && !!this._base)
        return `Could not resolve '${this.name()}' from state '${this._base}'`;
      if (!this._definition)
        return `No such state '${this.name()}'`;
      if (!this._definition.self)
        return `State '${this.name()}' has an invalid definition`;
      if (this._definition.self[abstractKey])
        return `Cannot transition to abstract state '${this.name()}'`;
      if (!this._definition.params.$$validates(this._params))
        return `Param values not valid for state '${this.name()}'`;
  }
}
