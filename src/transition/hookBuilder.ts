import {extend, map, filter, invoke, isPromise} from "../common/common";
import {runtime} from "../common/angular1";
import trace from "../common/trace";
import PathElement from "../resolve/pathElement";
import Path from "../resolve/path";
import TransitionHook from "./transitionHook";

export default class HookBuilder {
  $transition ;
  transition ;
  baseHookOptions;

  successErrorOptions = {async: false, rejectIfSuperseded: false};

  to ;
  from ;
  transitionOptions ;
  rootPE ;
  tLocals ;
  rootPath ;


  constructor($transition, transition, baseHookOptions) {
    this.$transition = $transition;
    this.transition = transition;
    this.baseHookOptions = baseHookOptions
    this.to = transition._to.$state();
    this.from = transition._from.$state();
    this.transitionOptions = transition.options();
    this.rootPE = new PathElement(transition._from.$state().root().self);
    this.tLocals = {$transition$: transition};
    this.rootPath = new Path([this.rootPE]);
  }

  runSynchronousHooks(hooks, swallowExceptions: boolean = false) {
    var promises = [];
    for (var i = 0; i < hooks.length; i++) {
      try {
        var hookResult = hooks[i].invokeStep();
        // If a hook returns a promise, that promise is added to an array to be resolved asynchronously.
        if (hookResult && isPromise(hookResult))
          promises.push(hookResult);
      } catch (ex) {
        if (!swallowExceptions) throw ex;
        console.log("Swallowed exception during synchronous hook handler: " + ex); // TODO: What to do here?
      }
    }

    return promises.reduce(function(memo, val) {
      return memo.then(function() { return val; });
    }, runtime.$q.when(true));
  }

  /**
   * returns an array of transition steps (promises) that matched
   * 1) the eventType
   * 2) the to state
   * 3) the from state
   */
  makeSteps(eventType, to, from, pathElement: PathElement, locals, pathContext: Path, options ?:Object): any[] {
    // trace stuff
    var stepData = {
      eventType: eventType,
      to: to,
      from: from,
      pathElement: pathElement,
      locals: locals,
      pathContext: pathContext
    };
    options = extend(options || {}, this.baseHookOptions, {data: stepData});

    var hooks = <any[]> (<any> this.$transition).$$hooks(eventType);

    return map(filter(hooks, invoke('matches', [to, from])), function (hook) {
      return new TransitionHook(pathElement, hook.callback, locals, pathContext, options);
    });
  }

  /** Returns a TransitionHook which resolves an entire path according to a given resolvePolicy */
  makeEagerResolvePathStep(path, locals) {
    if (!path.elements.length) return null;
    var options = extend({resolvePolicy: 'eager'}, this.baseHookOptions);

    function $eagerResolvePath() {
      return path.resolvePath(options);
    }

    return new TransitionHook(path.last(), $eagerResolvePath, locals, path, options);
  }

  /** Returns a TransitionHook which resolves a single path element according to a given resolvePolicy */
  makeLazyResolvePathElementStep(path, pathElement, locals) {
    var options = extend({resolvePolicy: 'lazy'}, this.baseHookOptions);

    function $resolvePathElement() {
      return pathElement.resolvePathElement(path, options);
    }

    return new TransitionHook(pathElement, $resolvePathElement, locals, path, options);
  }


  successHooks() {
    var { transition, transitionOptions, to, from, rootPE, tLocals, rootPath, successErrorOptions } = this;

    return () => {
      var result = transition.$to().state();
      if (transitionOptions.trace) trace.traceSuccess(result, transition);
      transition._deferreds.prehooks.resolve(result);
      var onSuccessHooks = this.makeSteps("onSuccess", to, from, rootPE, tLocals, rootPath, successErrorOptions);
      this.runSynchronousHooks(onSuccessHooks, true);
      transition._deferreds.posthooks.resolve(result);
    }
  }

  errorHooks() {
    var { transition, transitionOptions, to, from, rootPE, tLocals, rootPath, successErrorOptions } = this;

    return (error) => {
      if (transitionOptions.trace) trace.traceError(error, transition);
      transition._deferreds.prehooks.reject(error);
      var onErrorLocals = extend({}, tLocals, {$error$: error});
      var onErrorHooks = this.makeSteps("onError", to, from, rootPE, onErrorLocals, rootPath, successErrorOptions);
      this.runSynchronousHooks(onErrorHooks, true);
      transition._deferreds.posthooks.reject(error);
    }
  }
}
