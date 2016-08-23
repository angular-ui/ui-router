/** @module transition */ /** for typedoc */
import {TransitionHookOptions, IEventHook, HookResult} from "./interface";
import {defaults, noop} from "../common/common";
import {fnToString, maxLength} from "../common/strings";
import {isDefined, isPromise } from "../common/predicates";
import {pattern, val, eq, is, parse } from "../common/hof";
import {trace} from "../common/trace";
import {services} from "../common/coreservices";

import {Rejection} from "./rejectFactory";
import {TargetState} from "../state/targetState";
import {ResolveContext} from "../resolve/resolveContext";
import {Transition} from "./transition";
import {State} from "../state/stateObject";

let defaultOptions: TransitionHookOptions = {
  async: true,
  rejectIfSuperseded: true,
  current: noop,
  transition: null,
  traceData: {},
  bind: null
};

/** @hidden */
export class TransitionHook {
  constructor(private transition: Transition,
              private stateContext: State,
              private eventHook: IEventHook,
              private options: TransitionHookOptions) {
    this.options = defaults(options, defaultOptions);
  }

  private isSuperseded = () => this.options.current() !== this.options.transition;

  invokeHook(): Promise<HookResult> {
    let { options, eventHook } = this;
    trace.traceHookInvocation(this, options);
    if (options.rejectIfSuperseded && this.isSuperseded()) {
      return Rejection.superseded(options.current()).toPromise();
    }

    let hookResult = !eventHook._deregistered
      ? eventHook.callback.call(options.bind, this.transition, this.stateContext)
      : undefined;
    return this.handleHookResult(hookResult);
  }

  /**
   * This method handles the return value of a Transition Hook.
   *
   * A hook can return false, a redirect (TargetState), or a promise (which may resolve to false or a redirect)
   */
  handleHookResult(hookResult: HookResult): Promise<any> {
    if (!isDefined(hookResult)) return undefined;

    /**
     * Handles transition superseded, transition aborted and transition redirect.
     */
    const mapHookResult = pattern([
      // Transition is no longer current
      [this.isSuperseded, () => Rejection.superseded(this.options.current()).toPromise()],
      // If the hook returns false, abort the current Transition
      [eq(false),         () => Rejection.aborted("Hook aborted transition").toPromise()],
      // If the hook returns a Transition, halt the current Transition and redirect to that Transition.
      [is(TargetState),   (target: TargetState) => Rejection.redirected(target).toPromise()],
      // A promise was returned, wait for the promise and then chain another hookHandler
      [isPromise,         (promise: Promise<any>) => promise.then(this.handleHookResult.bind(this))]
    ]);

    let transitionResult = mapHookResult(hookResult);
    if (transitionResult) trace.traceHookResult(hookResult, transitionResult, this.options);

    return transitionResult;
  }

  toString() {
    let { options, eventHook } = this;
    let event = parse("traceData.hookType")(options) || "internal",
        context = parse("traceData.context.state.name")(options) || parse("traceData.context")(options) || "unknown",
        name = fnToString(eventHook.callback);
    return `${event} context: ${context}, ${maxLength(200, name)}`;
  }


  /**
   * Given an array of TransitionHooks, runs each one synchronously and sequentially.
   *
   * Returns a promise chain composed of any promises returned from each hook.invokeStep() call
   */
  static runSynchronousHooks(hooks: TransitionHook[], swallowExceptions: boolean = false): Promise<any> {
    let results: Promise<HookResult>[] = [];
    for (let i = 0; i < hooks.length; i++) {
      let hook = hooks[i];
      try {
        results.push(hook.invokeHook());
      } catch (exception) {
        if (!swallowExceptions) {
          return Rejection.errored(exception).toPromise();
        }

        let errorHandler = hook.transition.router.stateService.defaultErrorHandler();
        errorHandler(exception);
      }
    }

    let rejections = results.filter(Rejection.isTransitionRejectionPromise);
    if (rejections.length) return rejections[0];

    return results
        .filter(isPromise)
        .reduce((chain: Promise<any>, promise: Promise<any>) => chain.then(val(promise)), services.$q.when());
  }
}