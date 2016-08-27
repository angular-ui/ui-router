/** @module transition */ /** for typedoc */
import {
    IHookRegistry, TransitionOptions, HookMatchCriteria, HookRegOptions,
    TransitionStateHookFn, TransitionHookFn
} from "./interface";

import {Transition} from "./transition";
import {HookRegistry} from "./hookRegistry";
import {TargetState} from "../state/targetState";
import {PathNode} from "../path/node";
import {IEventHook} from "./interface";
import {ViewService} from "../view/view";
import {UIRouter} from "../router";

import {registerEagerResolvePath, registerLazyResolveState} from "../hooks/resolve";
import {registerLoadEnteringViews, registerActivateViews} from "../hooks/views";
import {registerUpdateUrl} from "../hooks/url";
import {registerRedirectToHook} from "../hooks/redirectTo";
import {registerOnExitHook, registerOnRetainHook, registerOnEnterHook} from "../hooks/onEnterExitRetain";
import {registerLazyLoadHook} from "../hooks/lazyLoadStates";

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
  current     : () => null,
  source      : "unknown"
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

  /**
   * This object has hook de-registration functions for the built-in hooks.
   * This can be used by third parties libraries that wish to customize the behaviors
   *
   * @hidden
   */
  _deregisterHookFns: {
    redirectTo: Function;
    onExit: Function;
    onRetain: Function;
    onEnter: Function;
    eagerResolve: Function;
    lazyResolve: Function;
    loadViews: Function;
    activateViews: Function;
    updateUrl: Function;
    lazyLoad: Function;
  };

  constructor(private _router: UIRouter) {
    this.$view = _router.viewService;
    HookRegistry.mixin(new HookRegistry(), this);
    this._deregisterHookFns = <any> {};
    this.registerTransitionHooks();
  }

  /** @hidden */
  private registerTransitionHooks() {
    let fns = this._deregisterHookFns;

    // Wire up redirectTo hook
    fns.redirectTo    = registerRedirectToHook(this);
    
    // Wire up onExit/Retain/Enter state hooks
    fns.onExit        = registerOnExitHook(this);
    fns.onRetain      = registerOnRetainHook(this);
    fns.onEnter       = registerOnEnterHook(this);

    // Wire up Resolve hooks
    fns.eagerResolve  = registerEagerResolvePath(this);
    fns.lazyResolve   = registerLazyResolveState(this);

    // Wire up the View management hooks
    fns.loadViews     = registerLoadEnteringViews(this);
    fns.activateViews = registerActivateViews(this);

    // After globals.current is updated at priority: 10000
    fns.updateUrl     = registerUpdateUrl(this);

    // Lazy load state trees
    fns.lazyLoad      = registerLazyLoadHook(this);
  }

  /** @inheritdoc */
  onBefore (matchCriteria: HookMatchCriteria, callback: TransitionHookFn, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onStart (matchCriteria: HookMatchCriteria, callback: TransitionHookFn, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onExit (matchCriteria: HookMatchCriteria, callback: TransitionStateHookFn, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onRetain (matchCriteria: HookMatchCriteria, callback: TransitionStateHookFn, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onEnter (matchCriteria: HookMatchCriteria, callback: TransitionStateHookFn, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onFinish (matchCriteria: HookMatchCriteria, callback: TransitionHookFn, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onSuccess (matchCriteria: HookMatchCriteria, callback: TransitionHookFn, options?: HookRegOptions) : Function { throw ""; };
  /** @inheritdoc */
  onError (matchCriteria: HookMatchCriteria, callback: TransitionHookFn, options?: HookRegOptions) : Function { throw ""; };


  /** @hidden */
  getHooks  : (hookName: string) => IEventHook[];

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
