import {isNull, isPromise, is, invoke, not, val, pattern, parse, objectKeys}  from "../common/common";
import {isDefined, isObject, isString, isFunction, extend, forEach, isArray, identity} from "../common/common";
import Resolvable  from "../resolve/resolvable";
import {Transition, TransitionRejection}  from "../transition/transition";

function promiseToString(p) {
  if (is(TransitionRejection)(p.reason)) return p.reason.toString();
  return `Promise(${JSON.stringify(p)})`;
}

function fnToString(fn) {
  var name = fn.name ? fn.name : "(anonymous)";
  return `function ${name}(...)`;
}

class Trace {
  approximateDigests: number;
  format: Function;

  constructor() {
    this.approximateDigests = 0;
  }

  _trace(string) {
    console.log(string);
  }

  _replacer(key, val) {
    return this.format(val);
  }

  _toJson(o) {
    return JSON.stringify(o, (key, val) => this._replacer(key, val));
  }

  _stringify(o) {
    this.format = pattern([
      [not(isDefined),            val("undefined")],
      [isNull,                    val("null")],
      [isPromise,                 promiseToString],
      [is(Transition),            invoke("toString")],
      [is(Resolvable),            invoke("toString")],
      [isFunction,                fnToString],
      [val(true),                 identity]
    ]);

    return this._toJson(o);
  }

  traceTransitionStart(transition) {
    var tid = transition.$id,
      digest = this.approximateDigests,
      transitionStr = this._stringify(transition);
    this._trace(`Transition #${tid} Digest #${digest}: Started ${transitionStr}`);
  }

  traceTransitionIgnored(transition) {
    var tid = transition.$id,
      digest = this.approximateDigests,
      transitionStr = this._stringify(transition)
    this._trace(`Transition #${tid} Digest #${digest}: Ignored ${transitionStr}`);
  }

  traceHookInvocation(step, options) {
    var tid = parse("transition.$id")(options),
      digest = this.approximateDigests;
    this._trace(`Transition #${tid} Digest #${digest}:   Hook -> ${step.toString()}`);
  }

  traceHookResult(hookResult, transitionResult, transitionOptions) {
    var tid = parse("transition.$id")(transitionOptions),
      digest = this.approximateDigests,
      hookResultStr = this._stringify(hookResult),
      transitionResultStr = this._stringify(transitionResult);
    this._trace(`Transition #${tid} Digest #${digest}:   Hook <- returned: ${hookResultStr} result: ${transitionResultStr}`);
  }

  traceResolvePath(path, options) {
    var tid = parse("transition.$id")(options),
      digest = this.approximateDigests,
      pathStr = path && path.toString(),
      policyStr = options && options.resolvePolicy;
    this._trace(`Transition #${tid} Digest #${digest}:         Resolving ${pathStr} (${policyStr})`);
  }

  traceResolvePathElement(pathElement, resolvablePromises, options) {
    var tid = parse("transition.$id")(options),
      digest = this.approximateDigests,
      resolvablePromisesStr = objectKeys(resolvablePromises).join(", "),
      pathElementStr = pathElement && pathElement.toString(),
      policyStr = options && options.resolvePolicy;
    this._trace(`Transition #${tid} Digest #${digest}:         Resolve ${pathElementStr} resolvables: [${resolvablePromisesStr}] (${policyStr})`);
  }

  traceResolveResolvable(resolvable, options) {
    var tid = parse("transition.$id")(options),
      digest = this.approximateDigests,
      resolvableStr = resolvable && resolvable.toString(),
      policyStr = options && options.resolvePolicy;
    this._trace(`Transition #${tid} Digest #${digest}:               Resolving ${resolvableStr} (${policyStr})`);
  }

  tracePathElementInvoke(pathElement, fn, deps, options) {
    var title = `Invoke ${options.when}`,
      tid = parse("transition.$id")(options),
      digest = this.approximateDigests,
      pathElementStr = pathElement && pathElement.toString(),
      fnName = fn.name || "(anonymous)",
      policyStr = options && options.resolvePolicy;
    this._trace(`Transition #${tid} Digest #${digest}:         ${title}: ${fnName} ${pathElementStr} requires: [${deps}]`);
  }

  traceError(error, transition) {
    var tid = transition.$id,
      digest = this.approximateDigests;
    this._trace(`Transition #${tid} Digest #${digest}: Transition Rejected, reason: ${error}`);
  }

  traceSuccess(finalState, transition) {
    var tid = transition.$id,
      digest = this.approximateDigests,
      state = finalState.name;
    this._trace(`Transition #${tid} Digest #${digest}: Transition Success, state: ${state}`);
  }
}

export var trace = new Trace();

angular.module("ui.router").run(function($rootScope) {
  $rootScope.$watch(function() { trace.approximateDigests++; });
});