import {defaults, extend, noop, filter, not, isFunction, objectKeys, map, mapObj, pattern, isEq, val, pipe, eq, is, isPromise, isObject, parse} from "../common/common";
import trace from "../common/trace";
import {RejectFactory} from "./rejectFactory";
import Path from "../path/path";
import {Transition} from "./transition";
import {IState, IResolveDeclarations} from "../state/interface";
import Resolvable from "../resolve/resolvable";
import ResolveContext from "../resolve/resolveContext";
import {ITransitionHookOptions} from "./interface"

var REJECT = new RejectFactory();

export default class TransitionHook {
  // TODO these are redundant, check why we're doubling up on them.
  async: boolean;
  rejectIfSuperseded: boolean;
  data: any;

  constructor(private state: IState,
              private fn: Function,
              private locals: any,
              private resolveContext: ResolveContext,
              private options: ITransitionHookOptions) {
    this.options = defaults(options, {
      async: true,
      rejectIfSuperseded: true,
      current: noop,
      transition: null,
      trace: false,
      data: {}
    });

    // TODO this is redundant, check why we're doubling up on these.
    this.async = options.async;
    this.rejectIfSuperseded = options.rejectIfSuperseded;
    this.data = options.data;
  }

  /**
   * Validates the result map as a "resolve:" style object.
   * Creates Resolvable objects from the result object and adds them to the target object
   */
  mapNewResolves(resolves: IResolveDeclarations) {
    var invalid = filter(resolves, not(isFunction)), keys = objectKeys(invalid);
    if (keys.length)
      throw new Error("Invalid resolve key/value: ${keys[0]}/${invalid[keys[0]]}");

    // If result is an object, it should be a map of strings to functions.
    const makeResolvable = (fn, name) => new Resolvable(name, fn, this.state);
    return mapObj(resolves, makeResolvable);
  }

  handleHookResult(hookResult) {
    var transitionResult = this.mapHookResult(hookResult);
    if (this.options.trace) trace.traceHookResult(hookResult, transitionResult, this.options);
    return transitionResult;
  }

  /**
   * Handles transition abort and transition redirect. Also adds any returned resolvables
   * to the pathContext for the current pathElement.  If the transition is rejected, then a rejected
   * promise is returned here, otherwise undefined is returned.
   */
  mapHookResult = (hookResult) => pattern([
    // Transition is no longer current
    [not(isEq(this.options.current, val(this.options.transition))), pipe(this.options.current, REJECT.superseded.bind(REJECT))],
    // If the hook returns false, abort the current Transition
    [eq(false), val(REJECT.aborted("Hook aborted transition"))],
    // If the hook returns a Transition, halt the current Transition and redirect to that Transition.
    [is(Transition), REJECT.redirected.bind(REJECT)],
    // A promise was returned, wait for the promise and then chain another hookHandler
    [isPromise, (result) => result.then(this.handleHookResult.bind(this))],
    // If the hook returns any new resolves, add them to the pathContext via the PathElement
    [isObject, (result) => this.resolveContext.addResolvables(this.mapNewResolves(result), this.state)]
  ])(hookResult);

  invokeStep = () => {
    var { options, fn, locals, resolveContext, state } = this;
    if (options.trace) trace.traceHookInvocation(this, options);
    if (options.rejectIfSuperseded && /* !this.isActive() */ options.transition !== options.current()) {
      return REJECT.superseded(options.current());
    }

    // TODO: Need better integration of returned promises in synchronous code.
    if (!options.async) {
      let hookResult = resolveContext.invokeNow(state, fn, locals, options);
      return this.handleHookResult(hookResult);
    }
    return resolveContext.invokeLater(state, fn, locals, options).then(this.handleHookResult.bind(this));
  };


  toString() {
    var { options, fn, resolveContext } = this;
    var event = parse("data.eventType")(options) || "internal",
        name = (<any> fn).name || "(anonymous)",
        from = parse("data.from.name")(options),
        to = parse("data.to.name")(options),
        state = parse("data.pathElement.state.name")(options);
    return `Step ${event} (fn: '${name}', match:{from: '${from}', to: '${to}'}, ${resolveContext.toString()})`;
  }
}