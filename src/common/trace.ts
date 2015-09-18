import {isNull, isPromise, isNumber, fnToString, isInjectable, is, invoke, not, val, pattern, parse, isDefined, identity} from "../common/common";
import Resolvable  from "../resolve/resolvable";
import {Transition}  from "../transition/transition";
import {TransitionRejection}  from "../transition/rejectFactory";
import {IUiViewData}  from "../view/interface";
import {ViewConfig}  from "../view/view";

function promiseToString(p) {
  if (is(TransitionRejection)(p.reason)) return p.reason.toString();
  return `Promise(${JSON.stringify(p)})`;
}

const uiViewString = (viewData) =>
    `ui-view id#${viewData.id}, contextual name '${viewData.name}@${viewData.creationContext}', fqn: '${viewData.fqn}'`;

const viewConfigString = (viewConfig: ViewConfig) =>
    `ViewConfig targeting ui-view: '${viewConfig.uiViewName}@${viewConfig.uiViewContextAnchor}', context: '${viewConfig.context.name}'`;

function normalizedCat(input: Category): string {
  return isNumber(input) ? Category[input] : Category[Category[input]];
}

function padString(length: number, str: string) {
  while (str.length < length) str += " ";
  return str;
}

function maxLength(max: number, str: string) {
  if (str.length <= max) return str;
  return str.substr(0, max - 3) + "...";

}

enum Category {
  RESOLVE, TRANSITION, HOOK, INVOKE, UIVIEW, VIEWCONFIG
}

class Trace {
  approximateDigests: number;
  format = pattern([
    [not(isDefined),            val("undefined")],
    [isNull,                    val("null")],
    [isPromise,                 promiseToString],
    [is(Transition),            invoke("toString")],
    [is(Resolvable),            invoke("toString")],
    [isInjectable,              fnToString],
    [val(true),                 identity]
  ]);

  constructor() {
    this.approximateDigests = 0;
  }

  private _enabled: { [key: string]: boolean } = {};

  private _set(enabled: boolean, categories: Category[]) {
    if (!categories.length) {
      categories = Object.keys(Category)
          .filter(k => isNaN(parseInt(k, 10)))
          .map(key => Category[key]);
    }
    categories.map(normalizedCat).forEach(category => this._enabled[category] = enabled);
  }

  // TODO: Document enable(categories)
  enable = (...categories: Category[]) => this._set(true, categories);
  // TODO: Document disable(categories)
  disable = (...categories: Category[]) => this._set(false, categories);

  // TODO: Document enabled(category)
  enabled(category: Category) {
    return !!this._enabled[normalizedCat(category)];
  }

  _replacer(key, val) {
    return this.format(val);
  }

  _stringify(o) {
    return JSON.stringify(o, (key, val) => this._replacer(key, val)).replace(/\\"/g, '"');
  }

  _trace(string) {
    console.log(string);
  }

  traceTransitionStart(transition: Transition) {
    if (!this.enabled(Category.TRANSITION)) return;
    let tid = transition.$id,
      digest = this.approximateDigests,
      transitionStr = this._stringify(transition);
    this._trace(`Transition #${tid} Digest #${digest}: Started  -> ${transitionStr}`);
  }

  traceTransitionIgnored(transition: Transition) {
    if (!this.enabled(Category.TRANSITION)) return;
    let tid = transition.$id,
      digest = this.approximateDigests,
      transitionStr = this._stringify(transition);
    this._trace(`Transition #${tid} Digest #${digest}: Ignored  <> ${transitionStr}`);
  }

  traceHookInvocation(step, options) {
    if (!this.enabled(Category.HOOK)) return;
    let tid = parse("transition.$id")(options),
      digest = this.approximateDigests;
    this._trace(`Transition #${tid} Digest #${digest}:   Hook -> ${step.toString()}`);
  }

  traceHookResult(hookResult, transitionResult, transitionOptions) {
    if (!this.enabled(Category.HOOK)) return;
    let tid = parse("transition.$id")(transitionOptions),
      digest = this.approximateDigests,
      hookResultStr = this._stringify(hookResult),
      transitionResultStr = this._stringify(transitionResult);
    this._trace(`Transition #${tid} Digest #${digest}:   Hook <- returned: ${hookResultStr}, transition result: ${transitionResultStr}`);
  }

  traceResolvePath(path, options) {
    if (!this.enabled(Category.RESOLVE)) return;
    let tid = parse("transition.$id")(options),
      digest = this.approximateDigests,
      pathStr = path && path.toString(),
      policyStr = options && options.resolvePolicy;
    this._trace(`Transition #${tid} Digest #${digest}:         Resolving ${pathStr} (${policyStr})`);
  }

  traceResolvePathElement(pathElement, resolvablePromises, options) {
    if (!this.enabled(Category.RESOLVE)) return;
    if (!resolvablePromises.length) return;
    let tid = parse("transition.$id")(options),
      digest = this.approximateDigests,
      resolvablePromisesStr = Object.keys(resolvablePromises).join(", "),
      pathElementStr = pathElement && pathElement.toString(),
      policyStr = options && options.resolvePolicy;
    this._trace(`Transition #${tid} Digest #${digest}:         Resolve ${pathElementStr} resolvables: [${resolvablePromisesStr}] (${policyStr})`);
  }

  traceResolveResolvable(resolvable, options) {
    if (!this.enabled(Category.RESOLVE)) return;
    let tid = parse("transition.$id")(options),
      digest = this.approximateDigests,
      resolvableStr = resolvable && resolvable.toString();
    this._trace(`Transition #${tid} Digest #${digest}:               Resolving -> ${resolvableStr}`);
  }

  traceResolvableResolved(resolvable, options) {
    if (!this.enabled(Category.RESOLVE)) return;
    let tid = parse("transition.$id")(options),
      digest = this.approximateDigests,
      resolvableStr = resolvable && resolvable.toString();
    this._trace(`Transition #${tid} Digest #${digest}:               Resolved  <- ${resolvableStr} to: ${resolvable.data}`);
  }

  tracePathElementInvoke(pathElement, fn, deps, options) {
    if (!this.enabled(Category.INVOKE)) return;
    let tid = parse("transition.$id")(options),
      digest = this.approximateDigests,
      pathElementStr = pathElement && pathElement.toString(),
      fnName = fnToString(fn);
    this._trace(`Transition #${tid} Digest #${digest}:         Invoke ${options.when}: context: ${pathElementStr} ${fnName}`);
  }

  traceError(error, transition: Transition) {
    if (!this.enabled(Category.TRANSITION)) return;
    let tid = transition.$id,
      digest = this.approximateDigests,
      transitionStr = this._stringify(transition);
    this._trace(`Transition #${tid} Digest #${digest}: Rejected <- ${transitionStr}, reason: ${error}`);
  }

  traceSuccess(finalState, transition: Transition) {
    if (!this.enabled(Category.TRANSITION)) return;
    let tid = transition.$id,
      digest = this.approximateDigests,
      state = finalState.name,
      transitionStr = this._stringify(transition);
    this._trace(`Transition #${tid} Digest #${digest}: Success  <- ${transitionStr}, final state: ${state}`);
  }

  traceUiViewEvent(event: string, viewData: IUiViewData, extra = "") {
    if (!this.enabled(Category.UIVIEW)) return;
    this._trace(`ui-view: ${padString(30, event)} ${uiViewString(viewData)}${extra}`);
  }

  traceUiViewConfigUpdated(viewData: IUiViewData, context) {
    if (!this.enabled(Category.UIVIEW)) return;
    this.traceUiViewEvent("Updating", viewData, ` with ViewConfig from context='${context}'`);
  }

  traceUiViewScopeCreated(viewData: IUiViewData, newScope) {
    if (!this.enabled(Category.UIVIEW)) return;
    this.traceUiViewEvent("Created scope for", viewData, `, scope #${newScope.$id}`);
  }

  traceUiViewFill(viewData: IUiViewData, html) {
    if (!this.enabled(Category.UIVIEW)) return;
    this.traceUiViewEvent("Fill", viewData, ` with: ${maxLength(60, html)}`);
  }

  traceViewServiceEvent(event: string, viewConfig: ViewConfig) {
    if (!this.enabled(Category.VIEWCONFIG)) return;
    this._trace(`$view.ViewConfig: ${event} ${viewConfigString(viewConfig)}`);
  }

  traceViewServiceUiViewEvent(event: string, viewData: IUiViewData) {
    if (!this.enabled(Category.VIEWCONFIG)) return;
    this._trace(`$view.ViewConfig: ${event} ${uiViewString(viewData)}`);
  }
}

let trace = new Trace();
export default trace;

watchDigests.$inject = ['$rootScope'];
function watchDigests($rootScope) {
  $rootScope.$watch(function() { trace.approximateDigests++; });
}

angular.module("ui.router").run(watchDigests);
angular.module("ui.router").service("$trace", () => trace);