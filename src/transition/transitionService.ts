/// <reference path='../../typings/angularjs/angular.d.ts' />

import {IServiceProviderFactory} from "angular";

import {Transition} from "./transition";

import TargetState from "../state/targetState";

import {ITransPath} from "../path/interface";

import {IHookRegistry, ITransitionService, ITransitionOptions, IHookRegistration, IHookGetter} from "./interface";

import {HookRegistry} from "./hookRegistry";

/**
 * The default transition options.
 * Include this object when applying custom defaults:
 * let reloadOpts = { reload: true, notify: true }
 * let options = defaults(theirOpts, customDefaults, defaultOptions);
 */
export let defaultTransOpts: ITransitionOptions = {
  location    : true,
  relative    : null,
  inherit     : false,
  notify      : true,
  reload      : false,
  trace       : false,
  custom      : {},
  current     : () => null
};

class TransitionService implements IHookRegistry {
  constructor() {
    this._reinit();
  }

  onBefore  : IHookRegistration;
  onStart   : IHookRegistration;
  onEnter   : IHookRegistration;
  onExit    : IHookRegistration;
  onSuccess : IHookRegistration;
  onError   : IHookRegistration;
  getHooks  : IHookGetter;
  
  private _reinit() {
    HookRegistry.mixin(new HookRegistry(), this);
  }

  create(fromPath: ITransPath, targetState: TargetState) {
    return new Transition(fromPath, targetState);
  }
}


let $transitions: ITransitionService = new TransitionService();

$TransitionProvider.prototype = $transitions;
function $TransitionProvider() {
  this._reinit.bind($transitions)();

  /**
   * @ngdoc service
   * @name ui.router.state.$transitions
   *
   * @description
   * The `$transitions` service is a registry for global transition hooks, and is a factory for Transition objects.
   */
  this.$get = function $get() {
    return $transitions;
  };
}

export default $transitions;
export let $transitionsProvider = $TransitionProvider;
angular.module('ui.router.state')
  .provider('$transitions', <IServiceProviderFactory> $transitionsProvider);