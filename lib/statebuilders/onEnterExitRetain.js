"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module ng1 */ /** */
var core_1 = require("@uirouter/core");
var services_1 = require("../services");
/**
 * This is a [[StateBuilder.builder]] function for angular1 `onEnter`, `onExit`,
 * `onRetain` callback hooks on a [[Ng1StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * ensures that those hooks are injectable for @uirouter/angularjs (ng1).
 */
exports.getStateHookBuilder = function (hookName) {
    return function stateHookBuilder(state, parentFn) {
        var hook = state[hookName];
        var pathname = hookName === 'onExit' ? 'from' : 'to';
        function decoratedNg1Hook(trans, state) {
            var resolveContext = new core_1.ResolveContext(trans.treeChanges(pathname));
            var locals = core_1.extend(services_1.getLocals(resolveContext), { $state$: state, $transition$: trans });
            return core_1.services.$injector.invoke(hook, this, locals);
        }
        return hook ? decoratedNg1Hook : undefined;
    };
};
//# sourceMappingURL=onEnterExitRetain.js.map