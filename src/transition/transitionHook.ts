import {IInjectable, defaults, extend, noop, filter, not, isFunction, isDefined, map, pattern, val,
    eq, is, isPromise, isObject, parse, fnToString, maxLength} from "../common/common";
import trace from "../common/trace";
import {RejectFactory} from "./rejectFactory";
import {Transition} from "./transition";
import {IState, IResolveDeclarations} from "../state/interface";
import Resolvable from "../resolve/resolvable";
import ResolveContext from "../resolve/resolveContext";
import {ITransitionHookOptions} from "./interface";

let REJECT = new RejectFactory();

let defaultOptions = {
  async: true,
  rejectIfSuperseded: true,
  current: noop,
  transition: null,
  traceData: {}
};

export default class TransitionHook {
  constructor(private state: IState,
              private fn: IInjectable,
              private locals: any,
              private resolveContext: ResolveContext,
              private options: ITransitionHookOptions) {
    this.options = defaults(options, defaultOptions);
  }

  private isSuperseded = () => this.options.current() !== this.options.transition;

  /**
   * Handles transition abort and transition redirect. Also adds any returned resolvables
   * to the pathContext for the current pathElement.  If the transition is rejected, then a rejected
   * promise is returned here, otherwise undefined is returned.
   */
  mapHookResult = pattern([
    // Transition is no longer current
    [this.isSuperseded, () => REJECT.superseded(this.options.current())],
    // If the hook returns false, abort the current Transition
    [eq(false),         val(REJECT.aborted("Hook aborted transition"))],
    // If the hook returns a Transition, halt the current Transition and redirect to that Transition.
    [is(Transition),    (transition) => REJECT.redirected(transition)],
    // A promise was returned, wait for the promise and then chain another hookHandler
    [isPromise,         (promise) => promise.then(this.handleHookResult.bind(this))],
    // If the hook returns any new resolves, add them to the pathContext via the PathElement
    [isObject,          (obj) => this.resolveContext.addResolvables(this.mapNewResolves(obj), this.state)]
  ]);

  invokeStep = (moreLocals) => {
    let { options, fn, resolveContext, state } = this;
    let locals = extend({}, this.locals, moreLocals);
    trace.traceHookInvocation(this, options);
    if (options.rejectIfSuperseded && this.isSuperseded()) {
      return REJECT.superseded(options.current());
    }

    // TODO: Need better integration of returned promises in synchronous code.
    if (!options.async) {
      let hookResult = resolveContext.invokeNow(state, fn, locals, options);
      return this.handleHookResult(hookResult);
    }
    return resolveContext.invokeLater(state, fn, locals, options).then(this.handleHookResult.bind(this));
  };

  /**
   * Validates the result map as a "resolve:" style object.
   * Creates Resolvable objects from the result object and adds them to the target object
   */
  mapNewResolves(resolves: IResolveDeclarations) {
    // If a hook result is an object, it should be a map of strings to functions.
    let invalid = filter(resolves, not(isFunction)), keys = Object.keys(invalid);
    if (keys.length)
      throw new Error(`Invalid resolve key/value: ${keys[0]}/${invalid[keys[0]]}`);

    const makeResolvable = (fn, name) => new Resolvable(name, fn, this.state);
    return map(resolves, makeResolvable);
  }

  handleHookResult(hookResult) {
    if (!isDefined(hookResult)) return undefined;
    trace.traceHookResult(hookResult, undefined, this.options);

    let transitionResult = this.mapHookResult(hookResult);
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
}