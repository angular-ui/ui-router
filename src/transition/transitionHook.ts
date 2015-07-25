import {defaults, extend, noop, filter, not, isFunction, objectKeys, map, pattern, isEq, val, pipe, eq, is, isPromise, isObject, parse} from "../common/common";
import trace from "../common/trace";
import {RejectFactory} from "./rejectFactory";
import PathElement from "../resolve/pathElement";
import Path from "../resolve/path";
import {Transition} from "./transition";
import {IState} from "../state/interface";
import Resolvable from "../resolve/resolvable";

var REJECT = new RejectFactory();

export interface ITransitionHookOptions {
  async: boolean, rejectIfSuperseded: boolean, current(), transition: Transition, trace: boolean, data: any
}

export default class TransitionHook {
  options: ITransitionHookOptions;
  pathElement: PathElement;
  fn: Function;
  locals: any;
  pathContext: Path;

  // TODO these are redundant, check why we're doubling up on them.
  async: boolean;
  rejectIfSuperseded: boolean;
  state: IState;
  data: any;

  constructor(pathElement: PathElement, fn: Function, locals: any, pathContext: Path, options: any) {
    this.options = defaults(options, {
      async: true,
      rejectIfSuperseded: true,
      current: noop,
      transition: null,
      trace: false,
      data: {}
    });
    this.pathElement = pathElement;
    this.fn = fn;
    this.locals = locals;
    this.pathContext = pathContext;

    // TODO this is redundant, check why we're doubling up on these.
    this.async = options.async;
    this.rejectIfSuperseded = options.rejectIfSuperseded;
    this.state = pathElement.state;
    this.data = options.data;
  }

  /**
   * Validates the result map as a "resolve:" style object.
   * Creates Resolvable objects from the result object and adds them to the target object
   */
  mapNewResolves(resolves: Object) {
    var invalid = filter(resolves, not(isFunction)), keys = objectKeys(invalid);
    if (keys.length)
      throw new Error("Invalid resolve key/value: ${keys[0]}/${invalid[keys[0]]}");

    // If result is an object, it should be a map of strings to functions.
    return map(resolves, (val, key) => {
      return new Resolvable(key, val, this.pathElement.state);
    });
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
    [isObject, (result) => this.pathElement.addResolvables(this.mapNewResolves(result))]
  ])(hookResult);

  invokeStep = () => {
    var { options, fn, locals, pathContext, pathElement } = this;
    if (options.trace) trace.traceHookInvocation(this, options);
    if (options.rejectIfSuperseded && /* !this.isActive() */ options.transition !== options.current()) {
      return REJECT.superseded(options.current());
    }

    // TODO: Need better integration of returned promises in synchronous code.
    if (!options.async) {
      return this.handleHookResult(pathElement.invokeNow(fn, locals, pathContext));
    }
    return pathElement.invokeLater(fn, locals, pathContext, options).then(this.handleHookResult.bind(this));
  };


  toString() {
    var { options, fn, pathContext } = this;
    var event = parse("data.eventType")(options) || "internal",
        name = (<any> fn).name || "(anonymous)",
        from = parse("data.from.name")(options),
        to = parse("data.to.name")(options),
        state = parse("data.pathElement.state.name")(options);
    return `Step ${event} (fn: '${name}', match:{from: '${from}', to: '${to}'}, ${pathContext.toString()})`;
  }
}