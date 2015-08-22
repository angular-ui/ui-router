import ResolveContext from "../resolve/resolveContext"
import Path from "./../path/path";
import {IState} from "../state/interface";
import {objectKeys, zipObject, pick} from "../common/common";

// TODO: Refactor!
// TODO: this is better named ViewContext?
export default class PathContext {
  constructor(private _resolveContext: ResolveContext, 
    private _state: IState, 
    private _injector: ng.auto.IInjectorService, 
    private _options = {}) { }

  /** Invokes an annotated function in the context of the toPath */
  invoke(injectedFn, locals) {
    return this._resolveContext.invokeLater(this._state, injectedFn, locals, this._options);
  }

  /**
   * For the fn passed in, resolves any Resolvable dependencies within the transition toPath context
   * @returns a $q promise for the resolved data by name
   */
  getLocalsFor(fn) {
    var injectMe = function injectMe() {
      var args = Array.prototype.slice.call(arguments);
      return zipObject(injectMe.$inject, args);
    };
    injectMe.$inject = objectKeys(pick(this._resolveContext.getResolvables(this._state), this._injector.annotate(fn)));
    return this._resolveContext.invokeLater(this._state, injectMe, {}, this._options);
  }
}
