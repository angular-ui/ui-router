
import {IPromise} from "angular"
import {extend, map, filter, invoke, isPromise, Predicate} from "../common/common"
import {runtime} from "../common/angular1"
import trace from "../common/trace"

import {ITransitionOptions, ITransitionHookOptions, ITreeChanges, IEventHook, IMatchCriteria, ITransitionService} from "./interface"
import TransitionHook from "./transitionHook"
import {Transition} from "./transition"

import {IState} from "../state/interface"

import {IResolvePath, INode, IParamsNode, IResolveNode} from "../path/interface"
import Path from "../path/path"

import ResolveContext from "../resolve/resolveContext"

interface IToFrom {
  to: IState,
  from: IState
}

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
   * returns an array of the registered transition hooks which matched:
   * 1) the eventType
   * 2) the to state
   * 3) the from state
   */
  makeSteps(eventName: string, state: IState, toFrom: IToFrom, resolveContext: ResolveContext, locals, options?: ITransitionHookOptions): any[] {
    // trace stuff
    var stepData = { toFrom, state, locals, resolveContext, eventType: eventName };
    options = extend(options || {}, this.baseHookOptions, {data: stepData});

    var hooks = this.$transition.$$hooks(eventName);
    let hookMatch = (hook: IEventHook) => hook.matches(toFrom.to, toFrom.from);
    var matchingHooks = filter(hooks, hookMatch);
    return map(matchingHooks, function (hook) {
      return new TransitionHook(state, hook.callback, locals, resolveContext, options);
    });
  }

  /** Returns a TransitionHook which resolves an entire path according to a given resolvePolicy */
  makeEagerResolvePathStep(path: IResolvePath, locals) {
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
  makeLazyResolvePathElementStep(path: IResolvePath, state: IState, locals) {
    var options = extend({resolvePolicy: 'lazy'}, this.baseHookOptions);
    var resolveContext = new ResolveContext(path);

    function $resolvePathElement() {
      return resolveContext.resolvePathElement(state, options);
    }

    return new TransitionHook(state, $resolvePathElement, locals, resolveContext, options);
  }

  exitingStateHooks(context: ResolveContext, tLocals, toParams, options?: ITransitionHookOptions) {
    var nodes = this.treeChanges.exiting.reverse().nodes();
    return map(nodes, (node:IResolveNode) => {
      let state: IState = node.state;
      let toFrom = {to: this.toState, from: state};
      let stepLocals = {$state$: state, $stateParams: state.params.$$values(toParams)};
      let locals = extend({}, tLocals, stepLocals);
      let resolveContext = context.isolateRootTo(state);
      let steps = this.makeSteps("exiting", state, toFrom, resolveContext, locals, options);

      return !state.self.onExit ? steps : steps.concat([
        new TransitionHook(state, state.self.onExit, locals, resolveContext, options)
      ]);
    });
  }

  enteringStateHooks(context: ResolveContext, tLocals, toParams, options?: ITransitionHookOptions) {
    var nodes = this.treeChanges.entering.nodes();
    var to = this.treeChanges.to;
    return map(nodes, (node:IResolveNode) => {
      let state:IState = node.state;
      let toFrom = {to: state, from: this.fromState};
      let stepLocals = {$state$: state, $stateParams: state.params.$$values(toParams)};
      let locals = extend({}, tLocals, stepLocals);
      let resolveContext = context.isolateRootTo(state);
      let lazyResolveStep = this.makeLazyResolvePathElementStep(to, state, locals);
      let steps = [lazyResolveStep].concat(this.makeSteps("entering", state, toFrom, resolveContext, locals, options));

      return !state.self.onEnter ? steps : steps.concat([
        new TransitionHook(state, state.self.onEnter, locals, resolveContext, options)
      ]);
    });
  }


  successHooks() {
    let { transition, transitionOptions, toState, fromState, tLocals, successErrorOptions } = this;
    let toFrom = { to: toState, from: fromState };

    return () => {
      if (transitionOptions.trace) trace.traceSuccess(toState, transition);
      transition._deferreds.prehooks.resolve(this.treeChanges);
      var onSuccessHooks = this.makeSteps("onSuccess", toState, toFrom, new ResolveContext(this.treeChanges.to), tLocals, successErrorOptions);
      this.runSynchronousHooks(onSuccessHooks, true);
      transition._deferreds.posthooks.resolve(this.treeChanges);
    }
  }

  errorHooks() {
    let { transition, transitionOptions, toState, fromState, tLocals, successErrorOptions } = this;
    let toFrom = { to: toState, from: fromState };
    
    return (error) => {
      if (transitionOptions.trace) trace.traceError(error, transition);
      transition._deferreds.prehooks.reject(error);
      var onErrorLocals = extend({}, tLocals, {$error$: error});
      var onErrorHooks = this.makeSteps("onError", toState, toFrom, new ResolveContext(this.treeChanges.from), onErrorLocals, successErrorOptions);
      this.runSynchronousHooks(onErrorHooks, true);
      transition._deferreds.posthooks.reject(error);
    }
  }
}
