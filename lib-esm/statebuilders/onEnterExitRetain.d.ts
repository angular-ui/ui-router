/** @module ng1 */ /** */
import { StateObject, TransitionStateHookFn, BuilderFunction } from "@uirouter/core";
/**
 * This is a [[StateBuilder.builder]] function for angular1 `onEnter`, `onExit`,
 * `onRetain` callback hooks on a [[Ng1StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * ensures that those hooks are injectable for @uirouter/angularjs (ng1).
 */
export declare const getStateHookBuilder: (hookName: "onEnter" | "onExit" | "onRetain") => (state: StateObject, parentFn: BuilderFunction) => TransitionStateHookFn;
