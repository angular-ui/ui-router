import Path from "./path";
import {IState} from "../state/interface";
import {objectKeys, zipObject, pick} from "../common/common";

// TODO: Refactor!
// TODO: this is better named ViewContext?
export default class PathContext {
  constructor(private _pathElement: PathElement, private _path: PathResolver, private _options: any, private _injector: ng.auto.IInjectorService) {
    
  }

  /** Invokes an annotated function in the context of the toPath */
  invoke(injectedFn, locals) {
    return this._pathElement.invokeLater(injectedFn, locals, this._path, this._options);
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
    injectMe.$inject = objectKeys(pick(this._pathElement.getResolvables(), this._injector.annotate(fn)));
    return this._pathElement.invokeLater(injectMe, {}, this._path, this._options);
  }
}
