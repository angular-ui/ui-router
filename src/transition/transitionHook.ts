/** @module transition */ /** for typedoc */
import {TransitionHookOptions} from "./interface";
import {IInjectable, defaults, extend, noop, Predicate} from "../common/common";
import {fnToString, maxLength} from "../common/strings";
import {isDefined, isPromise } from "../common/predicates";
import {not, pattern, val, eq, is, parse } from "../common/hof";
import {trace} from "../common/trace";
import {services} from "../common/coreservices";

import {Rejection} from "./rejectFactory";
import {TargetState} from "../state/module";
import {ResolveContext} from "../resolve/module";

let defaultOptions: TransitionHookOptions = {
  async: true,
  rejectIfSuperseded: true,
  current: noop,
  transition: null,
  traceData: {},
  bind: null
};

export class TransitionHook {
  constructor(private fn: IInjectable,
              private locals: any,
              private resolveContext: ResolveContext,
              private options: TransitionHookOptions) {
    this.options = defaults(options, defaultOptions);
  }

  private isSuperseded = () => this.options.current() !== this.options.transition;

  invokeHook(moreLocals) {
    let { options, fn, resolveContext } = this;
    let locals = extend({}, this.locals, moreLocals);
    trace.traceHookInvocation(this, options);
    if (options.rejectIfSuperseded && this.isSuperseded()) {
      return Rejection.superseded(options.current()).toPromise();
    }

    // TODO: Need better integration of returned promises in synchronous code.
    if (!options.async) {
      let hookResult = resolveContext.invokeNow(fn, locals, options);
      return this.handleHookResult(hookResult);
    }
    return resolveContext.invokeLater(fn, locals, options).then(val => this.handleHookResult(val));
  };

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
    let { options, fn } = this;
    let event = parse("traceData.hookType")(options) || "internal",
        context = parse("traceData.context.state.name")(options) || parse("traceData.context")(options) || "unknown",
        name = fnToString(fn);
    return `${event} context: ${context}, ${maxLength(200, name)}`;
  }


  /**
   * Given an array of TransitionHooks, runs each one synchronously and sequentially.
   *
   * Returns a promise chain composed of any promises returned from each hook.invokeStep() call
   */
  static runSynchronousHooks(hooks: TransitionHook[], locals = {}, swallowExceptions: boolean = false): Promise<any> {
    let results = [];
    for (let i = 0; i < hooks.length; i++) {
      try {
        results.push(hooks[i].invokeHook(locals));
      } catch (exception) {
        if (!swallowExceptions) {
          return Rejection.aborted(exception).toPromise();
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