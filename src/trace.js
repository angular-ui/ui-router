var trace = new Trace();

function Trace() {

  function stringify(o) {
    function promiseToString(p) {
      if (is(TransitionRejection)(p.reason)) return p.reason.toString();
      return "Promise(" + JSON.stringify(p) + ")";
    }

    return pattern([
      [not(isDefined),            val("undefined")],
      [isNull,                    val("null")],
      [isPromise,                 promiseToString],
      [is(Transition),            invoke("toString")],
      [val(true),                 JSON.stringify]
    ])(o);
  }

  this.traceTransitionStart = function traceTransitionStart(transition) {
    var tplData = {tid: transition.$id, digest: Trace.prototype.approximateDigests, transition: stringify(transition)};
    console.log(tpl('Transition #{tid} Digest #{digest}: Started {transition}', tplData));
  };

  this.traceHookInvocation = function traceHookInvocation(step, options) {
    var tplData = {tid: parse("transition.$id")(options), digest: Trace.prototype.approximateDigests, step: step.toString()};
    console.log(tpl('Transition #{tid} Digest #{digest}:   Hook Invoked: {step}', tplData));
  };

  this.traceHookResult = function traceHookResult(hookResult, transitionResult, transitionOptions) {
    var tplData = {tid: parse("transition.$id")(transitionOptions), digest: Trace.prototype.approximateDigests, hookResult: stringify(hookResult), transitionResult: stringify(transitionResult)};
    if (!isDefined(hookResult)) return;
    console.log(tpl('Transition #{tid} Digest #{digest}:     Hook returned: {hookResult} -> {transitionResult}', tplData));
  };

  this.traceError = function traceError(error, transition) {
    var tplData = {tid: transition.$id, digest: Trace.prototype.approximateDigests, error: error};
    console.log(tpl('Transition #{tid} Digest #{digest}: Rejected, reason: {error}', tplData));
  };

  this.traceSuccess = function traceSuccess(finalState, transition) {
    var tplData = {tid: transition.$id, digest: Trace.prototype.approximateDigests, state: finalState.name};
    console.log(tpl('Transition #{tid} Digest #{digest}: Success, final state: {state}', tplData));
  }
}

Trace.prototype.approximateDigests = 0;

angular.module("ui.router").run(function($rootScope) {
  $rootScope.$watch(function() { Trace.prototype.approximateDigests++; });
});