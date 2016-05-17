/** @module transition */ /** for typedoc */
import { IHookRegistry, TransitionOptions, HookMatchCriteria, HookRegOptions } from "./interface";

import {Transition} from "./transition";
import {HookRegistry} from "./hookRegistry";
import {TargetState} from "../state/module";
import {Node} from "../path/module";
import {IEventHook} from "./interface";
import {ViewService} from "../view/view";
import {IInjectable} from "../common/common";

/**
 * The default [[Transition]] options.
 *
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
 * - Most importantly, it allows global Transition Hooks to be registered.
 * - It allows the default transition error handler to be set.
 * - It also has a factory function for creating new [[Transition]] objects, (used internally by the [[StateService]]).
 *
 * At bootstrap, [[UIRouter]] creates a single instance (singleton) of this class.
 */
export class TransitionService implements IHookRegistry {
  /** @hidden */
  public $view: ViewService;
  constructor($view: ViewService) {
    this.$view = $view;
    HookRegistry.mixin(new HookRegistry(), this);
  }

  /** @inheritdoc */
  onBefore (matchCriteria: HookMatchCriteria, callback: IInjectable, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onStart (matchCriteria: HookMatchCriteria, callback: IInjectable, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onExit (matchCriteria: HookMatchCriteria, callback: IInjectable, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onRetain (matchCriteria: HookMatchCriteria, callback: IInjectable, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onEnter (matchCriteria: HookMatchCriteria, callback: IInjectable, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onFinish (matchCriteria: HookMatchCriteria, callback: IInjectable, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onSuccess (matchCriteria: HookMatchCriteria, callback: IInjectable, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onError (matchCriteria: HookMatchCriteria, callback: IInjectable, options?: HookRegOptions) : Function { throw ""; };


  /** @hidden */
  getHooks  : (hookName: string) => IEventHook[];

  /** @hidden */
  private _defaultErrorHandler: ((_error) => void) = function $defaultErrorHandler($error$) {
    if ($error$ instanceof Error) {
      console.error($error$);
    }
  };

  /**
   * Sets or gets the default transition error handler.
   *
   * The error handler is called when a [[Transition]] is rejected and when any error occurred during the Transition.
   * This includes errors caused by resolves and transition hooks.
   *
   * The built-in default error handler logs thrown javascript Errors to the console.
   *
   * @param handler a global error handler function
   * @returns the current global error handler
   */
  defaultErrorHandler(handler?: (error) => void) {
    return this._defaultErrorHandler = handler || this._defaultErrorHandler;
  }

  /**
   * Creates a new [[Transition]] object
   *
   * This is a factory function for creating new Transition objects.
   * It is used internally by the [[StateService]] and should generally not be called by application code.
   *
   * @param fromPath the path to the current state (the from state)
   * @param targetState the target state (destination)
   * @returns a Transition
   */
  create(fromPath: Node[], targetState: TargetState) {
    return new Transition(fromPath, targetState, this);
  }
}
