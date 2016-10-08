/** @module ng1 */ /** */
import {State} from "ui-router-core";
import {TransitionStateHookFn, HookResult} from "ui-router-core";
import {Transition} from "ui-router-core";
import {services} from "ui-router-core";
import {getLocals} from "../services";
import {ResolveContext} from "ui-router-core";
import {extend} from "ui-router-core";
import {BuilderFunction} from "ui-router-core";

import * as angular from 'angular';
import IInjectorService = angular.auto.IInjectorService;

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
  function decoratedNg1Hook(trans: Transition, state: State): HookResult {
    let resolveContext = new ResolveContext(trans.treeChanges().to);
    return services.$injector.invoke(hook, this, extend({ $state$: state }, getLocals(resolveContext)));
  }

  return hook ? decoratedNg1Hook : undefined;
};
