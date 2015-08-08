
import {IPromise} from "angular"
import {extend, map, filter, invoke, isPromise, Predicate} from "../common/common"
import {runtime} from "../common/angular1"
import trace from "../common/trace"

import {ITransitionOptions, ITransitionHookOptions, ITreeChanges, ITransitionService} from "./interface"
import TransitionHook from "./transitionHook"
import {Transition} from "./transition"

import {IState} from "../state/interface"

import {ITransPath, INode, IParamsNode, ITransNode} from "../path/interface"
import Path from "../path/path"

import ResolveContext from "../resolve/resolveContext"


export default class HookBuilder {
  successErrorOptions = { 
    async: false, 
    rejectIfSuperseded: false 
  };
  
  transitionOptions: ITransitionOptions;

  toState: IState;
  fromState: IState;

  tLocals: {[key:string]: any};
  rootPath: Path<INode>;


  constructor(private $transition: ITransitionService, private treeChanges: ITreeChanges, private transition: Transition, private baseHookOptions) {
    this.toState = treeChanges.to.last().state;
    this.fromState = treeChanges.from.last().state;
    this.transitionOptions = transition.options();
    this.tLocals = { $transition$: transition };
    let rootNode: INode = { state: this.toState.root() };
    this.rootPath = new Path<INode>([rootNode]);
  }

  runSynchronousHooks(hooks: TransitionHook[], swallowExceptions: boolean = false): IPromise<any> {
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
  makeSteps(eventName: string, to: IState, from: IState, locals, resolveContext: ResolveContext, options?: ITransitionHookOptions): any[] {
    // trace stuff
    var stepData = { to, from, locals, resolveContext, eventType: eventName };
    options = extend(options || {}, this.baseHookOptions, {data: stepData});

    var hooks = this.$transition.$$hooks(eventName);
    let hookMatch = <Predicate<any>> invoke('matches', [to, from]);
    var filtered = filter(hooks, hookMatch);
    return map(filtered, function (hook) {
      return new TransitionHook(to, hook.callback, locals, resolveContext, options);
    });
  }

  /** Returns a TransitionHook which resolves an entire path according to a given resolvePolicy */
  makeEagerResolvePathStep(path: ITransPath, locals) {
    if (!path.nodes().length) return null;
    var options = extend({resolvePolicy: 'eager'}, this.baseHookOptions);
    var resolveContext = new ResolveContext(path);
    var state: IState = path.last().state;

    function $eagerResolvePath() {
      return resolveContext.resolvePath(options);
    }

    return new TransitionHook(state, $eagerResolvePath, locals, resolveContext, options);
  }

  /** Returns a TransitionHook which resolves a single path element according to a given resolvePolicy */
  makeLazyResolvePathElementStep(path: ITransPath, state: IState, locals) {
    var options = extend({resolvePolicy: 'lazy'}, this.baseHookOptions);
    var resolveContext = new ResolveContext(path);

    function $resolvePathElement() {
      return resolveContext.resolvePathElement(state, options);
    }

    return new TransitionHook(state, $resolvePathElement, locals, resolveContext, options);
  }


  successHooks() {
    var { transition, transitionOptions, toState, fromState, tLocals, successErrorOptions } = this;

    return () => {
      if (transitionOptions.trace) trace.traceSuccess(toState, transition);
      transition._deferreds.prehooks.resolve(this.treeChanges);
      var onSuccessHooks = this.makeSteps("onSuccess", toState, fromState, tLocals, new ResolveContext(this.treeChanges.to), successErrorOptions);
      this.runSynchronousHooks(onSuccessHooks, true);
      transition._deferreds.posthooks.resolve(this.treeChanges);
    }
  }

  errorHooks() {
    var { transition, transitionOptions, toState, fromState, tLocals, successErrorOptions } = this;

    return (error) => {
      if (transitionOptions.trace) trace.traceError(error, transition);
      transition._deferreds.prehooks.reject(error);
      var onErrorLocals = extend({}, tLocals, {$error$: error});
      var onErrorHooks = this.makeSteps("onError", toState, fromState, onErrorLocals, new ResolveContext(this.treeChanges.from), successErrorOptions);
      this.runSynchronousHooks(onErrorHooks, true);
      transition._deferreds.posthooks.reject(error);
    }
  }
}
