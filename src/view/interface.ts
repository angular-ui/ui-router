/** @module view */ /** for typedoc */
import {_ViewDeclaration} from "../state/interface";
import {PathNode} from "../path/node";

/**
 * The context ref can be anything that has a `name` and a `parent` reference to another IContextRef
 */
export interface ViewContext {
  name: string;
  parent: ViewContext;
}

/** @hidden */
export interface ActiveUIView {
  /** type of framework, e.g., "ng1" or "ng2" */
  $type: string;
  /** An auto-incremented id */
  id: number;
  /** The ui-view short name */
  name: string;
  /** The ui-view's fully qualified name */
  fqn: string;
  /** The ViewConfig that is currently loaded into the ui-view */
  config: ViewConfig;
  /** The state context in which the ui-view tag was created. */
  creationContext: ViewContext;
  /** A callback that should apply a ViewConfig (or clear the ui-view, if config is undefined) */
  configUpdated: (config: ViewConfig) => void;
}

/**
 * This interface represents a [[ViewDeclaration]] that is bound to a [[PathNode]].
 *
 * A `ViewConfig` is the runtime definition of a single view.
 *
 * During a transition, `ViewConfig`s are created for each [[ViewDeclaration]] defined on each "entering" [[State]].
 * Then, the [[ViewService]] finds any matching `ui-view`(s) in the DOM, and supplies the ui-view
 * with the `ViewConfig`.  The `ui-view` then loads itself using the information found in the `ViewConfig`.
 *
 * A `ViewConfig` if matched with a `ui-view` by finding all `ui-view`s which were created in the
 * context named by the `uiViewContextAnchor`, and finding the `ui-view` or child `ui-view` that matches
 * the `uiViewName` address.
 */
export interface ViewConfig {
  /* The unique id for the ViewConfig instance */
  $id: number;
  /** The normalized view declaration from [[State.views]] */
  viewDecl: _ViewDeclaration;

  /** The node the ViewConfig is bound to */
  path: PathNode[];

  /** Fetches templates, runs dynamic (controller|template)Provider code, lazy loads Components, etc */
  load(): Promise<ViewConfig>;
  
  loaded: boolean;
}
