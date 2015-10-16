import {IPromise} from "angular";

import UrlMatcher from "../url/urlMatcher";

import {IRawParams, IParamsOrArray} from "../params/interface";
import Param from "../params/param";

import {IContextRef} from "../view/interface";

import TargetState from "./targetState";
import {State} from "./state";

import {ITransitionOptions} from "../transition/interface";
import {Transition} from "../transition/transition";

export type IStateOrName = (string|IStateDeclaration|State);

/** Context obj, State-view definition, transition params */
export interface IStateViewConfig {
  viewDeclarationObj:   IViewDeclaration; // A view block from a state config
  rawViewName:          string;           // The name of the view block
  params:               any;              // State params?
  context:              IContextRef;      // The context object reference this ViewConfig belongs to
}

/** View declaration inside state declaration */
export interface IViewDeclaration {
  controllerProvider?:  Function;
  controller?:          (Function|string);
  controllerAs?:         string;

  template?:            (Function|string);
  templateUrl?:         string;
  templateProvider?:    Function;
}

/** hash of strings->views */
export interface IViewDeclarations     { [key: string]: IViewDeclaration; }
/** hash of strings->resolve fns */
export interface IResolveDeclarations  { [key: string]: Function; }
/** hash of strings->param declarations */
// If the value is of type 'any', then it is syntax sugar for an IParamDeclaration { value: value }
interface IParamsDeclaration    { [key: string]: (IParamDeclaration|any); }
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
  onEnter: Function;
  onRetain: Function;
  onExit: Function;
  // TODO: finish defining state definition API.  Maybe start with what's on Definitely Typed.
}

export interface IStateParams {
  $digest: () => void;
  $inherit: (newParams, $current: State, $to: State) => IStateParams;
  $set: (params, url) => boolean;
  $sync: () => IStateParams;
  $off: () => IStateParams;
  $raw: () => any;
  $localize: () => IStateParams;
  $observe: (key, fn) => () => void;
}

export interface IHrefOptions {
  relative?:  IStateOrName;
  lossy?:     boolean;
  inherit?:   boolean;
  absolute?:  boolean;
}

export interface IStateProvider {
  state(state: IStateDeclaration): IStateProvider;
  state(name: string, state: IStateDeclaration): IStateProvider;
  onInvalid(callback: Function): void;
  decorator(name: string, func: Function);
}

export interface IStateService {
  params:       any; // TODO: StateParams
  current:      IStateDeclaration;
  $current:     State;
  transition:   Transition;
  reload        (stateOrName: IStateOrName): IPromise<State>;
  targetState   (identifier: IStateOrName, params: IParamsOrArray, options: ITransitionOptions): TargetState;
  go            (to: IStateOrName, params: IRawParams, options: ITransitionOptions): IPromise<State>;
  transitionTo  (to: IStateOrName, toParams: IParamsOrArray, options: ITransitionOptions): IPromise<State>;
  is            (stateOrName: IStateOrName, params?: IRawParams, options?: ITransitionOptions): boolean;
  includes      (stateOrName: IStateOrName, params?: IRawParams, options?: ITransitionOptions): boolean;
  href          (stateOrName: IStateOrName, params?: IRawParams, options?: IHrefOptions): string;
  get           (stateOrName: IStateOrName, base?: IStateOrName): (IStateDeclaration|IStateDeclaration[]);
}

