import {ViewConfig} from "./view";

/** The context ref can be anything that has a `name` and a `parent` reference to another IContextRef */
export interface IContextRef {
  name: string;
  parent: IContextRef;
}

// Either Typescript transpile or SystemJS seems to want something concrete to be exported
export var foo = undefined;

export interface IUiViewData {
  id: number;
  name: string;
  fqn: string;
  config: any;
  // The context in which the ui-view tag was created.
  creationContext: IContextRef;
  configUpdated: (config: ViewConfig) => void;
}