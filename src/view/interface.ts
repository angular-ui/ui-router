/** @module view */ /** for typedoc */
import {_ViewDeclaration} from "../state/interface";
import {Node} from "../path/node";

/**
 * The context ref can be anything that has a `name` and a `parent` reference to another IContextRef
 */
export interface ViewContext {
  name: string;
  parent: ViewContext;
}

/** @hidden */
export interface ActiveUIView {
  id: number;
  name: string;
  fqn: string;
  config: ViewConfig;
  // The context in which the ui-view tag was created.
  creationContext: ViewContext;
  configUpdated: (config: ViewConfig) => void;
}

/**
 * This interface represents a [[ViewDeclaration]] that is bound to a [[Node]].
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
  /** The normalized view declaration from [[State.views]] */
  viewDecl: _ViewDeclaration;

  /** The node the ViewConfig is bound to */
  node: Node;

  /** Fetches templates, runs dynamic (controller|template)Provider code, lazy loads Components, etc */
  load(): Promise<ViewConfig>;
  
  loaded: boolean;
}
