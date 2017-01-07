/** @module ng1 */ /** */
import {
    State, TransitionStateHookFn, HookResult, Transition, services, ResolveContext, extend, BuilderFunction
} from "ui-router-core";
import { getLocals } from "../services";

/**
 * This is a [[StateBuilder.builder]] function for angular1 `onEnter`, `onExit`,
 * `onRetain` callback hooks on a [[Ng1StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * ensures that those hooks are injectable for angular-ui-router (ng1).
 */
export const getStateHookBuilder = (hookName: "onEnter"|"onExit"|"onRetain") =>
function stateHookBuilder(state: State, parentFn: BuilderFunction): TransitionStateHookFn {
  let hook = state[hookName];
  let pathname = hookName === 'onExit' ? 'from' : 'to';

  function decoratedNg1Hook(trans: Transition, state: State): HookResult {
    let resolveContext = new ResolveContext(trans.treeChanges(pathname));
    let locals = extend(getLocals(resolveContext), { $state$: state, $transition$: trans });
    return services.$injector.invoke(hook, this, locals);
  }

  return hook ? decoratedNg1Hook : undefined;
};
