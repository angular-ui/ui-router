import UrlMatcher from "../url/urlMatcher";
import ParamSet from "../params/paramSet";

import {IViewContext} from "../view/interface"
import PathContext from "../resolve/pathContext"


/** Context obj, State-view definition, transition params */
export interface IStateViewConfig {
  view: IViewDeclaration, // A view block from a state config
  name: string, // The name of the view block
  params: any // State params?
  context: IViewContext, // The context object reference
  pathContext: PathContext, // The Resolve context (rename class!)
}

/** View declaration inside state declaration */
export interface IViewDeclaration {
  controllerProvider?: Function;
  controller?: any;
  template?: any;
  templateUrl?: any;
  templateProvider?: Function;
}

/** hash of strings->views */
interface IViewDeclarations     { [key:string]: IViewDeclaration; }
/** hash of strings->resolve fns */
interface IResolveDeclarations  { [key:string]: Function; }
/** hash of strings->param declarations */
// If the value is of type 'any', then it is syntax sugar for an IParamDeclaration { value: value }
interface IParamsDeclaration    { [key:string]: (IParamDeclaration|any) }
/** declaration of single state param */
interface IParamDeclaration {
  value: any;
  squash: (boolean|string);
}

/** state declaration */
export interface IStateDeclaration extends IViewDeclaration {
  name: string;
  abstract: boolean;
  parent: (string|IStateDeclaration);
  resolve: IResolveDeclarations; // name->Function
  resolvePolicy: (string|Object);
  url: string;
  params: IParamsDeclaration;
  views: IViewDeclarations;
  data: any;
  // TODO: finish defining state definition API.  Maybe start with what's on Definitely Typed.
}

/** internal state API */
export interface IState {
  name: string;
  abstract: boolean;
  parent: IState;
  resolve: IResolveDeclarations; // name->Function
  resolvePolicy: (string|Object);
  url: UrlMatcher;
  params: ParamSet;
  ownParams: ParamSet;
  views: IViewDeclarations;
  self: IStateDeclaration;
  root: () => IState;
  navigable: IState;
  path: IState[];
  data: any;
  includes: (name: string) => boolean;
}

export interface IStateParams {
  $digest: () => void,
  $inherit: (newParams, $current: IState, $to: IState) => IStateParams
  $set: (params, url) => boolean,
  $sync: () => IStateParams,
  $off: () => IStateParams,
  $raw: () => any,
  $localize: () => IStateParams,
  $observe: (key, fn) => () => void
}