var trace = new Trace();

function Trace() {
  function trace(string) {
    console.log(string);
  }

  function stringify(o) {
    var format = pattern([
      [not(isDefined),            val("undefined")],
      [isNull,                    val("null")],
      [isPromise,                 promiseToString],
      [is(Transition),            invoke("toString")],
      [is(Resolvable),            invoke("toString")],
      [isFunction,                fnToString],
      [val(true),                 angular.identity]
    ]);

    function promiseToString(p) {
      if (is(TransitionRejection)(p.reason)) return p.reason.toString();
      return "Promise(" + JSON.stringify(p) + ")";
    }
    function fnToString(fn) {
      var name = fn.name ? fn.name : "(anonymous)";
      return tpl("function {name}(...)", { name: name });
    }

    function toJson(o) {
      function replacer(key, val) {
        return format(val);
      }
      return JSON.stringify(o, replacer)
    }

    return toJson(o);
  }


  this.traceTransitionStart = function traceTransitionStart(transition) {
    var tplData = {tid: transition.$id, digest: Trace.prototype.approximateDigests, transition: stringify(transition)};
    trace(tpl('Transition #{tid} Digest #{digest}: Started {transition}', tplData));
  };


  this.traceTransitionIgnored = function traceTransitionIgnored(transition) {
    var tplData = {tid: transition.$id, digest: Trace.prototype.approximateDigests, transition: stringify(transition)};
    trace(tpl('Transition #{tid} Digest #{digest}: Ignored {transition}', tplData));
  };


  this.traceHookInvocation = function traceHookInvocation(step, options) {
    var tplData = {tid: parse("transition.$id")(options), digest: Trace.prototype.approximateDigests, step: step.toString()};
    trace(tpl('Transition #{tid} Digest #{digest}:   Hook: {step}', tplData));
  };


  this.traceHookResult = function traceHookResult(hookResult, transitionResult, transitionOptions) {
    if (!isDefined(hookResult)) return;
    var tplData = {tid: parse("transition.$id")(transitionOptions), digest: Trace.prototype.approximateDigests, hookResult: stringify(hookResult), transitionResult: stringify(transitionResult)};
    trace(tpl('Transition #{tid} Digest #{digest}:   Hook returned: {hookResult} -> {transitionResult}', tplData));
  };


  this.traceResolvePath = function traceResolvePath(path, options) {
    var tplData = {
      tid: parse("transition.$id")(options),
      digest: Trace.prototype.approximateDigests,
      path: path && path.toString(),
      policy: options && options.resolvePolicy
    };
    trace(tpl('Transition #{tid} Digest #{digest}:         Resolving {path} ({policy})', tplData));
  };


  this.traceResolvePathElement = function traceResolvePathElement(pathElement, resolvablePromises, options) {
    var tplData = {
      tid: parse("transition.$id")(options),
      digest: Trace.prototype.approximateDigests,
      resolvablePromises: objectKeys(resolvablePromises).join(", "),
      pathElement: pathElement && pathElement.toString(),
      policy: options && options.resolvePolicy
    };
    trace(tpl('Transition #{tid} Digest #{digest}:         Resolve {pathElement} resolvables: [{resolvablePromises}] ({policy})', tplData));
  };


  this.traceResolveResolvable = function traceResolveResolvable(resolvable, options) {
    var tplData = {
      tid: parse("transition.$id")(options),
      digest: Trace.prototype.approximateDigests,
      resolvable: resolvable && resolvable.toString(),
      policy: options && options.resolvePolicy
    };
    trace(tpl('Transition #{tid} Digest #{digest}:               Resolving {resolvable} ({policy})', tplData));
  };


  this.tracePathElementInvoke = function tracePathElementInvoke(pathElement, fn, deps, options) {
    var title = "Invoke " + options.when;
    var tplData = {
      tid: parse("transition.$id")(options),
      digest: Trace.prototype.approximateDigests,
      pathElement: pathElement && pathElement.toString(),
      fn: fn.name || "(anonymous)",
      title: title,
      deps: deps,
      policy: options && options.resolvePolicy
    };
    trace(tpl('Transition #{tid} Digest #{digest}:         {title}: {fn} {pathElement} requires: [{deps}]', tplData));
  };


  this.traceError = function traceError(error, transition) {
    var tplData = {tid: transition.$id, digest: Trace.prototype.approximateDigests, error: error};
    trace(tpl('Transition #{tid} Digest #{digest}: Transition Rejected, reason: {error}', tplData));
  };


  this.traceSuccess = function traceSuccess(finalState, transition) {
    var tplData = {tid: transition.$id, digest: Trace.prototype.approximateDigests, state: finalState.name};
    trace(tpl('Transition #{tid} Digest #{digest}: Transition Success, state: {state}', tplData));
  }
}

Trace.prototype.approximateDigests = 0;

angular.module("ui.router").run(function($rootScope) {
  $rootScope.$watch(function() { Trace.prototype.approximateDigests++; });
});