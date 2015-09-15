import * as angular1 from "./common/angular1"
import * as _common from "./common/common"
import trace from "./common/trace"
var common = { angular1, common: _common, trace };

import Param from "./params/param"
import ParamSet from "./params/paramSet"
import Type from "./params/type"
import paramTypes from "./params/paramTypes"
var params = { Param, ParamSet, Type, paramTypes };

import Path from "./path/path"
import PathFactory from "./path/pathFactory"
var path = { Path, PathFactory }

import ResolveInjector from "./resolve/resolveInjector"
import Resolvable from "./resolve/resolvable"
import ResolveContext from "./resolve/resolveContext"
var resolve = { Path, ResolveInjector, Resolvable, ResolveContext };

import Glob from "./state/glob";
import * as stateInterface from "./state/interface";
import * as stateState from "./state/state";
import StateBuilder from "./state/stateBuilder";
import * as stateDirectives from "./state/stateDirectives";
import * as stateEvents from "./state/stateEvents";
import * as stateFilters from "./state/stateFilters";
import StateMatcher from "./state/stateMatcher";
import StateQueueManager from "./state/stateQueueManager";
import TargetState from "./state/targetState";
//import StateService from "./state/stateService";
import Queue from "./common/queue";
var state = { Glob, stateInterface, state: stateState, StateBuilder, stateDirectives,
  stateEvents, stateFilters, StateMatcher, StateQueueManager, TargetState, Queue};

import HookBuilder from "./transition/hookBuilder"
import * as rejectFactory from "./transition/rejectFactory"
import * as _transition from "./transition/transition"
import TransitionHook from "./transition/transitionHook"
import * as transitionService from "./transition/transitionService"
var transition = { HookBuilder, rejectFactory, transition: _transition, transitionService };

import UrlMatcher from "./url/urlMatcher"
import urlMatcherConfig from "./url/urlMatcherConfig"
// TODO marked where the objects are not yet exported as ES6
import * as urlMatcherFactory from "./url/urlMatcherFactory" // TODO
import * as urlRouter from "./url/urlRouter" // TODO
var url = { UrlMatcher, urlMatcherConfig, urlMatcherFactory, urlRouter };

import * as viewInterface from "./view/interface"
import * as templateFactory from "./view/templateFactory" // TODO
import * as _view from "./view/view" // TODO
import * as viewDirective from "./view/viewDirective" // TODO
import * as viewScroll from "./view/viewScroll" // TODO
var view = { viewInterface, templateFactory, view: _view, viewDirective, viewScroll };

// Export the submodules
export { common, params, path, resolve, state, transition, url, view }
