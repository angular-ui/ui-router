import ResolveContext from "../resolve/resolveContext";
import {IState} from "../state/interface";

export default class ResolveInjector {
  constructor(private _resolveContext: ResolveContext, private _state: IState) { }
  /** Invokes an annotated function in the context of the toPath */
  invokeLater(injectedFn, locals) {
    return this._resolveContext.invokeLater(this._state, injectedFn, locals);
  }
  invokeNow(injectedFn, locals) {
    return this._resolveContext.invokeNow(this._state, injectedFn, locals);
  }
}
