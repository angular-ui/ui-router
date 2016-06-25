/** @module transition */ /** for typedoc */
import { IHookRegistry, TransitionOptions, HookMatchCriteria, HookRegOptions } from "./interface";

import {Transition} from "./transition";
import {HookRegistry} from "./hookRegistry";
import {TargetState} from "../state/targetState";
import {PathNode} from "../path/node";
import {IEventHook} from "./interface";
import {ViewService} from "../view/view";
import {IInjectable} from "../common/common";
import {makeEnterExitRetainHook} from "../hooks/onEnterExitRetain";
import {$eagerResolvePath, $lazyResolveState} from "../hooks/resolve";
import {loadEnteringViews, activateViews} from "../hooks/views";
import {UiRouter} from "../router";
import {val} from "../common/hof";
import {updateUrl} from "../hooks/url";

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
 * At bootstrap, [[UiRouter]] creates a single instance (singleton) of this class.
 */
export class TransitionService implements IHookRegistry {
  /** @hidden */
  public $view: ViewService;

  _deregisterHookFns: {
    onExit: Function;
    onRetain: Function;
    onEnter: Function;
    eagerResolve: Function;
    lazyResolve: Function;
    loadViews: Function;
    activateViews: Function;
    updateUrl: Function;
  };

  constructor(private _router: UiRouter) {
    this.$view = _router.viewService;
    HookRegistry.mixin(new HookRegistry(), this);
    this._deregisterHookFns = <any> {};
    this.registerTransitionHooks();
  }
  
  private registerTransitionHooks() {
    let fns = this._deregisterHookFns;
    
    // Wire up onExit/Retain/Enter state hooks
    fns.onExit        = this.onExit({exiting: state => !!state.onExit}, makeEnterExitRetainHook('onExit'));
    fns.onRetain      = this.onRetain({retained: state => !!state.onRetain}, makeEnterExitRetainHook('onRetain'));
    fns.onEnter       = this.onEnter({entering: state => !!state.onEnter}, makeEnterExitRetainHook('onEnter'));

    // Wire up Resolve hooks
    fns.eagerResolve  = this.onStart({}, $eagerResolvePath, {priority: 1000});
    fns.lazyResolve   = this.onEnter({ entering: val(true) }, $lazyResolveState, {priority: 1000});

    fns.loadViews     = this.onStart({}, loadEnteringViews);
    fns.activateViews = this.onSuccess({}, activateViews);

    // After globals.current is updated at priority: 10000
    fns.updateUrl     = this.onSuccess({}, updateUrl, {priority: 9999});
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
  defaultErrorHandler(handler?: (error) => void): (error) => void {
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
  create(fromPath: PathNode[], targetState: TargetState): Transition {
    return new Transition(fromPath, targetState, this._router);
  }
}
