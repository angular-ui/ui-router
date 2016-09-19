/** @module transition */ /** for typedoc */
import {TransitionHookOptions, IEventHook, HookResult} from "./interface";
import {defaults, noop} from "../common/common";
import {fnToString, maxLength} from "../common/strings";
import {isPromise} from "../common/predicates";
import {val, is, parse } from "../common/hof";
import {trace} from "../common/trace";
import {services} from "../common/coreservices";

import {Rejection} from "./rejectFactory";
import {TargetState} from "../state/targetState";
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

  private isSuperseded = () =>
    this.options.current() !== this.options.transition;

  invokeHook(): Promise<HookResult> {
    let { options, eventHook } = this;
    trace.traceHookInvocation(this, options);
    if (options.rejectIfSuperseded && this.isSuperseded()) {
      return Rejection.superseded(options.current()).toPromise();
    }

    let synchronousHookResult = !eventHook._deregistered
      ? eventHook.callback.call(options.bind, this.transition, this.stateContext)
      : undefined;

    return this.handleHookResult(synchronousHookResult);
  }

  /**
   * This method handles the return value of a Transition Hook.
   *
   * A hook can return false (cancel), a TargetState (redirect),
   * or a promise (which may later resolve to false or a redirect)
   *
   * This also handles "transition superseded" -- when a new transition
   * was started while the hook was still running
   */
  handleHookResult(result: HookResult): Promise<any> {
    // This transition is no longer current.
    // Another transition started while this hook was still running.
    if (this.isSuperseded()) {
      // Abort this transition
      return Rejection.superseded(this.options.current()).toPromise();
    }

    // Hook returned a promise
    if (isPromise(result)) {
      // Wait for the promise, then reprocess the resolved value
      return result.then(this.handleHookResult.bind(this));
    }

    trace.traceHookResult(result, this.options);

    // Hook returned false
    if (result === false) {
      // Abort this Transition
      return Rejection.aborted("Hook aborted transition").toPromise();
    }

    const isTargetState = is(TargetState);
    // hook returned a TargetState
    if (isTargetState(result)) {
      // Halt the current Transition and start a redirected Transition (to the TargetState).
      return Rejection.redirected(result).toPromise();
    }
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