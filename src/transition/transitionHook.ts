/** @module transition */ /** for typedoc */
import {TransitionHookOptions, TransitionStateHookFn, HookFn, TransitionHookFn} from "./interface";
import {defaults, noop, Predicate} from "../common/common";
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
              private hookFn: HookFn,
              private resolveContext: ResolveContext,
              private options: TransitionHookOptions) {
    this.options = defaults(options, defaultOptions);
  }

  private isSuperseded = () => this.options.current() !== this.options.transition;

  invokeHook(): Promise<any> {
    let { options, hookFn, resolveContext } = this;
    trace.traceHookInvocation(this, options);
    if (options.rejectIfSuperseded && this.isSuperseded()) {
      return Rejection.superseded(options.current()).toPromise();
    }

    let hookResult = hookFn.call(options.bind, this.transition, this.stateContext);
    return this.handleHookResult(hookResult);
  }

  /**
   * This method handles the return value of a Transition Hook.
   *
   * A hook can return false, a redirect (TargetState), or a promise (which may resolve to false or a redirect)
   */
  handleHookResult(hookResult): Promise<any> {
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
      [is(TargetState),   (target) => Rejection.redirected(target).toPromise()],
      // A promise was returned, wait for the promise and then chain another hookHandler
      [isPromise,         (promise) => promise.then(this.handleHookResult.bind(this))]
    ]);

    let transitionResult = mapHookResult(hookResult);
    if (transitionResult) trace.traceHookResult(hookResult, transitionResult, this.options);

    return transitionResult;
  }

  toString() {
    let { options, hookFn } = this;
    let event = parse("traceData.hookType")(options) || "internal",
        context = parse("traceData.context.state.name")(options) || parse("traceData.context")(options) || "unknown",
        name = fnToString(hookFn);
    return `${event} context: ${context}, ${maxLength(200, name)}`;
  }


  /**
   * Given an array of TransitionHooks, runs each one synchronously and sequentially.
   *
   * Returns a promise chain composed of any promises returned from each hook.invokeStep() call
   */
  static runSynchronousHooks(hooks: TransitionHook[], swallowExceptions: boolean = false): Promise<any> {
    let results = [];
    for (let i = 0; i < hooks.length; i++) {
      try {
        results.push(hooks[i].invokeHook());
      } catch (exception) {
        if (!swallowExceptions) {
          return Rejection.errored(exception).toPromise();
        }

        console.error("Swallowed exception during synchronous hook handler: " + exception); // TODO: What to do here?
      }
    }

    let rejections = results.filter(Rejection.isTransitionRejectionPromise);
    if (rejections.length) return rejections[0];

    return results
        .filter(<Predicate<any>> isPromise)
        .reduce((chain, promise) => chain.then(val(promise)), services.$q.when());
  }
}