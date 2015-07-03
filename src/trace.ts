import {isNull, isPromise, is, invoke, not, val, pattern, tpl, parse, objectKeys}  from "./common";
import {isDefined, isObject, isString, isFunction, extend, forEach, isArray, identity} from "./common";
import {Resolvable}  from "./resolve";
import {Transition, TransitionRejection}  from "./transition";

function promiseToString(p) {
  if (is(TransitionRejection)(p.reason)) return p.reason.toString();
  return "Promise(" + JSON.stringify(p) + ")";
}

function fnToString(fn) {
  var name = fn.name ? fn.name : "(anonymous)";
  return tpl("function {name}(...)", { name: name });
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
    var tplData = {tid: transition.$id, digest: this.approximateDigests, transition: this._stringify(transition)};
    this._trace(tpl('Transition #{tid} Digest #{digest}: Started {transition}', tplData));
  }

  traceTransitionIgnored(transition) {
    var tplData = {tid: transition.$id, digest: this.approximateDigests, transition: this._stringify(transition)};
    this._trace(tpl('Transition #{tid} Digest #{digest}: Ignored {transition}', tplData));
  }

  traceHookInvocation(step, options) {
    var tplData = {tid: parse("transition.$id")(options), digest: this.approximateDigests, step: step.toString()};
    this._trace(tpl('Transition #{tid} Digest #{digest}:   Hook: {step}', tplData));
  }

  traceHookResult(hookResult, transitionResult, transitionOptions) {
    if (!isDefined(hookResult)) return;
    var tplData = {tid: parse("transition.$id")(transitionOptions), digest: this.approximateDigests, hookResult: this._stringify(hookResult), transitionResult: this._stringify(transitionResult)};
    this._trace(tpl('Transition #{tid} Digest #{digest}:   Hook returned: {hookResult} -> {transitionResult}', tplData));
  }

  traceResolvePath(path, options) {
    var tplData = {
      tid: parse("transition.$id")(options),
      digest: this.approximateDigests,
      path: path && path.toString(),
      policy: options && options.resolvePolicy
    };
    this._trace(tpl('Transition #{tid} Digest #{digest}:         Resolving {path} ({policy})', tplData));
  }

  traceResolvePathElement(pathElement, resolvablePromises, options) {
    var tplData = {
      tid: parse("transition.$id")(options),
      digest: this.approximateDigests,
      resolvablePromises: objectKeys(resolvablePromises).join(", "),
      pathElement: pathElement && pathElement.toString(),
      policy: options && options.resolvePolicy
    };
    this._trace(tpl('Transition #{tid} Digest #{digest}:         Resolve {pathElement} resolvables: [{resolvablePromises}] ({policy})', tplData));
  }

  traceResolveResolvable(resolvable, options) {
    var tplData = {
      tid: parse("transition.$id")(options),
      digest: this.approximateDigests,
      resolvable: resolvable && resolvable.toString(),
      policy: options && options.resolvePolicy
    };
    this._trace(tpl('Transition #{tid} Digest #{digest}:               Resolving {resolvable} ({policy})', tplData));
  }

  tracePathElementInvoke(pathElement, fn, deps, options) {
    var title = "Invoke " + options.when;
    var tplData = {
      tid: parse("transition.$id")(options),
      digest: this.approximateDigests,
      pathElement: pathElement && pathElement.toString(),
      fn: fn.name || "(anonymous)",
      title: title,
      deps: deps,
      policy: options && options.resolvePolicy
    };
    this._trace(tpl('Transition #{tid} Digest #{digest}:         {title}: {fn} {pathElement} requires: [{deps}]', tplData));
  }

  traceError(error, transition) {
    var tplData = {tid: transition.$id, digest: this.approximateDigests, error: error};
    this._trace(tpl('Transition #{tid} Digest #{digest}: Transition Rejected, reason: {error}', tplData));
  }

  traceSuccess(finalState, transition) {
    var tplData = {tid: transition.$id, digest: this.approximateDigests, state: finalState.name};
    this._trace(tpl('Transition #{tid} Digest #{digest}: Transition Success, state: {state}', tplData));
  }
}

export var trace = new Trace();

angular.module("ui.router").run(function($rootScope) {
  $rootScope.$watch(function() { trace.approximateDigests++; });
});