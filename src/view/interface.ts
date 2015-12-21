/** @module view */ /** for typedoc */
import {ViewConfig} from "./module";

/** The context ref can be anything that has a `name` and a `parent` reference to another IContextRef */
export interface ViewContext {
  name: string;
  parent: ViewContext;
}

/** @hidden */
export interface UIViewData {
  id: number;
  name: string;
  fqn: string;
  config: any;
  // The context in which the ui-view tag was created.
  creationContext: ViewContext;
  configUpdated: (config: ViewConfig) => void;
}