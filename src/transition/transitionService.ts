/** @module transition */ /** for typedoc */
import {IHookRegistry, ITransitionService, TransitionOptions, IHookRegistration} from "./interface";

import {Transition} from "./transition";
import {HookRegistry} from "./hookRegistry";
import {TargetState} from "../state/module";
import {Node} from "../path/module";
import {IEventHook} from "./interface";
import {ViewService} from "../view/view";

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

/**
 * This class provides services related to Transitions.
 *
 * Most importantly, it allows global Transition Hooks to be registered, and has a factory function
 * for creating new Transitions.
 */
export class TransitionService implements ITransitionService, IHookRegistry {
  constructor(public $view: ViewService) {
    HookRegistry.mixin(new HookRegistry(), this);
  }

  /**
   * Registers a callback function as an `onBefore` Transition Hook
   *
   * See [[IHookRegistry.onBefore]]
   */
  onBefore  : IHookRegistration;
  /**
   * Registers a callback function as an `onStart` Transition Hook
   *
   * See [[IHookRegistry.onStart]]
   */
  onStart   : IHookRegistration;
  /**
   * Registers a callback function as an `onEnter` Transition Hook
   *
   * See [[IHookRegistry.onEnter]]
   */
  onEnter   : IHookRegistration;
  /**
   * Registers a callback function as an `onRetain` Transition Hook
   *
   * See [[IHookRegistry.onRetain]]
   */
  onRetain  : IHookRegistration;
  /**
   * Registers a callback function as an `onExit` Transition Hook
   *
   * See [[IHookRegistry.onExit]]
   */
  onExit    : IHookRegistration;
  /**
   * Registers a callback function as an `onFinish` Transition Hook
   *
   * See [[IHookRegistry.onFinish]]
   */
  onFinish  : IHookRegistration;
  /**
   * Registers a callback function as an `onSuccess` Transition Hook
   *
   * See [[IHookRegistry.onSuccess]]
   */
  onSuccess : IHookRegistration;
  /**
   * Registers a callback function as an `onError` Transition Hook
   *
   * See [[IHookRegistry.onError]]
   */
  onError   : IHookRegistration;

  /** @hidden */
  getHooks  : (hookName: string) => IEventHook[];

  private _defaultErrorHandler: ((_error) => void) = function $defaultErrorHandler($error$) {
    if ($error$ instanceof Error) {
      console.error($error$);
    }
  };

  defaultErrorHandler(handler: (error) => void) {
    return this._defaultErrorHandler = handler || this._defaultErrorHandler;
  }

  /**
   * Creates a new [[Transition]] object
   *
   * This is a factory function for creating new Transition objects.
   *
   * @param fromPath
   * @param targetState
   * @returns {Transition}
   */
  create(fromPath: Node[], targetState: TargetState) {
    return new Transition(fromPath, targetState, this);
  }
}
