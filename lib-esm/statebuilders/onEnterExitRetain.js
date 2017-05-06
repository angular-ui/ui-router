/** @module ng1 */ /** */
import { services, ResolveContext, extend } from "@uirouter/core";
import { getLocals } from "../services";
/**
 * This is a [[StateBuilder.builder]] function for angular1 `onEnter`, `onExit`,
 * `onRetain` callback hooks on a [[Ng1StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * ensures that those hooks are injectable for @uirouter/angularjs (ng1).
 */
export var getStateHookBuilder = function (hookName) {
    return function stateHookBuilder(state, parentFn) {
        var hook = state[hookName];
        var pathname = hookName === 'onExit' ? 'from' : 'to';
        function decoratedNg1Hook(trans, state) {
            var resolveContext = new ResolveContext(trans.treeChanges(pathname));
            var locals = extend(getLocals(resolveContext), { $state$: state, $transition$: trans });
            return services.$injector.invoke(hook, this, locals);
        }
        return hook ? decoratedNg1Hook : undefined;
    };
};
//# sourceMappingURL=onEnterExitRetain.js.map