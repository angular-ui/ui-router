import {val, flatten, identity, isPromise, Predicate} from "../common/common";
import {runtime} from "../common/angular1";
import {IPromise} from "angular";
import HookBuilder from "./hookBuilder";
import {Transition} from "./transition";
import TransitionHook from "./transitionHook";

export default class TransitionRunner {
  private hookBuilder: HookBuilder;

  constructor(private transition: Transition, private _resolve, private _reject) {
    this.hookBuilder = transition.hookBuilder();
  }

  run(): IPromise<any> {
    const runSuccessHooks = () => runSynchronousHooks(this.success(), {}, true);
    const runErrorHooks = ($error$) => runSynchronousHooks(this.error(), { $error$ }, true);
    // Run the success/error hooks *after* the Transition promise is settled.
    this.transition.promise.then(runSuccessHooks, runErrorHooks);

    // ---- Synchronous hooks ----
    // Run the "onBefore" sync hooks
    // The results of the sync hooks is an async promise chain (which gets rejected or resolved)
    let chain = runSynchronousHooks(this.before());

    // ---- Asynchronous section ----
    // Chain off the promise, build the remainder of the chain using each async step.
    chain = this.async().reduce((_chain, step) => _chain.then(step.invokeStep), chain);

    // Make sure to settle the Transition promise, using the supplied callbacks and return the full chain.
    return chain.then(this._resolve, this._reject);
  }

  before() {
    return this.hookBuilder.getOnBeforeHooks();
  }

  async() {
    let hookBuilder = this.hookBuilder;
    // Build the async hooks *after* running onBefore hooks.
    // The synchronous onBefore hooks may register additional async hooks on-the-fly.
    let onStartHooks    = hookBuilder.getOnStartHooks();
    let onExitHooks     = hookBuilder.getOnExitHooks();
    let onRetainHooks   = hookBuilder.getOnRetainHooks();
    let onEnterHooks    = hookBuilder.getOnEnterHooks();
    let onFinishHooks   = hookBuilder.getOnFinishHooks();

    return flatten([onStartHooks, onExitHooks, onRetainHooks, onEnterHooks, onFinishHooks]).filter(identity);
  }

  success() {
    return this.hookBuilder.getOnSuccessHooks();
  }

  error() {
    return this.hookBuilder.getOnErrorHooks();
  }
}

/**
 * Given an array of TransitionHooks, runs each one synchronously and sequentially.
 *
 * Returns a promise chain composed of any promises returned from each hook.invokeStep() call
 */
export function runSynchronousHooks(hooks: TransitionHook[], locals = {}, swallowExceptions: boolean = false): IPromise<any> {
  function invokeSwallowExceptions(hook) {
    try {
      return hook.invokeStep(locals);
    } catch (exception) {
      if (!swallowExceptions)
        throw exception;
      console.log("Swallowed exception during synchronous hook handler: " + exception); // TODO: What to do here?
    }
  }

  return hooks.map(invokeSwallowExceptions)
      .filter(<Predicate<any>> isPromise)
      .reduce((chain, promise) => chain.then(val(promise)), runtime.$q.when(undefined));
}
