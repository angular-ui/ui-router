/**
 * UI-Router Transition Tracing
 *
 * Enable transition tracing to print transition information to the console, in order to help debug your application.
 * Tracing logs detailed information about each Transition to your console.
 *
 * To enable tracing, import the [[trace]] singleton and enable one or more categories.
 *
 * ES6
 * ```
 *
 * import {trace} from "ui-router-ng2"; // or "angular-ui-router"
 * trace.enable(1, 5); // TRANSITION and VIEWCONFIG
 * ```
 *
 * CJS
 * ```
 *
 * let trace = require("angular-ui-router").trace; // or "ui-router-ng2"
 * trace.enable("TRANSITION", "VIEWCONFIG");
 * ```
 *
 * Globals
 * ```
 *
 * let trace = window["angular-ui-router"].trace; // or "ui-router-ng2"
 * trace.enable(); // Trace everything (very verbose)
 * ```
 *
 * @module trace
 */ /** for typedoc */
import {parse} from "../common/hof";
import {isNumber} from "../common/predicates";
import {Transition}  from "../transition/transition";
import {ActiveUIView, ViewConfig}  from "../view/interface";
import {stringify, functionToString, maxLength, padString} from "./strings";

/** @hidden */
function uiViewString (viewData) {
    if (!viewData) return 'ui-view (defunct)';
    return `ui-view id#${viewData.id}, contextual name '${viewData.name}@${viewData.creationContext}', fqn: '${viewData.fqn}'`;
}

/** @hidden */
const viewConfigString = (viewConfig: ViewConfig) =>
    `ViewConfig targeting ui-view: '${viewConfig.viewDecl.$uiViewName}@${viewConfig.viewDecl.$uiViewContextAnchor}', context: '${viewConfig.viewDecl.$context.name}'`;

/** @hidden */
function normalizedCat(input: Category): string {
  return isNumber(input) ? Category[input] : Category[Category[input]];
}


/**
 * Trace categories
 *
 * [[Trace.enable]] or [[Trace.disable]] a category
 *
 * `trace.enable(Category.TRANSITION)`
 *
 * These can also be provided using a matching string, or position ordinal
 *
 * `trace.enable("TRANSITION")`
 *
 * `trace.enable(1)`
 */
export enum Category {
  RESOLVE, TRANSITION, HOOK, INVOKE, UIVIEW, VIEWCONFIG
}

/**
 * Prints UI-Router Transition trace information to the console.
 */
export class Trace {
  approximateDigests: number;

  constructor() {
    this.approximateDigests = 0;
  }

  /** @hidden */
  private _enabled: { [key: string]: boolean } = {};

   /** @hidden */
  private _set(enabled: boolean, categories: Category[]) {
    if (!categories.length) {
      categories = Object.keys(Category)
          .filter(k => isNaN(parseInt(k, 10)))
          .map(key => Category[key]);
    }
    categories.map(normalizedCat).forEach(category => this._enabled[category] = enabled);
  }

  /**
   * Enables a trace [[Category]]
   *
   * ```
   * trace.enable("TRANSITION");
   * ```
   *
   * @param categories categories to enable. If `categories` is omitted, all categories are enabled.
   *        Also takes strings (category name) or ordinal (category position)
   */
  enable(...categories: Category[]) { this._set(true, categories) }
  /**
   * Disables a trace [[Category]]
   *
   * ```
   * trace.disable("VIEWCONFIG");
   * ```
   *
   * @param categories categories to disable. If `categories` is omitted, all categories are disabled.
   *        Also takes strings (category name) or ordinal (category position)
   */
  disable(...categories: Category[]) { this._set(false, categories) }

  /**
   * Retrieves the enabled stateus of a [[Category]]
   *
   * ```
   * trace.enabled("VIEWCONFIG"); // true or false
   * ```
   *
   * @returns boolean true if the category is enabled
   */
  enabled(category: Category): boolean {
    return !!this._enabled[normalizedCat(category)];
  }

  /** called by ui-router code */
  traceTransitionStart(transition: Transition) {
    if (!this.enabled(Category.TRANSITION)) return;
    let tid = transition.$id,
        digest = this.approximateDigests,
        transitionStr = stringify(transition);
    console.log(`Transition #${tid} Digest #${digest}: Started  -> ${transitionStr}`);
  }

  /** called by ui-router code */
  traceTransitionIgnored(transition: Transition) {
    if (!this.enabled(Category.TRANSITION)) return;
    let tid = transition.$id,
        digest = this.approximateDigests,
        transitionStr = stringify(transition);
    console.log(`Transition #${tid} Digest #${digest}: Ignored  <> ${transitionStr}`);
  }

  /** called by ui-router code */
  traceHookInvocation(step, options) {
    if (!this.enabled(Category.HOOK)) return;
    let tid = parse("transition.$id")(options),
        digest = this.approximateDigests,
        event = parse("traceData.hookType")(options) || "internal",
        context = parse("traceData.context.state.name")(options) || parse("traceData.context")(options) || "unknown",
        name = functionToString(step.fn);
    console.log(`Transition #${tid} Digest #${digest}:   Hook -> ${event} context: ${context}, ${maxLength(200, name)}`);
  }

  /** called by ui-router code */
  traceHookResult(hookResult, transitionResult, transitionOptions) {
    if (!this.enabled(Category.HOOK)) return;
    let tid = parse("transition.$id")(transitionOptions),
        digest = this.approximateDigests,
        hookResultStr = stringify(hookResult),
        transitionResultStr = stringify(transitionResult);
    console.log(`Transition #${tid} Digest #${digest}:   <- Hook returned: ${maxLength(200, hookResultStr)}, transition result: ${maxLength(200, transitionResultStr)}`);
  }

  /** called by ui-router code */
  traceResolvePath(path, options) {
    if (!this.enabled(Category.RESOLVE)) return;
    let tid = parse("transition.$id")(options),
        digest = this.approximateDigests,
        pathStr = path && path.toString(),
        policyStr = options && options.resolvePolicy;
    console.log(`Transition #${tid} Digest #${digest}:         Resolving ${pathStr} (${policyStr})`);
  }

  /** called by ui-router code */
  traceResolvePathElement(pathElement, resolvablePromises, options) {
    if (!this.enabled(Category.RESOLVE)) return;
    if (!resolvablePromises.length) return;
    let tid = parse("transition.$id")(options),
        digest = this.approximateDigests,
        resolvablePromisesStr = Object.keys(resolvablePromises).join(", "),
        pathElementStr = pathElement && pathElement.toString(),
        policyStr = options && options.resolvePolicy;
    console.log(`Transition #${tid} Digest #${digest}:         Resolve ${pathElementStr} resolvables: [${resolvablePromisesStr}] (${policyStr})`);
  }

  /** called by ui-router code */
  traceResolveResolvable(resolvable, options) {
    if (!this.enabled(Category.RESOLVE)) return;
    let tid = parse("transition.$id")(options),
        digest = this.approximateDigests,
        resolvableStr = resolvable && resolvable.toString();
    console.log(`Transition #${tid} Digest #${digest}:               Resolving -> ${resolvableStr}`);
  }

  /** called by ui-router code */
  traceResolvableResolved(resolvable, options) {
    if (!this.enabled(Category.RESOLVE)) return;
    let tid = parse("transition.$id")(options),
        digest = this.approximateDigests,
        resolvableStr = resolvable && resolvable.toString(),
        result = stringify(resolvable.data);
    console.log(`Transition #${tid} Digest #${digest}:               <- Resolved  ${resolvableStr} to: ${maxLength(200, result)}`);
  }

  /** called by ui-router code */
  tracePathElementInvoke(node, fn, deps, options) {
    if (!this.enabled(Category.INVOKE)) return;
    let tid = parse("transition.$id")(options),
        digest = this.approximateDigests,
        stateName = node && node.state && node.state.toString(),
        fnName = functionToString(fn);
    console.log(`Transition #${tid} Digest #${digest}:         Invoke ${options.when}: context: ${stateName} ${maxLength(200, fnName)}`);
  }

  /** called by ui-router code */
  traceError(error, transition: Transition) {
    if (!this.enabled(Category.TRANSITION)) return;
    let tid = transition.$id,
        digest = this.approximateDigests,
        transitionStr = stringify(transition);
    console.log(`Transition #${tid} Digest #${digest}: <- Rejected ${transitionStr}, reason: ${error}`);
  }

  /** called by ui-router code */
  traceSuccess(finalState, transition: Transition) {
    if (!this.enabled(Category.TRANSITION)) return;
    let tid = transition.$id,
        digest = this.approximateDigests,
        state = finalState.name,
        transitionStr = stringify(transition);
    console.log(`Transition #${tid} Digest #${digest}: <- Success  ${transitionStr}, final state: ${state}`);
  }

  /** called by ui-router code */
  traceUiViewEvent(event: string, viewData: ActiveUIView, extra = "") {
    if (!this.enabled(Category.UIVIEW)) return;
    console.log(`ui-view: ${padString(30, event)} ${uiViewString(viewData)}${extra}`);
  }

  /** called by ui-router code */
  traceUiViewConfigUpdated(viewData: ActiveUIView, context) {
    if (!this.enabled(Category.UIVIEW)) return;
    this.traceUiViewEvent("Updating", viewData, ` with ViewConfig from context='${context}'`);
  }

  /** called by ui-router code */
  traceUiViewScopeCreated(viewData: ActiveUIView, newScope) {
    if (!this.enabled(Category.UIVIEW)) return;
    this.traceUiViewEvent("Created scope for", viewData, `, scope #${newScope.$id}`);
  }

  /** called by ui-router code */
  traceUiViewFill(viewData: ActiveUIView, html) {
    if (!this.enabled(Category.UIVIEW)) return;
    this.traceUiViewEvent("Fill", viewData, ` with: ${maxLength(200, html)}`);
  }

  /** called by ui-router code */
  traceViewServiceEvent(event: string, viewConfig: ViewConfig) {
    if (!this.enabled(Category.VIEWCONFIG)) return;
    console.log(`$view.ViewConfig: ${event} ${viewConfigString(viewConfig)}`);
  }

  /** called by ui-router code */
  traceViewServiceUiViewEvent(event: string, viewData: ActiveUIView) {
    if (!this.enabled(Category.VIEWCONFIG)) return;
    console.log(`$view.ViewConfig: ${event} ${uiViewString(viewData)}`);
  }
}

/**
 * The [[Trace]] singleton
 *
 * @example
 * ```js
 *
 * import {trace} from "angular-ui-router";
 * trace.enable(1, 5);
 * ```
 */
let trace = new Trace();
export {trace};