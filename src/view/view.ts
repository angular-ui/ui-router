/** @module view */ /** for typedoc */
import {equals, applyPairs, removeFrom, TypedMap} from "../common/common";
import {curry, prop} from "../common/hof";
import {isString, isArray} from "../common/predicates";
import {trace} from "../common/trace";
import {PathNode} from "../path/node";

import {ActiveUIView, ViewContext, ViewConfig} from "./interface";
import {_ViewDeclaration} from "../state/interface";

export type ViewConfigFactory = (path: PathNode[], decl: _ViewDeclaration) => ViewConfig|ViewConfig[];

/**
 * The View service
 */
export class ViewService {
  private uiViews: ActiveUIView[] = [];
  private viewConfigs: ViewConfig[] = [];
  private _rootContext: ViewContext;
  private _viewConfigFactories: { [key: string]: ViewConfigFactory } = {};

  constructor() { }

  rootContext(context?: ViewContext): ViewContext {
    return this._rootContext = context || this._rootContext;
  };

  viewConfigFactory(viewType: string, factory: ViewConfigFactory) {
    this._viewConfigFactories[viewType] = factory;
  }

  createViewConfig(path: PathNode[], decl: _ViewDeclaration): ViewConfig[] {
    let cfgFactory = this._viewConfigFactories[decl.$type];
    if (!cfgFactory) throw new Error("ViewService: No view config factory registered for type " + decl.$type);
    let cfgs = cfgFactory(path, decl);
    return isArray(cfgs) ? cfgs : [cfgs];
  }
  
  /**
   * De-registers a ViewConfig.
   *
   * @param viewConfig The ViewConfig view to deregister.
   */
  deactivateViewConfig(viewConfig: ViewConfig) {
    trace.traceViewServiceEvent("<- Removing", viewConfig);
    removeFrom(this.viewConfigs, viewConfig);
  };

  activateViewConfig(viewConfig: ViewConfig) {
    trace.traceViewServiceEvent("-> Registering", <any> viewConfig);
    this.viewConfigs.push(viewConfig);
  };

  sync = () => {
    let uiViewsByFqn: TypedMap<ActiveUIView> =
        this.uiViews.map(uiv => [uiv.fqn, uiv]).reduce(applyPairs, <any> {});

    /**
     * Given a ui-view and a ViewConfig, determines if they "match".
     *
     * A ui-view has a fully qualified name (fqn) and a context object.  The fqn is built from its overall location in
     * the DOM, describing its nesting relationship to any parent ui-view tags it is nested inside of.
     *
     * A ViewConfig has a target ui-view name and a context anchor.  The ui-view name can be a simple name, or
     * can be a segmented ui-view path, describing a portion of a ui-view fqn.
     *
     * In order for a ui-view to match ViewConfig, ui-view's $type must match the ViewConfig's $type
     *
     * If the ViewConfig's target ui-view name is a simple name (no dots), then a ui-view matches if:
     * - the ui-view's name matches the ViewConfig's target name
     * - the ui-view's context matches the ViewConfig's anchor
     *
     * If the ViewConfig's target ui-view name is a segmented name (with dots), then a ui-view matches if:
     * - There exists a parent ui-view where:
     *    - the parent ui-view's name matches the first segment (index 0) of the ViewConfig's target name
     *    - the parent ui-view's context matches the ViewConfig's anchor
     * - And the remaining segments (index 1..n) of the ViewConfig's target name match the tail of the ui-view's fqn
     *
     * Example:
     *
     * DOM:
     * <div ui-view>                        <!-- created in the root context (name: "") -->
     *   <div ui-view="foo">                <!-- created in the context named: "A"      -->
     *     <div ui-view>                    <!-- created in the context named: "A.B"    -->
     *       <div ui-view="bar">            <!-- created in the context named: "A.B.C"  -->
     *       </div>
     *     </div>
     *   </div>
     * </div>
     *
     * uiViews: [
     *  { fqn: "$default",                  creationContext: { name: "" } },
     *  { fqn: "$default.foo",              creationContext: { name: "A" } },
     *  { fqn: "$default.foo.$default",     creationContext: { name: "A.B" } }
     *  { fqn: "$default.foo.$default.bar", creationContext: { name: "A.B.C" } }
     * ]
     *
     * These four view configs all match the ui-view with the fqn: "$default.foo.$default.bar":
     *
     * - ViewConfig1: { uiViewName: "bar",                       uiViewContextAnchor: "A.B.C" }
     * - ViewConfig2: { uiViewName: "$default.bar",              uiViewContextAnchor: "A.B" }
     * - ViewConfig3: { uiViewName: "foo.$default.bar",          uiViewContextAnchor: "A" }
     * - ViewConfig4: { uiViewName: "$default.foo.$default.bar", uiViewContextAnchor: "" }
     *
     * Using ViewConfig3 as an example, it matches the ui-view with fqn "$default.foo.$default.bar" because:
     * - The ViewConfig's segmented target name is: [ "foo", "$default", "bar" ]
     * - There exists a parent ui-view (which has fqn: "$default.foo") where:
     *    - the parent ui-view's name "foo" matches the first segment "foo" of the ViewConfig's target name
     *    - the parent ui-view's context "A" matches the ViewConfig's anchor context "A"
     * - And the remaining segments [ "$default", "bar" ].join("."_ of the ViewConfig's target name match
     *   the tail of the ui-view's fqn "default.bar"
     */
    const matches = (uiView: ActiveUIView) => (viewConfig: ViewConfig) => {
      // Don't supply an ng1 ui-view with an ng2 ViewConfig, etc
      if (uiView.$type !== viewConfig.viewDecl.$type) return false;

      // Split names apart from both viewConfig and uiView into segments
      let vc = viewConfig.viewDecl;
      let vcSegments = vc.$uiViewName.split(".");
      let uivSegments = uiView.fqn.split(".");

      // Check if the tails of the segment arrays match. ex, these arrays' tails match:
      // vc: ["foo", "bar"], uiv fqn: ["$default", "foo", "bar"]
      if (!equals(vcSegments, uivSegments.slice(0 - vcSegments.length)))
        return false;

      // Now check if the fqn ending at the first segment of the viewConfig matches the context:
      // ["$default", "foo"].join(".") == "$default.foo", does the ui-view $default.foo context match?
      let negOffset = (1 - vcSegments.length) || undefined;
      let fqnToFirstSegment = uivSegments.slice(0, negOffset).join(".");
      let uiViewContext = uiViewsByFqn[fqnToFirstSegment].creationContext;
      return vc.$uiViewContextAnchor === (uiViewContext && uiViewContext.name);
    };

    // Return the number of dots in the fully qualified name
    function uiViewDepth(uiView: ActiveUIView) {
      return uiView.fqn.split(".").length;
    }

    // Return the ViewConfig's context's depth in the context tree.
    function viewConfigDepth(config: ViewConfig) {
      let context: ViewContext = config.viewDecl.$context, count = 0;
      while (++count && context.parent) context = context.parent;
      return count;
    }

    // Given a depth function, returns a compare function which can return either ascending or descending order
    const depthCompare = curry((depthFn, posNeg, left, right) => posNeg * (depthFn(left) - depthFn(right)));

    const matchingConfigPair = uiView => {
      let matchingConfigs = this.viewConfigs.filter(matches(uiView));
      if (matchingConfigs.length > 1)
        matchingConfigs.sort(depthCompare(viewConfigDepth, -1)); // descending
      return [uiView, matchingConfigs[0]];
    };

    const configureUIView = ([uiView, viewConfig]) => {
      // If a parent ui-view is reconfigured, it could destroy child ui-views.
      // Before configuring a child ui-view, make sure it's still in the active uiViews array.
      if (this.uiViews.indexOf(uiView) !== -1)
        uiView.configUpdated(viewConfig);
    };

    this.uiViews.sort(depthCompare(uiViewDepth, 1)).map(matchingConfigPair).forEach(configureUIView);
  };

  /**
   * Allows a `ui-view` element to register its canonical name with a callback that allows it to
   * be updated with a template, controller, and local variables.
   *
   * @param {String} name The fully-qualified name of the `ui-view` object being registered.
   * @param {Function} configUpdatedCallback A callback that receives updates to the content & configuration
   *                   of the view.
   * @return {Function} Returns a de-registration function used when the view is destroyed.
   */
  registerUIView(uiView: ActiveUIView) {
    trace.traceViewServiceUIViewEvent("-> Registering", uiView);
    let uiViews = this.uiViews;
    const fqnMatches = uiv => uiv.fqn === uiView.fqn;
    if (uiViews.filter(fqnMatches).length)
      trace.traceViewServiceUIViewEvent("!!!! duplicate uiView named:", uiView);

    uiViews.push(uiView);
    this.sync();

    return () => {
      let idx = uiViews.indexOf(uiView);
      if (idx <= 0) {
        trace.traceViewServiceUIViewEvent("Tried removing non-registered uiView", uiView);
        return;
      }
      trace.traceViewServiceUIViewEvent("<- Deregistering", uiView);
      removeFrom(uiViews)(uiView);
    };
  };

  /**
   * Returns the list of views currently available on the page, by fully-qualified name.
   *
   * @return {Array} Returns an array of fully-qualified view names.
   */
  available() {
    return this.uiViews.map(prop("fqn"));
  }

  /**
   * Returns the list of views on the page containing loaded content.
   *
   * @return {Array} Returns an array of fully-qualified view names.
   */
  active() {
    return this.uiViews.filter(prop("$config")).map(prop("name"));
  }

  /**
   * Normalizes a view's name from a state.views configuration block.
   *
   * @param context the context object (state declaration) that the view belongs to
   * @param rawViewName the name of the view, as declared in the [[StateDeclaration.views]]
   *
   * @returns the normalized uiViewName and uiViewContextAnchor that the view targets
   */
  static normalizeUIViewTarget(context: ViewContext, rawViewName = "") {
    // TODO: Validate incoming view name with a regexp to allow:
    // ex: "view.name@foo.bar" , "^.^.view.name" , "view.name@^.^" , "" ,
    // "@" , "$default@^" , "!$default.$default" , "!foo.bar"
    let viewAtContext: string[] = rawViewName.split("@");
    let uiViewName = viewAtContext[0] || "$default";  // default to unnamed view
    let uiViewContextAnchor = isString(viewAtContext[1]) ? viewAtContext[1] : "^";    // default to parent context

    // Handle relative view-name sugar syntax.
    // Matches rawViewName "^.^.^.foo.bar" into array: ["^.^.^.foo.bar", "^.^.^", "foo.bar"],
    let relativeViewNameSugar = /^(\^(?:\.\^)*)\.(.*$)/.exec(uiViewName);
    if (relativeViewNameSugar) {
      // Clobbers existing contextAnchor (rawViewName validation will fix this)
      uiViewContextAnchor = relativeViewNameSugar[1]; // set anchor to "^.^.^"
      uiViewName = relativeViewNameSugar[2]; // set view-name to "foo.bar"
    }

    if (uiViewName.charAt(0) === '!') {
      uiViewName = uiViewName.substr(1);
      uiViewContextAnchor = ""; // target absolutely from root
    }

    // handle parent relative targeting "^.^.^"
    let relativeMatch = /^(\^(?:\.\^)*)$/;
    if (relativeMatch.exec(uiViewContextAnchor)) {
      let anchor = uiViewContextAnchor.split(".").reduce(((anchor, x) => anchor.parent), context);
      uiViewContextAnchor = anchor.name;
    }

    return {uiViewName, uiViewContextAnchor};
  }
}