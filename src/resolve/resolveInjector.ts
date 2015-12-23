/** @module path */ /** for typedoc */
import {map} from "../common/common";

import {Resolvable} from "./resolvable";
import {ResolveContext} from "./resolveContext";
import {State} from "../state/module";

export class ResolveInjector {
  constructor(private _resolveContext: ResolveContext, private _state: State) { }

  /** Returns a promise to invoke an annotated function in the resolve context */
  invokeLater(injectedFn, locals) {
    return this._resolveContext.invokeLater(injectedFn, locals);
  }

  /** Invokes an annotated function in the resolve context */
  invokeNow(injectedFn, locals) {
    return this._resolveContext.invokeNow(null, injectedFn, locals);
  }

  /** Returns the a promise for locals (realized Resolvables) that a function wants */
  getLocals(injectedFn) {
    const resolve = (r: Resolvable) => r.get(this._resolveContext);
    return map(this._resolveContext.getResolvablesForFn(injectedFn), resolve);
  }
}
