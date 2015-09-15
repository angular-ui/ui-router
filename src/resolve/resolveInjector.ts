import {map} from "../common/common";
import ResolveContext from "../resolve/resolveContext";
import {IState} from "../state/interface";
import Resolvable from "./resolvable";

export default class ResolveInjector {
  constructor(private _resolveContext: ResolveContext, private _state: IState) { }

  /** Returns a promise to invoke an annotated function in the resolve context */
  invokeLater(injectedFn, locals) {
    return this._resolveContext.invokeLater(this._state, injectedFn, locals);
  }

  /** Invokes an annotated function in the resolve context */
  invokeNow(injectedFn, locals) {
    return this._resolveContext.invokeNow(this._state, injectedFn, locals);
  }

  /** Returns the a promise for locals (realized Resolvables) that a function wants */
  getLocals(injectedFn) {
    const resolve = (r: Resolvable) => r.get(this._resolveContext);
    return map(this._resolveContext.getResolvablesForFn(injectedFn), resolve);
  }
}
