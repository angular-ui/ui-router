/** @module ng1 */ /** */
import {
  StateObject,
  TransitionStateHookFn,
  HookResult,
  Transition,
  services,
  ResolveContext,
  extend,
  BuilderFunction,
} from '@uirouter/core';
import { getLocals } from '../services';
import { Ng1StateDeclaration } from '../interface';

/**
 * This is a [[StateBuilder.builder]] function for angular1 `onEnter`, `onExit`,
 * `onRetain` callback hooks on a [[Ng1StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * ensures that those hooks are injectable for @uirouter/angularjs (ng1).
 */
export const getStateHookBuilder = (hookName: 'onEnter' | 'onExit' | 'onRetain') =>
  function stateHookBuilder(stateObject: StateObject, parentFn: BuilderFunction): TransitionStateHookFn {
    const hook = stateObject[hookName];
    const pathname = hookName === 'onExit' ? 'from' : 'to';

    function decoratedNg1Hook(trans: Transition, state: Ng1StateDeclaration): HookResult {
      const resolveContext = new ResolveContext(trans.treeChanges(pathname));
      const subContext = resolveContext.subContext(state.$$state());
      const locals = extend(getLocals(subContext), { $state$: state, $transition$: trans });
      return services.$injector.invoke(hook, this, locals);
    }

    return hook ? decoratedNg1Hook : undefined;
  };
