/** @module transition */ /** for typedoc */
/// <reference path='../../typings/angularjs/angular.d.ts' />

import {IServiceProviderFactory} from "angular";

import {Transition} from "./transition";

import {TargetState} from "../state/targetState";

import {Node} from "../path/node";

import {IHookRegistry, ITransitionService, TransitionOptions, IHookRegistration, IHookGetter} from "./interface";

import {HookRegistry} from "./hookRegistry";

/**
 * The default transition options.
 * Include this object when applying custom defaults:
 * let reloadOpts = { reload: true, notify: true }
 * let options = defaults(theirOpts, customDefaults, defaultOptions);
 */
export let defaultTransOpts: TransitionOptions = {
  location    : true,
  relative    : null,
  inherit     : false,
  notify      : true,
  reload      : false,
  custom      : {},
  current     : () => null
};

class TransitionService implements ITransitionService, IHookRegistry {
  constructor() {
    this._reinit();
  }

  onBefore  : IHookRegistration;
  onStart   : IHookRegistration;
  onEnter   : IHookRegistration;
  onRetain  : IHookRegistration;
  onExit    : IHookRegistration;
  onFinish  : IHookRegistration;
  onSuccess : IHookRegistration;
  onError   : IHookRegistration;

  getHooks  : IHookGetter;

  private _defaultErrorHandler: ((_error) => void) = function $defaultErrorHandler($error$) {
    if ($error$ instanceof Error) console.log($error$);
  };

  defaultErrorHandler(handler: (error) => void) {
    if (arguments.length)
      this._defaultErrorHandler = handler;
    return this._defaultErrorHandler;
  }

  private _reinit() {
    HookRegistry.mixin(new HookRegistry(), this);
  }

  create(fromPath: Node[], targetState: TargetState) {
    return new Transition(fromPath, targetState);
  }
}


export let $transitions = new TransitionService();

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

export let $transitionsProvider = $TransitionProvider;
angular.module('ui.router.state')
  .provider('$transitions', <IServiceProviderFactory> $transitionsProvider);