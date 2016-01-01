/**
 * State-based routing for AngularJS
 * @version v1.0.0alpha0
 * @link http://angular-ui.github.com/
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["ui.router"] = factory();
	else
		root["ui.router"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var common = __webpack_require__(2);
	exports.common = common;
	var params = __webpack_require__(36);
	exports.params = params;
	var path = __webpack_require__(15);
	exports.path = path;
	var resolve = __webpack_require__(17);
	exports.resolve = resolve;
	var state = __webpack_require__(12);
	exports.state = state;
	var transition = __webpack_require__(9);
	exports.transition = transition;
	var url = __webpack_require__(34);
	exports.url = url;
	var view = __webpack_require__(49);
	exports.view = view;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = "ui.router";
	//# sourceMappingURL=ui-router.js.map

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(3));
	__export(__webpack_require__(4));
	__export(__webpack_require__(5));
	__export(__webpack_require__(6));
	//# sourceMappingURL=module.js.map

/***/ },
/* 3 */
/***/ function(module, exports) {

	var isDefined = angular.isDefined, isFunction = angular.isFunction, isNumber = angular.isNumber, isString = angular.isString, isObject = angular.isObject, isArray = angular.isArray, forEach = angular.forEach, extend = angular.extend, copy = angular.copy, noop = angular.noop, toJson = angular.toJson, fromJson = angular.fromJson, equals = angular.equals, identity = angular.identity;
	exports.isDefined = isDefined;
	exports.isFunction = isFunction;
	exports.isNumber = isNumber;
	exports.isString = isString;
	exports.isObject = isObject;
	exports.isArray = isArray;
	exports.forEach = forEach;
	exports.extend = extend;
	exports.copy = copy;
	exports.noop = noop;
	exports.toJson = toJson;
	exports.fromJson = fromJson;
	exports.equals = equals;
	exports.identity = identity;
	exports.abstractKey = 'abstract';
	function curry(fn) {
	    var initial_args = [].slice.apply(arguments, [1]);
	    var func_args_length = fn.length;
	    function curried(args) {
	        if (args.length >= func_args_length)
	            return fn.apply(null, args);
	        return function () {
	            return curried(args.concat([].slice.apply(arguments)));
	        };
	    }
	    return curried(initial_args);
	}
	exports.curry = curry;
	function compose() {
	    var args = arguments;
	    var start = args.length - 1;
	    return function () {
	        var i = start, result = args[start].apply(this, arguments);
	        while (i--)
	            result = args[i].call(this, result);
	        return result;
	    };
	}
	exports.compose = compose;
	function pipe() {
	    var funcs = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        funcs[_i - 0] = arguments[_i];
	    }
	    return compose.apply(null, [].slice.call(arguments).reverse());
	}
	exports.pipe = pipe;
	exports.prop = function (name) { return function (obj) { return obj && obj[name]; }; };
	exports.propEq = curry(function (name, val, obj) { return obj && obj[name] === val; });
	exports.parse = function (name) { return pipe.apply(null, name.split(".").map(exports.prop)); };
	exports.not = function (fn) { return function () {
	    var args = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        args[_i - 0] = arguments[_i];
	    }
	    return !fn.apply(null, args);
	}; };
	function and(fn1, fn2) {
	    return function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        return fn1.apply(null, args) && fn2.apply(null, args);
	    };
	}
	exports.and = and;
	function or(fn1, fn2) {
	    return function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i - 0] = arguments[_i];
	        }
	        return fn1.apply(null, args) || fn2.apply(null, args);
	    };
	}
	exports.or = or;
	exports.is = function (ctor) { return function (obj) { return (obj != null && obj.constructor === ctor || obj instanceof ctor); }; };
	exports.eq = function (val) { return function (other) { return val === other; }; };
	exports.val = function (v) { return function () { return v; }; };
	function invoke(fnName, args) {
	    return function (obj) { return obj[fnName].apply(obj, args); };
	}
	exports.invoke = invoke;
	function pattern(struct) {
	    return function (val) {
	        for (var i = 0; i < struct.length; i++) {
	            if (struct[i][0](val))
	                return struct[i][1](val);
	        }
	    };
	}
	exports.pattern = pattern;
	exports.inherit = function (parent, extra) { return extend(new (extend(function () { }, { prototype: parent }))(), extra); };
	var restArgs = function (args, idx) {
	    if (idx === void 0) { idx = 0; }
	    return Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(args, idx));
	};
	var inArray = function (array, obj) { return array.indexOf(obj) !== -1; };
	exports.removeFrom = function (array) { return function (obj) {
	    var idx = array.indexOf(obj);
	    if (idx >= 0)
	        array.splice(idx, 1);
	    return array;
	}; };
	function defaults(opts) {
	    if (opts === void 0) { opts = {}; }
	    var defaultsList = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        defaultsList[_i - 1] = arguments[_i];
	    }
	    var defaults = merge.apply(null, [{}].concat(defaultsList));
	    return extend({}, defaults, pick(opts || {}, Object.keys(defaults)));
	}
	exports.defaults = defaults;
	function merge(dst) {
	    var objs = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        objs[_i - 1] = arguments[_i];
	    }
	    forEach(objs, function (obj) {
	        forEach(obj, function (value, key) {
	            if (!dst.hasOwnProperty(key))
	                dst[key] = value;
	        });
	    });
	    return dst;
	}
	exports.merge = merge;
	exports.mergeR = function (memo, item) { return extend(memo, item); };
	function ancestors(first, second) {
	    var path = [];
	    for (var n in first.path) {
	        if (first.path[n] !== second.path[n])
	            break;
	        path.push(first.path[n]);
	    }
	    return path;
	}
	exports.ancestors = ancestors;
	function equalForKeys(a, b, keys) {
	    if (keys === void 0) { keys = Object.keys(a); }
	    for (var i = 0; i < keys.length; i++) {
	        var k = keys[i];
	        if (a[k] != b[k])
	            return false;
	    }
	    return true;
	}
	exports.equalForKeys = equalForKeys;
	function pickOmitImpl(predicate, obj) {
	    var objCopy = {}, keys = restArgs(arguments, 2);
	    for (var key in obj) {
	        if (predicate(keys, key))
	            objCopy[key] = obj[key];
	    }
	    return objCopy;
	}
	function pick(obj) { return pickOmitImpl.apply(null, [inArray].concat(restArgs(arguments))); }
	exports.pick = pick;
	function omit(obj) { return pickOmitImpl.apply(null, [exports.not(inArray)].concat(restArgs(arguments))); }
	exports.omit = omit;
	function pluck(collection, propName) {
	    return map(collection, exports.prop(propName));
	}
	exports.pluck = pluck;
	function filter(collection, callback) {
	    var arr = isArray(collection), result = arr ? [] : {};
	    var accept = arr ? function (x) { return result.push(x); } : function (x, key) { return result[key] = x; };
	    forEach(collection, function (item, i) {
	        if (callback(item, i))
	            accept(item, i);
	    });
	    return result;
	}
	exports.filter = filter;
	function find(collection, callback) {
	    var result;
	    forEach(collection, function (item, i) {
	        if (result)
	            return;
	        if (callback(item, i))
	            result = item;
	    });
	    return result;
	}
	exports.find = find;
	function map(collection, callback) {
	    var result = isArray(collection) ? [] : {};
	    forEach(collection, function (item, i) { return result[i] = callback(item, i); });
	    return result;
	}
	exports.map = map;
	exports.values = function (obj) { return Object.keys(obj).map(function (key) { return obj[key]; }); };
	exports.allTrueR = function (memo, elem) { return memo && elem; };
	exports.anyTrueR = function (memo, elem) { return memo || elem; };
	exports.pushR = function (arr, obj) { arr.push(obj); return arr; };
	exports.unnestR = function (memo, elem) { return memo.concat(elem); };
	exports.flattenR = function (memo, elem) { return isArray(elem) ? memo.concat(elem.reduce(exports.flattenR, [])) : exports.pushR(memo, elem); };
	exports.unnest = function (arr) { return arr.reduce(exports.unnestR, []); };
	exports.flatten = function (arr) { return arr.reduce(exports.flattenR, []); };
	function assertPredicate(fn, errMsg) {
	    if (errMsg === void 0) { errMsg = "assert failure"; }
	    return function (obj) {
	        if (!fn(obj))
	            throw new Error(errMsg);
	        return true;
	    };
	}
	exports.assertPredicate = assertPredicate;
	exports.pairs = function (object) { return Object.keys(object).map(function (key) { return [key, object[key]]; }); };
	function arrayTuples() {
	    var arrayArgs = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        arrayArgs[_i - 0] = arguments[_i];
	    }
	    if (arrayArgs.length === 0)
	        return [];
	    var length = arrayArgs.reduce(function (min, arr) { return Math.min(arr.length, min); }, 9007199254740991);
	    return Array.apply(null, Array(length)).map(function (ignored, idx) { return arrayArgs.map(function (arr) { return arr[idx]; }).reduce(exports.pushR, []); });
	}
	exports.arrayTuples = arrayTuples;
	function applyPairs(memo, keyValTuple) {
	    var key, value;
	    if (isArray(keyValTuple))
	        key = keyValTuple[0], value = keyValTuple[1];
	    if (!isString(key))
	        throw new Error("invalid parameters to applyPairs");
	    memo[key] = value;
	    return memo;
	}
	exports.applyPairs = applyPairs;
	function isInjectable(val) {
	    if (isArray(val) && val.length) {
	        var head = val.slice(0, -1), tail_1 = val.slice(-1);
	        if (head.filter(exports.not(isString)).length || tail_1.filter(exports.not(isFunction)).length)
	            return false;
	    }
	    return isFunction(val);
	}
	exports.isInjectable = isInjectable;
	exports.isNull = function (o) { return o === null; };
	exports.isPromise = and(isObject, pipe(exports.prop('then'), isFunction));
	function fnToString(fn) {
	    var _fn = pattern([
	        [isArray, function (arr) { return arr.slice(-1)[0]; }],
	        [exports.val(true), identity]
	    ])(fn);
	    return _fn && _fn.toString() || "undefined";
	}
	exports.fnToString = fnToString;
	function maxLength(max, str) {
	    if (str.length <= max)
	        return str;
	    return str.substr(0, max - 3) + "...";
	}
	exports.maxLength = maxLength;
	function padString(length, str) {
	    while (str.length < length)
	        str += " ";
	    return str;
	}
	exports.padString = padString;
	function tail(collection) {
	    return collection.length && collection[collection.length - 1] || undefined;
	}
	exports.tail = tail;
	angular.module('ui.router.util', ['ng', 'ui.router.init']);
	angular.module('ui.router.router', ['ui.router.util']);
	angular.module('ui.router.state', ['ui.router.router', 'ui.router.util', 'ui.router.angular1']);
	angular.module('ui.router', ['ui.router.init', 'ui.router.state', 'ui.router.angular1']);
	angular.module('ui.router.compat', ['ui.router']);
	//# sourceMappingURL=common.js.map

/***/ },
/* 4 */
/***/ function(module, exports) {

	var notImplemented = function (fnname) { return function () {
	    throw new Error(fnname + "(): No coreservices implementation for UI-Router is loaded. You should include one of: ['angular1.js']");
	}; };
	var services = {
	    $q: undefined,
	    $injector: undefined,
	    location: {},
	    locationConfig: {}
	};
	exports.services = services;
	["replace", "url", "path", "search", "hash"]
	    .forEach(function (key) { return services.location[key] = notImplemented(key); });
	["port", "protocol", "host", "baseHref", "html5Mode", "hashPrefix"]
	    .forEach(function (key) { return services.locationConfig[key] = notImplemented(key); });
	//# sourceMappingURL=coreservices.js.map

/***/ },
/* 5 */
/***/ function(module, exports) {

	var Queue = (function () {
	    function Queue(_items) {
	        if (_items === void 0) { _items = []; }
	        this._items = _items;
	    }
	    Queue.prototype.enqueue = function (item) {
	        this._items.push(item);
	        return item;
	    };
	    Queue.prototype.dequeue = function () {
	        if (this.size())
	            return this._items.splice(0, 1)[0];
	    };
	    Queue.prototype.clear = function () {
	        var current = this._items;
	        this._items = [];
	        return current;
	    };
	    Queue.prototype.size = function () {
	        return this._items.length;
	    };
	    Queue.prototype.remove = function (item) {
	        var idx = this._items.indexOf(item);
	        return idx > -1 && this._items.splice(idx, 1)[0];
	    };
	    Queue.prototype.peekTail = function () {
	        return this._items[this._items.length - 1];
	    };
	    Queue.prototype.peekHead = function () {
	        if (this.size())
	            return this._items[0];
	    };
	    return Queue;
	})();
	exports.Queue = Queue;
	//# sourceMappingURL=queue.js.map

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var resolvable_1 = __webpack_require__(7);
	var transition_1 = __webpack_require__(8);
	var rejectFactory_1 = __webpack_require__(28);
	function promiseToString(p) {
	    if (common_1.is(rejectFactory_1.TransitionRejection)(p.reason))
	        return p.reason.toString();
	    return "Promise(" + JSON.stringify(p) + ")";
	}
	function functionToString(fn) {
	    var fnStr = common_1.fnToString(fn);
	    var namedFunctionMatch = fnStr.match(/^(function [^ ]+\([^)]*\))/);
	    return namedFunctionMatch ? namedFunctionMatch[1] : fnStr;
	}
	var uiViewString = function (viewData) {
	    return ("ui-view id#" + viewData.id + ", contextual name '" + viewData.name + "@" + viewData.creationContext + "', fqn: '" + viewData.fqn + "'");
	};
	var viewConfigString = function (viewConfig) {
	    return ("ViewConfig targeting ui-view: '" + viewConfig.uiViewName + "@" + viewConfig.uiViewContextAnchor + "', context: '" + viewConfig.context.name + "'");
	};
	function normalizedCat(input) {
	    return common_1.isNumber(input) ? Category[input] : Category[Category[input]];
	}
	function stringify(o) {
	    var format = common_1.pattern([
	        [common_1.not(common_1.isDefined), common_1.val("undefined")],
	        [common_1.isNull, common_1.val("null")],
	        [common_1.isPromise, promiseToString],
	        [common_1.is(transition_1.Transition), common_1.invoke("toString")],
	        [common_1.is(resolvable_1.Resolvable), common_1.invoke("toString")],
	        [common_1.isInjectable, functionToString],
	        [common_1.val(true), common_1.identity]
	    ]);
	    return JSON.stringify(o, function (key, val) { return format(val); }).replace(/\\"/g, '"');
	}
	var Category;
	(function (Category) {
	    Category[Category["RESOLVE"] = 0] = "RESOLVE";
	    Category[Category["TRANSITION"] = 1] = "TRANSITION";
	    Category[Category["HOOK"] = 2] = "HOOK";
	    Category[Category["INVOKE"] = 3] = "INVOKE";
	    Category[Category["UIVIEW"] = 4] = "UIVIEW";
	    Category[Category["VIEWCONFIG"] = 5] = "VIEWCONFIG";
	})(Category || (Category = {}));
	var Trace = (function () {
	    function Trace() {
	        var _this = this;
	        this._enabled = {};
	        this.enable = function () {
	            var categories = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                categories[_i - 0] = arguments[_i];
	            }
	            return _this._set(true, categories);
	        };
	        this.disable = function () {
	            var categories = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                categories[_i - 0] = arguments[_i];
	            }
	            return _this._set(false, categories);
	        };
	        this.approximateDigests = 0;
	    }
	    Trace.prototype._set = function (enabled, categories) {
	        var _this = this;
	        if (!categories.length) {
	            categories = Object.keys(Category)
	                .filter(function (k) { return isNaN(parseInt(k, 10)); })
	                .map(function (key) { return Category[key]; });
	        }
	        categories.map(normalizedCat).forEach(function (category) { return _this._enabled[category] = enabled; });
	    };
	    Trace.prototype.enabled = function (category) {
	        return !!this._enabled[normalizedCat(category)];
	    };
	    Trace.prototype.traceTransitionStart = function (transition) {
	        if (!this.enabled(Category.TRANSITION))
	            return;
	        var tid = transition.$id, digest = this.approximateDigests, transitionStr = stringify(transition);
	        console.log("Transition #" + tid + " Digest #" + digest + ": Started  -> " + transitionStr);
	    };
	    Trace.prototype.traceTransitionIgnored = function (transition) {
	        if (!this.enabled(Category.TRANSITION))
	            return;
	        var tid = transition.$id, digest = this.approximateDigests, transitionStr = stringify(transition);
	        console.log("Transition #" + tid + " Digest #" + digest + ": Ignored  <> " + transitionStr);
	    };
	    Trace.prototype.traceHookInvocation = function (step, options) {
	        if (!this.enabled(Category.HOOK))
	            return;
	        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, event = common_1.parse("traceData.hookType")(options) || "internal", context = common_1.parse("traceData.context.state.name")(options) || common_1.parse("traceData.context")(options) || "unknown", name = functionToString(step.fn);
	        console.log("Transition #" + tid + " Digest #" + digest + ":   Hook -> " + event + " context: " + context + ", " + common_1.maxLength(200, name));
	    };
	    Trace.prototype.traceHookResult = function (hookResult, transitionResult, transitionOptions) {
	        if (!this.enabled(Category.HOOK))
	            return;
	        var tid = common_1.parse("transition.$id")(transitionOptions), digest = this.approximateDigests, hookResultStr = stringify(hookResult), transitionResultStr = stringify(transitionResult);
	        console.log("Transition #" + tid + " Digest #" + digest + ":   <- Hook returned: " + common_1.maxLength(200, hookResultStr) + ", transition result: " + common_1.maxLength(200, transitionResultStr));
	    };
	    Trace.prototype.traceResolvePath = function (path, options) {
	        if (!this.enabled(Category.RESOLVE))
	            return;
	        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, pathStr = path && path.toString(), policyStr = options && options.resolvePolicy;
	        console.log("Transition #" + tid + " Digest #" + digest + ":         Resolving " + pathStr + " (" + policyStr + ")");
	    };
	    Trace.prototype.traceResolvePathElement = function (pathElement, resolvablePromises, options) {
	        if (!this.enabled(Category.RESOLVE))
	            return;
	        if (!resolvablePromises.length)
	            return;
	        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, resolvablePromisesStr = Object.keys(resolvablePromises).join(", "), pathElementStr = pathElement && pathElement.toString(), policyStr = options && options.resolvePolicy;
	        console.log("Transition #" + tid + " Digest #" + digest + ":         Resolve " + pathElementStr + " resolvables: [" + resolvablePromisesStr + "] (" + policyStr + ")");
	    };
	    Trace.prototype.traceResolveResolvable = function (resolvable, options) {
	        if (!this.enabled(Category.RESOLVE))
	            return;
	        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, resolvableStr = resolvable && resolvable.toString();
	        console.log("Transition #" + tid + " Digest #" + digest + ":               Resolving -> " + resolvableStr);
	    };
	    Trace.prototype.traceResolvableResolved = function (resolvable, options) {
	        if (!this.enabled(Category.RESOLVE))
	            return;
	        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, resolvableStr = resolvable && resolvable.toString(), result = stringify(resolvable.data);
	        console.log("Transition #" + tid + " Digest #" + digest + ":               <- Resolved  " + resolvableStr + " to: " + common_1.maxLength(200, result));
	    };
	    Trace.prototype.tracePathElementInvoke = function (node, fn, deps, options) {
	        if (!this.enabled(Category.INVOKE))
	            return;
	        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, stateName = node && node.state && node.state.toString(), fnName = functionToString(fn);
	        console.log("Transition #" + tid + " Digest #" + digest + ":         Invoke " + options.when + ": context: " + stateName + " " + common_1.maxLength(200, fnName));
	    };
	    Trace.prototype.traceError = function (error, transition) {
	        if (!this.enabled(Category.TRANSITION))
	            return;
	        var tid = transition.$id, digest = this.approximateDigests, transitionStr = stringify(transition);
	        console.log("Transition #" + tid + " Digest #" + digest + ": <- Rejected " + transitionStr + ", reason: " + error);
	    };
	    Trace.prototype.traceSuccess = function (finalState, transition) {
	        if (!this.enabled(Category.TRANSITION))
	            return;
	        var tid = transition.$id, digest = this.approximateDigests, state = finalState.name, transitionStr = stringify(transition);
	        console.log("Transition #" + tid + " Digest #" + digest + ": <- Success  " + transitionStr + ", final state: " + state);
	    };
	    Trace.prototype.traceUiViewEvent = function (event, viewData, extra) {
	        if (extra === void 0) { extra = ""; }
	        if (!this.enabled(Category.UIVIEW))
	            return;
	        console.log("ui-view: " + common_1.padString(30, event) + " " + uiViewString(viewData) + extra);
	    };
	    Trace.prototype.traceUiViewConfigUpdated = function (viewData, context) {
	        if (!this.enabled(Category.UIVIEW))
	            return;
	        this.traceUiViewEvent("Updating", viewData, " with ViewConfig from context='" + context + "'");
	    };
	    Trace.prototype.traceUiViewScopeCreated = function (viewData, newScope) {
	        if (!this.enabled(Category.UIVIEW))
	            return;
	        this.traceUiViewEvent("Created scope for", viewData, ", scope #" + newScope.$id);
	    };
	    Trace.prototype.traceUiViewFill = function (viewData, html) {
	        if (!this.enabled(Category.UIVIEW))
	            return;
	        this.traceUiViewEvent("Fill", viewData, " with: " + common_1.maxLength(200, html));
	    };
	    Trace.prototype.traceViewServiceEvent = function (event, viewConfig) {
	        if (!this.enabled(Category.VIEWCONFIG))
	            return;
	        console.log("$view.ViewConfig: " + event + " " + viewConfigString(viewConfig));
	    };
	    Trace.prototype.traceViewServiceUiViewEvent = function (event, viewData) {
	        if (!this.enabled(Category.VIEWCONFIG))
	            return;
	        console.log("$view.ViewConfig: " + event + " " + uiViewString(viewData));
	    };
	    return Trace;
	})();
	var trace = new Trace();
	exports.trace = trace;
	watchDigests.$inject = ['$rootScope'];
	function watchDigests($rootScope) {
	    $rootScope.$watch(function () { trace.approximateDigests++; });
	}
	angular.module("ui.router").run(watchDigests);
	angular.module("ui.router").service("$trace", function () { return trace; });
	//# sourceMappingURL=trace.js.map

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var coreservices_1 = __webpack_require__(4);
	var trace_1 = __webpack_require__(6);
	var Resolvable = (function () {
	    function Resolvable(name, resolveFn, preResolvedData) {
	        this.promise = undefined;
	        common_1.extend(this, { name: name, resolveFn: resolveFn, deps: coreservices_1.services.$injector.annotate(resolveFn), data: preResolvedData });
	    }
	    Resolvable.prototype.resolveResolvable = function (resolveContext, options) {
	        var _this = this;
	        if (options === void 0) { options = {}; }
	        var _a = this, name = _a.name, deps = _a.deps, resolveFn = _a.resolveFn;
	        trace_1.trace.traceResolveResolvable(this, options);
	        var deferred = coreservices_1.services.$q.defer();
	        this.promise = deferred.promise;
	        var ancestorsByName = resolveContext.getResolvables(null, { omitOwnLocals: [name] });
	        var depResolvables = common_1.pick(ancestorsByName, deps);
	        var depPromises = common_1.map(depResolvables, function (resolvable) { return resolvable.get(resolveContext, options); });
	        return coreservices_1.services.$q.all(depPromises).then(function (locals) {
	            try {
	                var result = coreservices_1.services.$injector.invoke(resolveFn, null, locals);
	                deferred.resolve(result);
	            }
	            catch (error) {
	                deferred.reject(error);
	            }
	            return _this.promise;
	        }).then(function (data) {
	            _this.data = data;
	            trace_1.trace.traceResolvableResolved(_this, options);
	            return _this.promise;
	        });
	    };
	    Resolvable.prototype.get = function (resolveContext, options) {
	        return this.promise || this.resolveResolvable(resolveContext, options);
	    };
	    Resolvable.prototype.toString = function () {
	        return "Resolvable(name: " + this.name + ", requires: [" + this.deps + "])";
	    };
	    Resolvable.makeResolvables = function (resolves) {
	        var invalid = common_1.filter(resolves, common_1.not(common_1.isFunction)), keys = Object.keys(invalid);
	        if (keys.length)
	            throw new Error("Invalid resolve key/value: " + keys[0] + "/" + invalid[keys[0]]);
	        return common_1.map(resolves, function (fn, name) { return new Resolvable(name, fn); });
	    };
	    return Resolvable;
	})();
	exports.Resolvable = Resolvable;
	//# sourceMappingURL=resolvable.js.map

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var trace_1 = __webpack_require__(6);
	var coreservices_1 = __webpack_require__(4);
	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(9);
	var module_2 = __webpack_require__(15);
	var module_3 = __webpack_require__(12);
	var module_4 = __webpack_require__(36);
	var module_5 = __webpack_require__(17);
	var transitionCount = 0, REJECT = new module_1.RejectFactory();
	var stateSelf = common_1.prop("self");
	var Transition = (function () {
	    function Transition(fromPath, targetState) {
	        var _this = this;
	        this._deferred = coreservices_1.services.$q.defer();
	        this.promise = this._deferred.promise;
	        this.treeChanges = function () { return _this._treeChanges; };
	        this.isActive = function () { return _this === _this._options.current(); };
	        if (!targetState.valid()) {
	            throw new Error(targetState.error());
	        }
	        module_1.HookRegistry.mixin(new module_1.HookRegistry(), this);
	        this._options = common_1.extend({ current: common_1.val(this) }, targetState.options());
	        this.$id = transitionCount++;
	        var toPath = module_2.PathFactory.buildToPath(fromPath, targetState);
	        this._treeChanges = module_2.PathFactory.treeChanges(fromPath, toPath, this._options.reloadState);
	        module_2.PathFactory.bindTransitionResolve(this._treeChanges, this);
	    }
	    Transition.prototype.$from = function () {
	        return common_1.tail(this._treeChanges.from).state;
	    };
	    Transition.prototype.$to = function () {
	        return common_1.tail(this._treeChanges.to).state;
	    };
	    Transition.prototype.from = function () {
	        return this.$from().self;
	    };
	    Transition.prototype.to = function () {
	        return this.$to().self;
	    };
	    Transition.prototype.is = function (compare) {
	        if (compare instanceof Transition) {
	            return this.is({ to: compare.$to().name, from: compare.$from().name });
	        }
	        return !((compare.to && !module_1.matchState(this.$to(), compare.to)) ||
	            (compare.from && !module_1.matchState(this.$from(), compare.from)));
	    };
	    Transition.prototype.params = function (pathname) {
	        if (pathname === void 0) { pathname = "to"; }
	        return this._treeChanges[pathname].map(common_1.prop("values")).reduce(common_1.mergeR, {});
	    };
	    Transition.prototype.resolves = function () {
	        return common_1.map(common_1.tail(this._treeChanges.to).resolveContext.getResolvables(), function (res) { return res.data; });
	    };
	    Transition.prototype.addResolves = function (resolves, state) {
	        if (state === void 0) { state = ""; }
	        var stateName = (typeof state === "string") ? state : state.name;
	        var topath = this._treeChanges.to;
	        var targetNode = common_1.find(topath, function (node) { return node.state.name === stateName; });
	        common_1.tail(topath).resolveContext.addResolvables(module_5.Resolvable.makeResolvables(resolves), targetNode.state);
	    };
	    Transition.prototype.previous = function () {
	        return this._options.previous || null;
	    };
	    Transition.prototype.options = function () {
	        return this._options;
	    };
	    Transition.prototype.entering = function () {
	        return common_1.map(this._treeChanges.entering, common_1.prop('state')).map(stateSelf);
	    };
	    Transition.prototype.exiting = function () {
	        return common_1.map(this._treeChanges.exiting, common_1.prop('state')).map(stateSelf).reverse();
	    };
	    Transition.prototype.retained = function () {
	        return common_1.map(this._treeChanges.retained, common_1.prop('state')).map(stateSelf);
	    };
	    Transition.prototype.views = function (pathname, state) {
	        if (pathname === void 0) { pathname = "entering"; }
	        var path = this._treeChanges[pathname];
	        return state ? common_1.find(path, common_1.propEq('state', state)).views : common_1.unnest(path.map(common_1.prop("views")));
	    };
	    Transition.prototype.redirect = function (targetState) {
	        var newOptions = common_1.extend({}, this.options(), targetState.options(), { previous: this });
	        targetState = new module_3.TargetState(targetState.identifier(), targetState.$state(), targetState.params(), newOptions);
	        var redirectTo = new Transition(this._treeChanges.from, targetState);
	        var redirectedPath = this.treeChanges().to;
	        var matching = module_2.Node.matching(redirectTo.treeChanges().to, redirectedPath);
	        var includeResolve = function (resolve, key) { return ['$stateParams', '$transition$'].indexOf(key) === -1; };
	        matching.forEach(function (node, idx) { return common_1.extend(node.resolves, common_1.filter(redirectedPath[idx].resolves, includeResolve)); });
	        return redirectTo;
	    };
	    Transition.prototype.ignored = function () {
	        var _a = this._treeChanges, to = _a.to, from = _a.from;
	        if (this._options.reload || common_1.tail(to).state !== common_1.tail(from).state)
	            return false;
	        var nodeSchemas = to.map(function (node) { return node.schema.filter(common_1.not(common_1.prop('dynamic'))); });
	        var _b = [to, from].map(function (path) { return path.map(common_1.prop('values')); }), toValues = _b[0], fromValues = _b[1];
	        var tuples = common_1.arrayTuples(nodeSchemas, toValues, fromValues);
	        return tuples.map(function (_a) {
	            var schema = _a[0], toVals = _a[1], fromVals = _a[2];
	            return module_4.Param.equals(schema, toVals, fromVals);
	        }).reduce(common_1.allTrueR, true);
	    };
	    Transition.prototype.hookBuilder = function () {
	        return new module_1.HookBuilder(module_1.$transitions, this, {
	            transition: this,
	            current: this._options.current
	        });
	    };
	    Transition.prototype.run = function () {
	        var _this = this;
	        var hookBuilder = this.hookBuilder();
	        var runSynchronousHooks = module_1.TransitionHook.runSynchronousHooks;
	        var runSuccessHooks = function () { return runSynchronousHooks(hookBuilder.getOnSuccessHooks(), {}, true); };
	        var runErrorHooks = function ($error$) { return runSynchronousHooks(hookBuilder.getOnErrorHooks(), { $error$: $error$ }, true); };
	        this.promise.then(runSuccessHooks, runErrorHooks);
	        var syncResult = runSynchronousHooks(hookBuilder.getOnBeforeHooks());
	        if (module_1.TransitionHook.isRejection(syncResult)) {
	            var rejectReason = syncResult.reason;
	            this._deferred.reject(rejectReason);
	            return this.promise;
	        }
	        if (!this.valid()) {
	            var error = new Error(this.error());
	            this._deferred.reject(error);
	            return this.promise;
	        }
	        if (this.ignored()) {
	            trace_1.trace.traceTransitionIgnored(this);
	            var ignored = REJECT.ignored();
	            this._deferred.reject(ignored.reason);
	            return this.promise;
	        }
	        var resolve = function () {
	            _this._deferred.resolve(_this);
	            trace_1.trace.traceSuccess(_this.$to(), _this);
	        };
	        var reject = function (error) {
	            _this._deferred.reject(error);
	            trace_1.trace.traceError(error, _this);
	            return coreservices_1.services.$q.reject(error);
	        };
	        trace_1.trace.traceTransitionStart(this);
	        var chain = hookBuilder.asyncHooks().reduce(function (_chain, step) { return _chain.then(step.invokeStep); }, syncResult);
	        chain.then(resolve, reject);
	        return this.promise;
	    };
	    Transition.prototype.valid = function () {
	        return !this.error();
	    };
	    Transition.prototype.error = function () {
	        var state = this.$to();
	        if (state.self[common_1.abstractKey])
	            return "Cannot transition to abstract state '" + state.name + "'";
	        if (!module_4.Param.validates(state.parameters(), this.params()))
	            return "Param values not valid for state '" + state.name + "'";
	    };
	    Transition.prototype.toString = function () {
	        var fromStateOrName = this.from();
	        var toStateOrName = this.to();
	        var avoidEmptyHash = function (params) {
	            return (params["#"] !== null && params["#"] !== undefined) ? params : common_1.omit(params, "#");
	        };
	        var id = this.$id, from = common_1.isObject(fromStateOrName) ? fromStateOrName.name : fromStateOrName, fromParams = common_1.toJson(avoidEmptyHash(this._treeChanges.from.map(common_1.prop('values')).reduce(common_1.mergeR, {}))), toValid = this.valid() ? "" : "(X) ", to = common_1.isObject(toStateOrName) ? toStateOrName.name : toStateOrName, toParams = common_1.toJson(avoidEmptyHash(this.params()));
	        return "Transition#" + id + "( '" + from + "'" + fromParams + " -> " + toValid + "'" + to + "'" + toParams + " )";
	    };
	    return Transition;
	})();
	exports.Transition = Transition;
	//# sourceMappingURL=transition.js.map

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(10));
	__export(__webpack_require__(11));
	__export(__webpack_require__(28));
	__export(__webpack_require__(8));
	__export(__webpack_require__(47));
	__export(__webpack_require__(48));
	//# sourceMappingURL=module.js.map

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(9);
	var successErrorOptions = {
	    async: false,
	    rejectIfSuperseded: false
	};
	var HookBuilder = (function () {
	    function HookBuilder($transitions, transition, baseHookOptions) {
	        var _this = this;
	        this.$transitions = $transitions;
	        this.transition = transition;
	        this.baseHookOptions = baseHookOptions;
	        this.getOnBeforeHooks = function () { return _this._buildTransitionHooks("onBefore", {}, { async: false }); };
	        this.getOnStartHooks = function () { return _this._buildTransitionHooks("onStart"); };
	        this.getOnExitHooks = function () { return _this._buildNodeHooks("onExit", _this.treeChanges.exiting.reverse(), function (node) { return _this._toFrom({ from: node.state }); }); };
	        this.getOnRetainHooks = function () { return _this._buildNodeHooks("onRetain", _this.treeChanges.retained, function (node) { return _this._toFrom(); }); };
	        this.getOnEnterHooks = function () { return _this._buildNodeHooks("onEnter", _this.treeChanges.entering, function (node) { return _this._toFrom({ to: node.state }); }); };
	        this.getOnFinishHooks = function () { return _this._buildTransitionHooks("onFinish", { $treeChanges$: _this.treeChanges }); };
	        this.getOnSuccessHooks = function () { return _this._buildTransitionHooks("onSuccess", {}, { async: false, rejectIfSuperseded: false }); };
	        this.getOnErrorHooks = function () { return _this._buildTransitionHooks("onError", {}, { async: false, rejectIfSuperseded: false }); };
	        this.treeChanges = transition.treeChanges();
	        this.toState = common_1.tail(this.treeChanges.to).state;
	        this.fromState = common_1.tail(this.treeChanges.from).state;
	        this.transitionOptions = transition.options();
	    }
	    HookBuilder.prototype.asyncHooks = function () {
	        var onStartHooks = this.getOnStartHooks();
	        var onExitHooks = this.getOnExitHooks();
	        var onRetainHooks = this.getOnRetainHooks();
	        var onEnterHooks = this.getOnEnterHooks();
	        var onFinishHooks = this.getOnFinishHooks();
	        return common_1.flatten([onStartHooks, onExitHooks, onRetainHooks, onEnterHooks, onFinishHooks]).filter(common_1.identity);
	    };
	    HookBuilder.prototype._toFrom = function (toFromOverride) {
	        return common_1.extend({ to: this.toState, from: this.fromState }, toFromOverride);
	    };
	    HookBuilder.prototype._buildTransitionHooks = function (hookType, locals, options) {
	        var _this = this;
	        if (locals === void 0) { locals = {}; }
	        if (options === void 0) { options = {}; }
	        var context = this.treeChanges.to, node = common_1.tail(context);
	        options.traceData = { hookType: hookType, context: context };
	        var transitionHook = function (eventHook) { return _this.buildHook(node, eventHook.callback, locals, options); };
	        return this._matchingHooks(hookType, this._toFrom()).map(transitionHook);
	    };
	    HookBuilder.prototype._buildNodeHooks = function (hookType, path, toFromFn, locals, options) {
	        var _this = this;
	        if (locals === void 0) { locals = {}; }
	        if (options === void 0) { options = {}; }
	        var hooksForNode = function (node) {
	            var toFrom = toFromFn(node);
	            options.traceData = { hookType: hookType, context: node };
	            locals.$state$ = node.state;
	            var transitionHook = function (eventHook) { return _this.buildHook(node, eventHook.callback, locals, options); };
	            return _this._matchingHooks(hookType, toFrom).map(transitionHook);
	        };
	        return path.map(hooksForNode);
	    };
	    HookBuilder.prototype.buildHook = function (node, fn, locals, options) {
	        if (options === void 0) { options = {}; }
	        var _options = common_1.extend({}, this.baseHookOptions, options);
	        return new module_1.TransitionHook(fn, common_1.extend({}, locals), node.resolveContext, _options);
	    };
	    HookBuilder.prototype._matchingHooks = function (hookName, matchCriteria) {
	        var matchFilter = function (hook) { return hook.matches(matchCriteria.to, matchCriteria.from); };
	        var prioritySort = function (l, r) { return r.priority - l.priority; };
	        return [this.transition, this.$transitions]
	            .map(function (reg) { return reg.getHooks(hookName); })
	            .filter(common_1.assertPredicate(common_1.isArray, "broken event named: " + hookName))
	            .reduce(common_1.unnestR)
	            .filter(matchFilter)
	            .sort(prioritySort);
	    };
	    return HookBuilder;
	})();
	exports.HookBuilder = HookBuilder;
	//# sourceMappingURL=hookBuilder.js.map

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(12);
	function matchState(state, matchCriteria) {
	    var toMatch = common_1.isString(matchCriteria) ? [matchCriteria] : matchCriteria;
	    function matchGlobs(_state) {
	        for (var i = 0; i < toMatch.length; i++) {
	            var glob = module_1.Glob.fromString(toMatch[i]);
	            if ((glob && glob.matches(_state.name)) || (!glob && toMatch[i] === _state.name)) {
	                return true;
	            }
	        }
	        return false;
	    }
	    var matchFn = (common_1.isFunction(toMatch) ? toMatch : matchGlobs);
	    return !!matchFn(state);
	}
	exports.matchState = matchState;
	var EventHook = (function () {
	    function EventHook(matchCriteria, callback, options) {
	        if (options === void 0) { options = {}; }
	        this.callback = callback;
	        this.matchCriteria = common_1.extend({ to: common_1.val(true), from: common_1.val(true) }, matchCriteria);
	        this.priority = options.priority || 0;
	    }
	    EventHook.prototype.matches = function (to, from) {
	        return matchState(to, this.matchCriteria.to) && matchState(from, this.matchCriteria.from);
	    };
	    return EventHook;
	})();
	exports.EventHook = EventHook;
	function makeHookRegistrationFn(hooks, name) {
	    return function (matchObject, callback, options) {
	        if (options === void 0) { options = {}; }
	        var eventHook = new EventHook(matchObject, callback, options);
	        hooks[name].push(eventHook);
	        return function deregisterEventHook() {
	            common_1.removeFrom(hooks[name])(eventHook);
	        };
	    };
	}
	var HookRegistry = (function () {
	    function HookRegistry() {
	        var _this = this;
	        this._transitionEvents = {
	            onBefore: [], onStart: [], onEnter: [], onRetain: [], onExit: [], onFinish: [], onSuccess: [], onError: []
	        };
	        this.getHooks = function (name) { return _this._transitionEvents[name]; };
	        this.onBefore = makeHookRegistrationFn(this._transitionEvents, "onBefore");
	        this.onStart = makeHookRegistrationFn(this._transitionEvents, "onStart");
	        this.onEnter = makeHookRegistrationFn(this._transitionEvents, "onEnter");
	        this.onRetain = makeHookRegistrationFn(this._transitionEvents, "onRetain");
	        this.onExit = makeHookRegistrationFn(this._transitionEvents, "onExit");
	        this.onFinish = makeHookRegistrationFn(this._transitionEvents, "onFinish");
	        this.onSuccess = makeHookRegistrationFn(this._transitionEvents, "onSuccess");
	        this.onError = makeHookRegistrationFn(this._transitionEvents, "onError");
	    }
	    HookRegistry.mixin = function (source, target) {
	        Object.keys(source._transitionEvents).concat(["getHooks"]).forEach(function (key) { return target[key] = source[key]; });
	    };
	    return HookRegistry;
	})();
	exports.HookRegistry = HookRegistry;
	//# sourceMappingURL=hookRegistry.js.map

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(13));
	__export(__webpack_require__(14));
	__export(__webpack_require__(41));
	__export(__webpack_require__(42));
	__export(__webpack_require__(43));
	__export(__webpack_require__(23));
	__export(__webpack_require__(44));
	__export(__webpack_require__(45));
	__export(__webpack_require__(46));
	__export(__webpack_require__(29));
	//# sourceMappingURL=module.js.map

/***/ },
/* 13 */
/***/ function(module, exports) {

	var Glob = (function () {
	    function Glob(text) {
	        this.text = text;
	        this.glob = text.split('.');
	    }
	    Glob.prototype.matches = function (name) {
	        var segments = name.split('.');
	        for (var i = 0, l = this.glob.length; i < l; i++) {
	            if (this.glob[i] === '*')
	                segments[i] = '*';
	        }
	        if (this.glob[0] === '**') {
	            segments = segments.slice(segments.indexOf(this.glob[1]));
	            segments.unshift('**');
	        }
	        if (this.glob[this.glob.length - 1] === '**') {
	            segments.splice(segments.indexOf(this.glob[this.glob.length - 2]) + 1, Number.MAX_VALUE);
	            segments.push('**');
	        }
	        if (this.glob.length != segments.length)
	            return false;
	        return segments.join('') === this.glob.join('');
	    };
	    Glob.is = function (text) {
	        return text.indexOf('*') > -1;
	    };
	    Glob.fromString = function (text) {
	        if (!this.is(text))
	            return null;
	        return new Glob(text);
	    };
	    return Glob;
	})();
	exports.Glob = Glob;
	//# sourceMappingURL=glob.js.map

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var queue_1 = __webpack_require__(5);
	var module_1 = __webpack_require__(12);
	var module_2 = __webpack_require__(9);
	var module_3 = __webpack_require__(15);
	var transitionManager_1 = __webpack_require__(23);
	var module_4 = __webpack_require__(36);
	function $StateProvider($urlRouterProvider, $urlMatcherFactoryProvider) {
	    var root, states = {};
	    var $state = function $state() { };
	    var matcher = new module_1.StateMatcher(states);
	    var builder = new module_1.StateBuilder(function () { return root; }, matcher, $urlMatcherFactoryProvider);
	    var stateQueue = new module_1.StateQueueManager(states, builder, $urlRouterProvider, $state);
	    var transQueue = new queue_1.Queue();
	    var treeChangesQueue = new queue_1.Queue();
	    var rejectFactory = new module_2.RejectFactory();
	    this.decorator = decorator;
	    function decorator(name, func) {
	        return builder.builder(name, func) || this;
	    }
	    this.state = state;
	    function state(name, definition) {
	        if (common_1.isObject(name)) {
	            definition = name;
	        }
	        else {
	            definition.name = name;
	        }
	        stateQueue.register(definition);
	        return this;
	    }
	    var invalidCallbacks = [];
	    this.onInvalid = onInvalid;
	    function onInvalid(callback) {
	        invalidCallbacks.push(callback);
	    }
	    this.$get = $get;
	    $get.$inject = ['$q', '$injector', '$view', '$stateParams', '$urlRouter', '$transitions'];
	    function $get($q, $injector, $view, $stateParams, $urlRouter, _$transition) {
	        function handleInvalidTargetState(fromPath, $to$) {
	            var latestThing = function () { return transQueue.peekTail() || treeChangesQueue.peekTail(); };
	            var latest = latestThing();
	            var $from$ = module_3.PathFactory.makeTargetState(fromPath);
	            var callbackQueue = new queue_1.Queue([].concat(invalidCallbacks));
	            var invokeCallback = function (callback) { return $q.when($injector.invoke(callback, null, { $to$: $to$, $from$: $from$ })); };
	            function checkForRedirect(result) {
	                if (!(result instanceof module_1.TargetState)) {
	                    return;
	                }
	                var target = result;
	                target = $state.target(target.identifier(), target.params(), target.options());
	                if (!target.valid())
	                    return rejectFactory.invalid(target.error());
	                if (latestThing() !== latest)
	                    return rejectFactory.superseded();
	                return $state.transitionTo(target.identifier(), target.params(), target.options());
	            }
	            function invokeNextCallback() {
	                var nextCallback = callbackQueue.dequeue();
	                if (nextCallback === undefined)
	                    return rejectFactory.invalid($to$.error());
	                return invokeCallback(nextCallback).then(checkForRedirect).then(function (result) { return result || invokeNextCallback(); });
	            }
	            return invokeNextCallback();
	        }
	        var $transitions = _$transition;
	        var rootStateDef = {
	            name: '',
	            url: '^',
	            views: null,
	            params: {
	                '#': { value: null, type: 'hash' }
	            },
	            abstract: true
	        };
	        root = stateQueue.register(rootStateDef, true);
	        root.navigable = null;
	        var rootPath = function () { return module_3.PathFactory.bindTransNodesToPath([new module_3.Node(root, {})]); };
	        $view.rootContext(root);
	        common_1.extend($state, {
	            params: new module_4.StateParams(),
	            current: root.self,
	            $current: root,
	            transition: null
	        });
	        stateQueue.flush($state);
	        stateQueue.autoFlush = true;
	        $state.reload = function reload(reloadState) {
	            return $state.transitionTo($state.current, $stateParams, {
	                reload: common_1.isDefined(reloadState) ? reloadState : true,
	                inherit: false,
	                notify: false
	            });
	        };
	        $state.go = function go(to, params, options) {
	            var defautGoOpts = { relative: $state.$current, inherit: true };
	            var transOpts = common_1.defaults(options, defautGoOpts, module_2.defaultTransOpts);
	            return $state.transitionTo(to, params, transOpts);
	        };
	        $state.target = function target(identifier, params, options) {
	            if (options === void 0) { options = {}; }
	            var stateDefinition = matcher.find(identifier, options.relative);
	            return new module_1.TargetState(identifier, stateDefinition, params, options);
	        };
	        $state.transitionTo = function transitionTo(to, toParams, options) {
	            if (toParams === void 0) { toParams = {}; }
	            if (options === void 0) { options = {}; }
	            options = common_1.defaults(options, module_2.defaultTransOpts);
	            options = common_1.extend(options, { current: transQueue.peekTail.bind(transQueue) });
	            if (common_1.isObject(options.reload) && !options.reload.name)
	                throw new Error('Invalid reload state object');
	            options.reloadState = options.reload === true ? $state.$current.path[0] : matcher.find(options.reload, options.relative);
	            if (options.reload && !options.reloadState)
	                throw new Error("No such reload state '" + (common_1.isString(options.reload) ? options.reload : options.reload.name) + "'");
	            var ref = $state.target(to, toParams, options);
	            var latestTreeChanges = treeChangesQueue.peekTail();
	            var currentPath = latestTreeChanges ? latestTreeChanges.to : rootPath();
	            if (!ref.exists())
	                return handleInvalidTargetState(currentPath, ref);
	            if (!ref.valid())
	                return $q.reject(ref.error());
	            var transition = $transitions.create(currentPath, ref);
	            var tMgr = new transitionManager_1.TransitionManager(transition, $transitions, $urlRouter, $view, $state, $stateParams, $q, transQueue, treeChangesQueue);
	            var transitionPromise = tMgr.runTransition();
	            return common_1.extend(transitionPromise, { transition: transition });
	        };
	        $state.is = function is(stateOrName, params, options) {
	            options = common_1.defaults(options, { relative: $state.$current });
	            var state = matcher.find(stateOrName, options.relative);
	            if (!common_1.isDefined(state))
	                return undefined;
	            if ($state.$current !== state)
	                return false;
	            return common_1.isDefined(params) && params !== null ? module_4.Param.equals(state.parameters(), $stateParams, params) : true;
	        };
	        $state.includes = function includes(stateOrName, params, options) {
	            options = common_1.defaults(options, { relative: $state.$current });
	            var glob = common_1.isString(stateOrName) && module_1.Glob.fromString(stateOrName);
	            if (glob) {
	                if (!glob.matches($state.$current.name))
	                    return false;
	                stateOrName = $state.$current.name;
	            }
	            var state = matcher.find(stateOrName, options.relative), include = $state.$current.includes;
	            if (!common_1.isDefined(state))
	                return undefined;
	            if (!common_1.isDefined(include[state.name]))
	                return false;
	            return params ? common_1.equalForKeys(module_4.Param.values(state.parameters(), params), $stateParams, Object.keys(params)) : true;
	        };
	        $state.href = function href(stateOrName, params, options) {
	            var defaultHrefOpts = {
	                lossy: true,
	                inherit: true,
	                absolute: false,
	                relative: $state.$current
	            };
	            options = common_1.defaults(options, defaultHrefOpts);
	            var state = matcher.find(stateOrName, options.relative);
	            if (!common_1.isDefined(state))
	                return null;
	            if (options.inherit)
	                params = $stateParams.$inherit(params || {}, $state.$current, state);
	            var nav = (state && options.lossy) ? state.navigable : state;
	            if (!nav || nav.url === undefined || nav.url === null) {
	                return null;
	            }
	            return $urlRouter.href(nav.url, module_4.Param.values(state.parameters(), params), {
	                absolute: options.absolute
	            });
	        };
	        $state.get = function (stateOrName, base) {
	            if (arguments.length === 0)
	                return Object.keys(states).map(function (name) { return states[name].self; });
	            var found = matcher.find(stateOrName, base || $state.$current);
	            return found && found.self || null;
	        };
	        return $state;
	    }
	}
	exports.$StateProvider = $StateProvider;
	//# sourceMappingURL=state.js.map

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(16));
	__export(__webpack_require__(22));
	//# sourceMappingURL=module.js.map

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(17);
	var view_1 = __webpack_require__(21);
	var Node = (function () {
	    function Node(state, params, resolves) {
	        if (resolves === void 0) { resolves = {}; }
	        this.state = state;
	        this.schema = state.parameters({ inherit: false });
	        var getParamVal = function (paramDef) { return [paramDef.id, paramDef.value(params[paramDef.id])]; };
	        this.values = this.schema.reduce(function (memo, pDef) { return common_1.applyPairs(memo, getParamVal(pDef)); }, {});
	        this.resolves = common_1.extend(common_1.map(state.resolve, function (fn, name) { return new module_1.Resolvable(name, fn); }), resolves);
	        var makeViewConfig = function (viewDeclarationObj, rawViewName) {
	            return new view_1.ViewConfig({ rawViewName: rawViewName, viewDeclarationObj: viewDeclarationObj, context: state, params: params });
	        };
	        this.views = common_1.values(common_1.map(state.views, makeViewConfig));
	    }
	    Node.prototype.parameter = function (name) {
	        return common_1.find(this.schema, common_1.propEq("id", name));
	    };
	    Node.prototype.equals = function (node, keys) {
	        var _this = this;
	        if (keys === void 0) { keys = this.schema.map(common_1.prop('id')); }
	        var paramValsEq = function (key) { return _this.parameter(key).type.equals(_this.values[key], node.values[key]); };
	        return this.state === node.state && keys.map(paramValsEq).reduce(common_1.allTrueR, true);
	    };
	    Node.clone = function (node, update) {
	        if (update === void 0) { update = {}; }
	        return new Node(node.state, (update.values || node.values), (update.resolves || node.resolves));
	    };
	    Node.matching = function (first, second) {
	        var matchedCount = first.reduce(function (prev, node, i) {
	            return prev === i && i < second.length && node.state === second[i].state ? i + 1 : prev;
	        }, 0);
	        return first.slice(0, matchedCount);
	    };
	    return Node;
	})();
	exports.Node = Node;
	//# sourceMappingURL=node.js.map

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(7));
	__export(__webpack_require__(18));
	__export(__webpack_require__(20));
	//# sourceMappingURL=module.js.map

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var trace_1 = __webpack_require__(6);
	var coreservices_1 = __webpack_require__(4);
	var interface_1 = __webpack_require__(19);
	var defaultResolvePolicy = interface_1.ResolvePolicy[interface_1.ResolvePolicy.LAZY];
	var ResolveContext = (function () {
	    function ResolveContext(_path) {
	        this._path = _path;
	        common_1.extend(this, {
	            _nodeFor: function (state) {
	                return common_1.find(this._path, common_1.propEq('state', state));
	            },
	            _pathTo: function (state) {
	                var node = this._nodeFor(state);
	                var elementIdx = this._path.indexOf(node);
	                if (elementIdx === -1)
	                    throw new Error("This path does not contain the state");
	                return this._path.slice(0, elementIdx + 1);
	            }
	        });
	    }
	    ResolveContext.prototype.getResolvables = function (state, options) {
	        options = common_1.defaults(options, { omitOwnLocals: [] });
	        var offset = common_1.find(this._path, common_1.propEq(''));
	        var path = (state ? this._pathTo(state) : this._path);
	        var last = common_1.tail(path);
	        return path.reduce(function (memo, node) {
	            var omitProps = (node === last) ? options.omitOwnLocals : [];
	            var filteredResolvables = common_1.omit(node.resolves, omitProps);
	            return common_1.extend(memo, filteredResolvables);
	        }, {});
	    };
	    ResolveContext.prototype.getResolvablesForFn = function (fn) {
	        var deps = coreservices_1.services.$injector.annotate(fn);
	        return common_1.pick(this.getResolvables(), deps);
	    };
	    ResolveContext.prototype.isolateRootTo = function (state) {
	        return new ResolveContext(this._pathTo(state));
	    };
	    ResolveContext.prototype.addResolvables = function (resolvables, state) {
	        common_1.extend(this._nodeFor(state).resolves, resolvables);
	    };
	    ResolveContext.prototype.getOwnResolvables = function (state) {
	        return common_1.extend({}, this._nodeFor(state).resolves);
	    };
	    ResolveContext.prototype.resolvePath = function (options) {
	        var _this = this;
	        if (options === void 0) { options = {}; }
	        trace_1.trace.traceResolvePath(this._path, options);
	        var promiseForNode = function (node) { return _this.resolvePathElement(node.state, options); };
	        return coreservices_1.services.$q.all(common_1.map(this._path, promiseForNode)).then(common_1.noop);
	    };
	    ResolveContext.prototype.resolvePathElement = function (state, options) {
	        var _this = this;
	        if (options === void 0) { options = {}; }
	        var policy = options && options.resolvePolicy;
	        var policyOrdinal = interface_1.ResolvePolicy[policy || defaultResolvePolicy];
	        var resolvables = this.getOwnResolvables(state);
	        var matchesRequestedPolicy = function (resolvable) { return getPolicy(state.resolvePolicy, resolvable) >= policyOrdinal; };
	        var matchingResolves = common_1.filter(resolvables, matchesRequestedPolicy);
	        var getResolvePromise = function (resolvable) { return resolvable.get(_this.isolateRootTo(state), options); };
	        var resolvablePromises = common_1.map(matchingResolves, getResolvePromise);
	        trace_1.trace.traceResolvePathElement(this, matchingResolves, options);
	        return coreservices_1.services.$q.all(resolvablePromises).then(common_1.noop);
	    };
	    ResolveContext.prototype.invokeLater = function (fn, locals, options) {
	        var _this = this;
	        if (locals === void 0) { locals = {}; }
	        if (options === void 0) { options = {}; }
	        var resolvables = this.getResolvablesForFn(fn);
	        trace_1.trace.tracePathElementInvoke(common_1.tail(this._path), fn, Object.keys(resolvables), common_1.extend({ when: "Later" }, options));
	        var getPromise = function (resolvable) { return resolvable.get(_this, options); };
	        var promises = common_1.map(resolvables, getPromise);
	        return coreservices_1.services.$q.all(promises).then(function () {
	            try {
	                return _this.invokeNow(fn, locals, options);
	            }
	            catch (error) {
	                return coreservices_1.services.$q.reject(error);
	            }
	        });
	    };
	    ResolveContext.prototype.invokeNow = function (fn, locals, options) {
	        if (options === void 0) { options = {}; }
	        var resolvables = this.getResolvablesForFn(fn);
	        trace_1.trace.tracePathElementInvoke(common_1.tail(this._path), fn, Object.keys(resolvables), common_1.extend({ when: "Now  " }, options));
	        var resolvedLocals = common_1.map(resolvables, common_1.prop("data"));
	        return coreservices_1.services.$injector.invoke(fn, null, common_1.extend({}, locals, resolvedLocals));
	    };
	    return ResolveContext;
	})();
	exports.ResolveContext = ResolveContext;
	function getPolicy(stateResolvePolicyConf, resolvable) {
	    var stateLevelPolicy = (common_1.isString(stateResolvePolicyConf) ? stateResolvePolicyConf : null);
	    var resolveLevelPolicies = (common_1.isObject(stateResolvePolicyConf) ? stateResolvePolicyConf : {});
	    var policyName = resolveLevelPolicies[resolvable.name] || stateLevelPolicy || defaultResolvePolicy;
	    return interface_1.ResolvePolicy[policyName];
	}
	//# sourceMappingURL=resolveContext.js.map

/***/ },
/* 19 */
/***/ function(module, exports) {

	(function (ResolvePolicy) {
	    ResolvePolicy[ResolvePolicy["JIT"] = 0] = "JIT";
	    ResolvePolicy[ResolvePolicy["LAZY"] = 1] = "LAZY";
	    ResolvePolicy[ResolvePolicy["EAGER"] = 2] = "EAGER";
	})(exports.ResolvePolicy || (exports.ResolvePolicy = {}));
	var ResolvePolicy = exports.ResolvePolicy;
	//# sourceMappingURL=interface.js.map

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var ResolveInjector = (function () {
	    function ResolveInjector(_resolveContext, _state) {
	        this._resolveContext = _resolveContext;
	        this._state = _state;
	    }
	    ResolveInjector.prototype.invokeLater = function (injectedFn, locals) {
	        return this._resolveContext.invokeLater(injectedFn, locals);
	    };
	    ResolveInjector.prototype.invokeNow = function (injectedFn, locals) {
	        return this._resolveContext.invokeNow(null, injectedFn, locals);
	    };
	    ResolveInjector.prototype.getLocals = function (injectedFn) {
	        var _this = this;
	        var resolve = function (r) { return r.get(_this._resolveContext); };
	        return common_1.map(this._resolveContext.getResolvablesForFn(injectedFn), resolve);
	    };
	    return ResolveInjector;
	})();
	exports.ResolveInjector = ResolveInjector;
	//# sourceMappingURL=resolveInjector.js.map

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(2);
	function normalizeUiViewTarget(rawViewName) {
	    if (rawViewName === void 0) { rawViewName = ""; }
	    var viewAtContext = rawViewName.split("@");
	    var uiViewName = viewAtContext[0] || "$default";
	    var uiViewContextAnchor = common_1.isString(viewAtContext[1]) ? viewAtContext[1] : "^";
	    var relativeViewNameSugar = /^(\^(?:\.\^)*)\.(.*$)/.exec(uiViewName);
	    if (relativeViewNameSugar) {
	        uiViewContextAnchor = relativeViewNameSugar[1];
	        uiViewName = relativeViewNameSugar[2];
	    }
	    if (uiViewName.charAt(0) === '!') {
	        uiViewName = uiViewName.substr(1);
	        uiViewContextAnchor = "";
	    }
	    return { uiViewName: uiViewName, uiViewContextAnchor: uiViewContextAnchor };
	}
	var ViewConfig = (function () {
	    function ViewConfig(stateViewConfig) {
	        var _a = normalizeUiViewTarget(stateViewConfig.rawViewName), uiViewName = _a.uiViewName, uiViewContextAnchor = _a.uiViewContextAnchor;
	        var relativeMatch = /^(\^(?:\.\^)*)$/;
	        if (relativeMatch.exec(uiViewContextAnchor)) {
	            var anchor = uiViewContextAnchor.split(".").reduce((function (anchor, x) { return anchor.parent; }), stateViewConfig.context);
	            uiViewContextAnchor = anchor.name;
	        }
	        common_1.extend(this, common_1.pick(stateViewConfig, "viewDeclarationObj", "params", "context", "locals"), { uiViewName: uiViewName, uiViewContextAnchor: uiViewContextAnchor });
	        this.controllerAs = stateViewConfig.viewDeclarationObj.controllerAs;
	    }
	    ViewConfig.prototype.hasTemplate = function () {
	        var viewDef = this.viewDeclarationObj;
	        return !!(viewDef.template || viewDef.templateUrl || viewDef.templateProvider);
	    };
	    ViewConfig.prototype.getTemplate = function ($factory, injector) {
	        return $factory.fromConfig(this.viewDeclarationObj, this.params, injector.invokeLater.bind(injector));
	    };
	    ViewConfig.prototype.getController = function (injector) {
	        var provider = this.viewDeclarationObj.controllerProvider;
	        return common_1.isInjectable(provider) ? injector.invokeLater(provider, {}) : this.viewDeclarationObj.controller;
	    };
	    return ViewConfig;
	})();
	exports.ViewConfig = ViewConfig;
	$View.$inject = ['$rootScope', '$templateFactory', '$q', '$timeout'];
	function $View($rootScope, $templateFactory, $q, $timeout) {
	    var uiViews = [];
	    var viewConfigs = [];
	    var match = function (obj1) {
	        var keys = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            keys[_i - 1] = arguments[_i];
	        }
	        return function (obj2) { return keys.reduce((function (memo, key) { return memo && obj1[key] === obj2[key]; }), true); };
	    };
	    this.rootContext = function (context) {
	        return context ? this._rootContext = context : this._rootContext;
	    };
	    this.load = function load(viewConfig, injector) {
	        if (!viewConfig.hasTemplate())
	            throw new Error("No template configuration specified for '" + viewConfig.uiViewName + "@" + viewConfig.uiViewContextAnchor + "'");
	        var promises = {
	            template: $q.when(viewConfig.getTemplate($templateFactory, injector)),
	            controller: $q.when(viewConfig.getController(injector))
	        };
	        return $q.all(promises).then(function (results) {
	            module_1.trace.traceViewServiceEvent("Loaded", viewConfig);
	            return common_1.extend(viewConfig, results);
	        });
	    };
	    this.reset = function reset(viewConfig) {
	        module_1.trace.traceViewServiceEvent("<- Removing", viewConfig);
	        viewConfigs.filter(match(viewConfig, "uiViewName", "context")).forEach(common_1.removeFrom(viewConfigs));
	    };
	    this.registerStateViewConfig = function (viewConfig) {
	        module_1.trace.traceViewServiceEvent("-> Registering", viewConfig);
	        viewConfigs.push(viewConfig);
	    };
	    this.sync = function () {
	        var uiViewsByFqn = uiViews.map(function (uiv) { return [uiv.fqn, uiv]; }).reduce(common_1.applyPairs, {});
	        var matches = common_1.curry(function (uiView, viewConfig) {
	            var vcSegments = viewConfig.uiViewName.split(".");
	            var uivSegments = uiView.fqn.split(".");
	            if (!angular.equals(vcSegments, uivSegments.slice(0 - vcSegments.length)))
	                return false;
	            var negOffset = (1 - vcSegments.length) || undefined;
	            var fqnToFirstSegment = uivSegments.slice(0, negOffset).join(".");
	            var uiViewContext = uiViewsByFqn[fqnToFirstSegment].creationContext;
	            return viewConfig.uiViewContextAnchor === (uiViewContext && uiViewContext.name);
	        });
	        function uiViewDepth(uiView) {
	            return uiView.fqn.split(".").length;
	        }
	        function viewConfigDepth(config) {
	            var context = config.context, count = 0;
	            while (++count && context.parent)
	                context = context.parent;
	            return count;
	        }
	        var depthCompare = common_1.curry(function (depthFn, posNeg, left, right) { return posNeg * (depthFn(left) - depthFn(right)); });
	        var matchingConfigPair = function (uiView) {
	            var matchingConfigs = viewConfigs.filter(matches(uiView));
	            if (matchingConfigs.length > 1)
	                matchingConfigs.sort(depthCompare(viewConfigDepth, -1));
	            return [uiView, matchingConfigs[0]];
	        };
	        var configureUiView = function (_a) {
	            var uiView = _a[0], viewConfig = _a[1];
	            if (uiViews.indexOf(uiView) !== -1)
	                uiView.configUpdated(viewConfig);
	        };
	        uiViews.sort(depthCompare(uiViewDepth, 1)).map(matchingConfigPair).forEach(configureUiView);
	    };
	    this.registerUiView = function register(uiView) {
	        module_1.trace.traceViewServiceUiViewEvent("-> Registering", uiView);
	        var fqnMatches = function (uiv) { return uiv.fqn === uiView.fqn; };
	        if (uiViews.filter(fqnMatches).length)
	            module_1.trace.traceViewServiceUiViewEvent("!!!! duplicate uiView named:", uiView);
	        uiViews.push(uiView);
	        this.sync();
	        return function () {
	            var idx = uiViews.indexOf(uiView);
	            if (idx <= 0) {
	                module_1.trace.traceViewServiceUiViewEvent("Tried removing non-registered uiView", uiView);
	                return;
	            }
	            module_1.trace.traceViewServiceUiViewEvent("<- Deregistering", uiView);
	            common_1.removeFrom(uiViews)(uiView);
	        };
	    };
	    this.available = function () { return uiViews.map(common_1.prop("fqn")); };
	    this.active = function () { return uiViews.filter(common_1.prop("$config")).map(common_1.prop("name")); };
	}
	angular.module('ui.router.state').service('$view', $View);
	//# sourceMappingURL=view.js.map

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(12);
	var module_2 = __webpack_require__(15);
	var module_3 = __webpack_require__(17);
	var PathFactory = (function () {
	    function PathFactory() {
	    }
	    PathFactory.makeTargetState = function (path) {
	        var state = common_1.tail(path).state;
	        return new module_1.TargetState(state, state, path.map(common_1.prop("values")).reduce(common_1.mergeR, {}));
	    };
	    PathFactory.buildToPath = function (fromPath, targetState) {
	        var toParams = targetState.params();
	        var toParamsNodeFn = PathFactory.makeParamsNode(toParams);
	        var toPath = targetState.$state().path.map(toParamsNodeFn);
	        if (targetState.options().inherit)
	            toPath = PathFactory.inheritParams(fromPath, toPath, Object.keys(toParams));
	        return toPath;
	    };
	    PathFactory.inheritParams = function (fromPath, toPath, toKeys) {
	        if (toKeys === void 0) { toKeys = []; }
	        function nodeParamVals(path, state) {
	            var node = common_1.find(path, common_1.propEq('state', state));
	            return common_1.extend({}, node && node.values);
	        }
	        var makeInheritedParamsNode = common_1.curry(function (_fromPath, _toKeys, toNode) {
	            var toParamVals = common_1.extend({}, toNode && toNode.values);
	            var incomingParamVals = common_1.pick(toParamVals, _toKeys);
	            toParamVals = common_1.omit(toParamVals, _toKeys);
	            var fromParamVals = nodeParamVals(_fromPath, toNode.state) || {};
	            var ownParamVals = common_1.extend(toParamVals, fromParamVals, incomingParamVals);
	            return new module_2.Node(toNode.state, ownParamVals);
	        });
	        return toPath.map(makeInheritedParamsNode(fromPath, toKeys));
	    };
	    PathFactory.bindTransNodesToPath = function (resolvePath) {
	        var resolveContext = new module_3.ResolveContext(resolvePath);
	        resolvePath.forEach(function (node) {
	            node.resolveContext = resolveContext.isolateRootTo(node.state);
	            node.resolveInjector = new module_3.ResolveInjector(node.resolveContext, node.state);
	            node.resolves.$stateParams = new module_3.Resolvable("$stateParams", function () { return node.values; }, node.values);
	        });
	        return resolvePath;
	    };
	    PathFactory.treeChanges = function (fromPath, toPath, reloadState) {
	        var keep = 0, max = Math.min(fromPath.length, toPath.length);
	        var staticParams = function (state) { return state.parameters({ inherit: false }).filter(common_1.not(common_1.prop('dynamic'))).map(common_1.prop('id')); };
	        var nodesMatch = function (node1, node2) { return node1.equals(node2, staticParams(node1.state)); };
	        while (keep < max && fromPath[keep].state !== reloadState && nodesMatch(fromPath[keep], toPath[keep])) {
	            keep++;
	        }
	        function applyToParams(retainedNode, idx) {
	            return module_2.Node.clone(retainedNode, { values: toPath[idx].values });
	        }
	        var from, retained, exiting, entering, to;
	        var retainedWithToParams, enteringResolvePath, toResolvePath;
	        from = fromPath;
	        retained = from.slice(0, keep);
	        exiting = from.slice(keep);
	        retainedWithToParams = retained.map(applyToParams);
	        enteringResolvePath = toPath.slice(keep);
	        toResolvePath = (retainedWithToParams).concat(enteringResolvePath);
	        to = PathFactory.bindTransNodesToPath(toResolvePath);
	        entering = to.slice(keep);
	        return { from: from, to: to, retained: retained, exiting: exiting, entering: entering };
	    };
	    PathFactory.bindTransitionResolve = function (treeChanges, transition) {
	        var rootNode = treeChanges.to[0];
	        rootNode.resolves.$transition$ = new module_3.Resolvable('$transition$', function () { return transition; }, transition);
	    };
	    PathFactory.makeParamsNode = common_1.curry(function (params, state) { return new module_2.Node(state, params); });
	    return PathFactory;
	})();
	exports.PathFactory = PathFactory;
	//# sourceMappingURL=pathFactory.js.map

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var param_1 = __webpack_require__(24);
	var rejectFactory_1 = __webpack_require__(28);
	var targetState_1 = __webpack_require__(29);
	var viewHooks_1 = __webpack_require__(30);
	var enterExitHooks_1 = __webpack_require__(39);
	var resolveHooks_1 = __webpack_require__(40);
	var TransitionManager = (function () {
	    function TransitionManager(transition, $transitions, $urlRouter, $view, $state, $stateParams, $q, activeTransQ, changeHistory) {
	        this.transition = transition;
	        this.$transitions = $transitions;
	        this.$urlRouter = $urlRouter;
	        this.$view = $view;
	        this.$state = $state;
	        this.$stateParams = $stateParams;
	        this.$q = $q;
	        this.activeTransQ = activeTransQ;
	        this.changeHistory = changeHistory;
	        this.viewHooks = new viewHooks_1.ViewHooks(transition, $view);
	        this.enterExitHooks = new enterExitHooks_1.EnterExitHooks(transition);
	        this.resolveHooks = new resolveHooks_1.ResolveHooks(transition);
	        this.treeChanges = transition.treeChanges();
	        this.registerUpdateGlobalState();
	        this.viewHooks.registerHooks();
	        this.enterExitHooks.registerHooks();
	        this.resolveHooks.registerHooks();
	    }
	    TransitionManager.prototype.runTransition = function () {
	        var _this = this;
	        this.activeTransQ.clear();
	        this.activeTransQ.enqueue(this.transition);
	        return this.transition.run()
	            .then(function (trans) { return trans.to(); })
	            .catch(function (error) { return _this.transRejected(error); })
	            .finally(function () { return _this.activeTransQ.remove(_this.transition); });
	    };
	    TransitionManager.prototype.registerUpdateGlobalState = function () {
	        this.transition.onFinish({}, this.updateGlobalState.bind(this), { priority: -10000 });
	    };
	    TransitionManager.prototype.updateGlobalState = function () {
	        var _a = this, treeChanges = _a.treeChanges, transition = _a.transition, $state = _a.$state, changeHistory = _a.changeHistory;
	        $state.$current = transition.$to();
	        $state.current = $state.$current.self;
	        changeHistory.enqueue(treeChanges);
	        this.updateStateParams();
	    };
	    TransitionManager.prototype.transRejected = function (error) {
	        var _a = this, transition = _a.transition, $state = _a.$state, $stateParams = _a.$stateParams, $q = _a.$q;
	        if (error instanceof rejectFactory_1.TransitionRejection) {
	            if (error.type === rejectFactory_1.RejectType.IGNORED) {
	                var dynamic = $state.$current.parameters().filter(common_1.prop('dynamic'));
	                if (!param_1.Param.equals(dynamic, $stateParams, transition.params())) {
	                    this.updateStateParams();
	                }
	                return $state.current;
	            }
	            if (error.type === rejectFactory_1.RejectType.SUPERSEDED && error.redirected && error.detail instanceof targetState_1.TargetState) {
	                return this._redirectMgr(transition.redirect(error.detail)).runTransition();
	            }
	        }
	        this.$transitions.defaultErrorHandler()(error);
	        return $q.reject(error);
	    };
	    TransitionManager.prototype.updateStateParams = function () {
	        var _a = this, transition = _a.transition, $urlRouter = _a.$urlRouter, $state = _a.$state, $stateParams = _a.$stateParams;
	        var options = transition.options();
	        $state.params = transition.params();
	        common_1.copy($state.params, $stateParams);
	        $stateParams.$sync().$off();
	        if (options.location && $state.$current.navigable) {
	            $urlRouter.push($state.$current.navigable.url, $stateParams, { replace: options.location === 'replace' });
	        }
	        $urlRouter.update(true);
	    };
	    TransitionManager.prototype._redirectMgr = function (redirect) {
	        var _a = this, $transitions = _a.$transitions, $urlRouter = _a.$urlRouter, $view = _a.$view, $state = _a.$state, $stateParams = _a.$stateParams, $q = _a.$q, activeTransQ = _a.activeTransQ, changeHistory = _a.changeHistory;
	        return new TransitionManager(redirect, $transitions, $urlRouter, $view, $state, $stateParams, $q, activeTransQ, changeHistory);
	    };
	    return TransitionManager;
	})();
	exports.TransitionManager = TransitionManager;
	//# sourceMappingURL=transitionManager.js.map

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var coreservices_1 = __webpack_require__(4);
	var urlMatcherConfig_1 = __webpack_require__(25);
	var type_1 = __webpack_require__(26);
	var paramTypes_1 = __webpack_require__(27);
	var hasOwn = Object.prototype.hasOwnProperty;
	var isShorthand = function (cfg) { return ["value", "type", "squash", "array", "dynamic"].filter(hasOwn.bind(cfg || {})).length === 0; };
	var DefType;
	(function (DefType) {
	    DefType[DefType["PATH"] = 0] = "PATH";
	    DefType[DefType["SEARCH"] = 1] = "SEARCH";
	    DefType[DefType["CONFIG"] = 2] = "CONFIG";
	})(DefType || (DefType = {}));
	var Param = (function () {
	    function Param(id, type, config, location) {
	        config = unwrapShorthand(config);
	        type = getType(config, type, location);
	        var arrayMode = getArrayMode();
	        type = arrayMode ? type.$asArray(arrayMode, location === DefType.SEARCH) : type;
	        var isOptional = config.value !== undefined;
	        var dynamic = config.dynamic === true;
	        var squash = getSquashPolicy(config, isOptional);
	        var replace = getReplace(config, arrayMode, isOptional, squash);
	        function unwrapShorthand(config) {
	            config = isShorthand(config) && { value: config } || config;
	            return common_1.extend(config, {
	                $$fn: common_1.isInjectable(config.value) ? config.value : function () { return config.value; }
	            });
	        }
	        function getType(config, urlType, location) {
	            if (config.type && urlType && urlType.name !== 'string')
	                throw new Error("Param '" + id + "' has two type configurations.");
	            if (config.type && urlType && urlType.name === 'string' && paramTypes_1.paramTypes.type(config.type))
	                return paramTypes_1.paramTypes.type(config.type);
	            if (urlType)
	                return urlType;
	            if (!config.type)
	                return (location === DefType.CONFIG ? paramTypes_1.paramTypes.type("any") : paramTypes_1.paramTypes.type("string"));
	            return config.type instanceof type_1.Type ? config.type : paramTypes_1.paramTypes.type(config.type);
	        }
	        function getArrayMode() {
	            var arrayDefaults = { array: (location === DefType.SEARCH ? "auto" : false) };
	            var arrayParamNomenclature = id.match(/\[\]$/) ? { array: true } : {};
	            return common_1.extend(arrayDefaults, arrayParamNomenclature, config).array;
	        }
	        function getSquashPolicy(config, isOptional) {
	            var squash = config.squash;
	            if (!isOptional || squash === false)
	                return false;
	            if (!common_1.isDefined(squash) || squash == null)
	                return urlMatcherConfig_1.matcherConfig.defaultSquashPolicy();
	            if (squash === true || common_1.isString(squash))
	                return squash;
	            throw new Error("Invalid squash policy: '" + squash + "'. Valid policies: false, true, or arbitrary string");
	        }
	        function getReplace(config, arrayMode, isOptional, squash) {
	            var replace, configuredKeys, defaultPolicy = [
	                { from: "", to: (isOptional || arrayMode ? undefined : "") },
	                { from: null, to: (isOptional || arrayMode ? undefined : "") }
	            ];
	            replace = common_1.isArray(config.replace) ? config.replace : [];
	            if (common_1.isString(squash))
	                replace.push({ from: squash, to: undefined });
	            configuredKeys = common_1.map(replace, common_1.prop("from"));
	            return common_1.filter(defaultPolicy, function (item) { return configuredKeys.indexOf(item.from) === -1; }).concat(replace);
	        }
	        common_1.extend(this, { id: id, type: type, location: location, squash: squash, replace: replace, isOptional: isOptional, dynamic: dynamic, config: config, array: arrayMode });
	    }
	    Param.prototype.isDefaultValue = function (value) {
	        return this.isOptional && this.type.equals(this.value(), value);
	    };
	    Param.prototype.value = function (value) {
	        var _this = this;
	        var $$getDefaultValue = function () {
	            if (!coreservices_1.services.$injector)
	                throw new Error("Injectable functions cannot be called at configuration time");
	            var defaultValue = coreservices_1.services.$injector.invoke(_this.config.$$fn);
	            if (defaultValue !== null && defaultValue !== undefined && !_this.type.is(defaultValue))
	                throw new Error("Default value (" + defaultValue + ") for parameter '" + _this.id + "' is not an instance of Type (" + _this.type.name + ")");
	            return defaultValue;
	        };
	        var $replace = function (value) {
	            var replacement = common_1.map(common_1.filter(_this.replace, common_1.propEq('from', value)), common_1.prop("to"));
	            return replacement.length ? replacement[0] : value;
	        };
	        value = $replace(value);
	        return !common_1.isDefined(value) ? $$getDefaultValue() : this.type.$normalize(value);
	    };
	    Param.prototype.isSearch = function () {
	        return this.location === DefType.SEARCH;
	    };
	    Param.prototype.validates = function (value) {
	        if ((!common_1.isDefined(value) || value === null) && this.isOptional)
	            return true;
	        var normalized = this.type.$normalize(value);
	        if (!this.type.is(normalized))
	            return false;
	        var encoded = this.type.encode(normalized);
	        if (common_1.isString(encoded) && !this.type.pattern.exec(encoded))
	            return false;
	        return true;
	    };
	    Param.prototype.toString = function () {
	        return "{Param:" + this.id + " " + this.type + " squash: '" + this.squash + "' optional: " + this.isOptional + "}";
	    };
	    Param.fromConfig = function (id, type, config) {
	        return new Param(id, type, config, DefType.CONFIG);
	    };
	    Param.fromPath = function (id, type, config) {
	        return new Param(id, type, config, DefType.PATH);
	    };
	    Param.fromSearch = function (id, type, config) {
	        return new Param(id, type, config, DefType.SEARCH);
	    };
	    Param.values = function (params, values) {
	        values = values || {};
	        return params.map(function (param) { return [param.id, param.value(values[param.id])]; }).reduce(common_1.applyPairs, {});
	    };
	    Param.equals = function (params, values1, values2) {
	        values1 = values1 || {};
	        values2 = values2 || {};
	        return params.map(function (param) { return param.type.equals(values1[param.id], values2[param.id]); }).indexOf(false) === -1;
	    };
	    Param.validates = function (params, values) {
	        values = values || {};
	        return params.map(function (param) { return param.validates(values[param.id]); }).indexOf(false) === -1;
	    };
	    return Param;
	})();
	exports.Param = Param;
	//# sourceMappingURL=param.js.map

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var MatcherConfig = (function () {
	    function MatcherConfig() {
	        this._isCaseInsensitive = false;
	        this._isStrictMode = true;
	        this._defaultSquashPolicy = false;
	    }
	    MatcherConfig.prototype.caseInsensitive = function (value) {
	        return this._isCaseInsensitive = common_1.isDefined(value) ? value : this._isCaseInsensitive;
	    };
	    MatcherConfig.prototype.strictMode = function (value) {
	        return this._isStrictMode = common_1.isDefined(value) ? value : this._isStrictMode;
	    };
	    MatcherConfig.prototype.defaultSquashPolicy = function (value) {
	        if (common_1.isDefined(value) && value !== true && value !== false && !common_1.isString(value))
	            throw new Error("Invalid squash policy: " + value + ". Valid policies: false, true, arbitrary-string");
	        return this._defaultSquashPolicy = common_1.isDefined(value) ? value : this._defaultSquashPolicy;
	    };
	    return MatcherConfig;
	})();
	exports.matcherConfig = new MatcherConfig();
	//# sourceMappingURL=urlMatcherConfig.js.map

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	function ArrayType(type, mode) {
	    var _this = this;
	    function arrayWrap(val) { return common_1.isArray(val) ? val : (common_1.isDefined(val) ? [val] : []); }
	    function arrayUnwrap(val) {
	        switch (val.length) {
	            case 0: return undefined;
	            case 1: return mode === "auto" ? val[0] : val;
	            default: return val;
	        }
	    }
	    function arrayHandler(callback, allTruthyMode) {
	        return function handleArray(val) {
	            var arr = arrayWrap(val);
	            var result = common_1.map(arr, callback);
	            return (allTruthyMode === true) ? common_1.filter(result, function (val) { return !val; }).length === 0 : arrayUnwrap(result);
	        };
	    }
	    function arrayEqualsHandler(callback) {
	        return function handleArray(val1, val2) {
	            var left = arrayWrap(val1), right = arrayWrap(val2);
	            if (left.length !== right.length)
	                return false;
	            for (var i = 0; i < left.length; i++) {
	                if (!callback(left[i], right[i]))
	                    return false;
	            }
	            return true;
	        };
	    }
	    ['encode', 'decode', 'equals', '$normalize'].map(function (name) {
	        _this[name] = (name === 'equals' ? arrayEqualsHandler : arrayHandler)(type[name].bind(type));
	    });
	    common_1.extend(this, {
	        name: type.name,
	        pattern: type.pattern,
	        is: arrayHandler(type.is.bind(type), true),
	        $arrayMode: mode
	    });
	}
	var Type = (function () {
	    function Type(def) {
	        this.pattern = /.*/;
	        common_1.extend(this, def);
	    }
	    Type.prototype.is = function (val, key) { return true; };
	    Type.prototype.encode = function (val, key) { return val; };
	    Type.prototype.decode = function (val, key) { return val; };
	    Type.prototype.equals = function (a, b) { return a == b; };
	    Type.prototype.$subPattern = function () {
	        var sub = this.pattern.toString();
	        return sub.substr(1, sub.length - 2);
	    };
	    Type.prototype.toString = function () {
	        return "{Type:" + this.name + "}";
	    };
	    Type.prototype.$normalize = function (val) {
	        return this.is(val) ? val : this.decode(val);
	    };
	    Type.prototype.$asArray = function (mode, isSearch) {
	        if (!mode)
	            return this;
	        if (mode === "auto" && !isSearch)
	            throw new Error("'auto' array mode is for query parameters only");
	        return new ArrayType(this, mode);
	    };
	    return Type;
	})();
	exports.Type = Type;
	//# sourceMappingURL=type.js.map

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var coreservices_1 = __webpack_require__(4);
	var type_1 = __webpack_require__(26);
	var swapString = function (search, replace) { return function (val) { return val != null ? val.toString().replace(search, replace) : val; }; };
	var valToString = swapString(/\//g, "%2F");
	var valFromString = swapString(/%2F/g, "/");
	var ParamTypes = (function () {
	    function ParamTypes() {
	        this.enqueue = true;
	        this.typeQueue = [];
	        this.defaultTypes = {
	            hash: {
	                encode: valToString,
	                decode: valFromString,
	                is: common_1.is(String),
	                pattern: /.*/,
	                equals: common_1.val(true)
	            },
	            string: {
	                encode: valToString,
	                decode: valFromString,
	                is: common_1.is(String),
	                pattern: /[^/]*/
	            },
	            int: {
	                encode: valToString,
	                decode: function (val) { return parseInt(val, 10); },
	                is: function (val) { return common_1.isDefined(val) && this.decode(val.toString()) === val; },
	                pattern: /-?\d+/
	            },
	            bool: {
	                encode: function (val) { return val && 1 || 0; },
	                decode: function (val) { return parseInt(val, 10) !== 0; },
	                is: common_1.is(Boolean),
	                pattern: /0|1/
	            },
	            date: {
	                encode: function (val) {
	                    return !this.is(val) ? undefined : [
	                        val.getFullYear(),
	                        ('0' + (val.getMonth() + 1)).slice(-2),
	                        ('0' + val.getDate()).slice(-2)
	                    ].join("-");
	                },
	                decode: function (val) {
	                    if (this.is(val))
	                        return val;
	                    var match = this.capture.exec(val);
	                    return match ? new Date(match[1], match[2] - 1, match[3]) : undefined;
	                },
	                is: function (val) { return val instanceof Date && !isNaN(val.valueOf()); },
	                equals: function (a, b) { return this.is(a) && this.is(b) && a.toISOString() === b.toISOString(); },
	                pattern: /[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])/,
	                capture: /([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/
	            },
	            json: {
	                encode: common_1.toJson,
	                decode: common_1.fromJson,
	                is: common_1.is(Object),
	                equals: common_1.equals,
	                pattern: /[^/]*/
	            },
	            any: {
	                encode: common_1.identity,
	                decode: common_1.identity,
	                equals: common_1.equals,
	                pattern: /.*/
	            }
	        };
	        var makeType = function (definition, name) { return new type_1.Type(common_1.extend({ name: name }, definition)); };
	        this.types = common_1.inherit(common_1.map(this.defaultTypes, makeType), {});
	    }
	    ParamTypes.prototype.type = function (name, definition, definitionFn) {
	        if (!common_1.isDefined(definition))
	            return this.types[name];
	        if (this.types.hasOwnProperty(name))
	            throw new Error("A type named '" + name + "' has already been defined.");
	        this.types[name] = new type_1.Type(common_1.extend({ name: name }, definition));
	        if (definitionFn) {
	            this.typeQueue.push({ name: name, def: definitionFn });
	            if (!this.enqueue)
	                this._flushTypeQueue();
	        }
	        return this;
	    };
	    ParamTypes.prototype._flushTypeQueue = function () {
	        while (this.typeQueue.length) {
	            var type = this.typeQueue.shift();
	            if (type.pattern)
	                throw new Error("You cannot override a type's .pattern at runtime.");
	            common_1.extend(this.types[type.name], coreservices_1.services.$injector.invoke(type.def));
	        }
	    };
	    return ParamTypes;
	})();
	exports.paramTypes = new ParamTypes();
	//# sourceMappingURL=paramTypes.js.map

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var common_1 = __webpack_require__(3);
	var coreservices_1 = __webpack_require__(4);
	(function (RejectType) {
	    RejectType[RejectType["SUPERSEDED"] = 2] = "SUPERSEDED";
	    RejectType[RejectType["ABORTED"] = 3] = "ABORTED";
	    RejectType[RejectType["INVALID"] = 4] = "INVALID";
	    RejectType[RejectType["IGNORED"] = 5] = "IGNORED";
	})(exports.RejectType || (exports.RejectType = {}));
	var RejectType = exports.RejectType;
	var TransitionRejection = (function () {
	    function TransitionRejection(type, message, detail) {
	        common_1.extend(this, {
	            type: type,
	            message: message,
	            detail: detail
	        });
	    }
	    TransitionRejection.prototype.toString = function () {
	        var detailString = function (d) { return d && d.toString !== Object.prototype.toString ? d.toString() : JSON.stringify(d); };
	        var type = this.type, message = this.message, detail = detailString(this.detail);
	        return "TransitionRejection(type: " + type + ", message: " + message + ", detail: " + detail + ")";
	    };
	    return TransitionRejection;
	})();
	exports.TransitionRejection = TransitionRejection;
	var RejectFactory = (function () {
	    function RejectFactory() {
	    }
	    RejectFactory.prototype.superseded = function (detail, options) {
	        var message = "The transition has been superseded by a different transition (see detail).";
	        var reason = new TransitionRejection(RejectType.SUPERSEDED, message, detail);
	        if (options && options.redirected) {
	            reason.redirected = true;
	        }
	        return common_1.extend(coreservices_1.services.$q.reject(reason), { reason: reason });
	    };
	    RejectFactory.prototype.redirected = function (detail) {
	        return this.superseded(detail, { redirected: true });
	    };
	    RejectFactory.prototype.invalid = function (detail) {
	        var message = "This transition is invalid (see detail)";
	        var reason = new TransitionRejection(RejectType.INVALID, message, detail);
	        return common_1.extend(coreservices_1.services.$q.reject(reason), { reason: reason });
	    };
	    RejectFactory.prototype.ignored = function (detail) {
	        var message = "The transition was ignored.";
	        var reason = new TransitionRejection(RejectType.IGNORED, message, detail);
	        return common_1.extend(coreservices_1.services.$q.reject(reason), { reason: reason });
	    };
	    RejectFactory.prototype.aborted = function (detail) {
	        var message = "The transition has been aborted.";
	        var reason = new TransitionRejection(RejectType.ABORTED, message, detail);
	        return common_1.extend(coreservices_1.services.$q.reject(reason), { reason: reason });
	    };
	    return RejectFactory;
	})();
	exports.RejectFactory = RejectFactory;
	//# sourceMappingURL=rejectFactory.js.map

/***/ },
/* 29 */
/***/ function(module, exports) {

	var TargetState = (function () {
	    function TargetState(_identifier, _definition, _params, _options) {
	        if (_params === void 0) { _params = {}; }
	        if (_options === void 0) { _options = {}; }
	        this._identifier = _identifier;
	        this._definition = _definition;
	        this._options = _options;
	        this._params = _params || {};
	    }
	    TargetState.prototype.name = function () {
	        return this._definition && this._definition.name || this._identifier;
	    };
	    TargetState.prototype.identifier = function () {
	        return this._identifier;
	    };
	    TargetState.prototype.params = function () {
	        return this._params;
	    };
	    TargetState.prototype.$state = function () {
	        return this._definition;
	    };
	    TargetState.prototype.state = function () {
	        return this._definition && this._definition.self;
	    };
	    TargetState.prototype.options = function () {
	        return this._options;
	    };
	    TargetState.prototype.exists = function () {
	        return !!(this._definition && this._definition.self);
	    };
	    TargetState.prototype.valid = function () {
	        return !this.error();
	    };
	    TargetState.prototype.error = function () {
	        var base = this.options().relative;
	        if (!this._definition && !!base) {
	            var stateName = base.name ? base.name : base;
	            return "Could not resolve '" + this.name() + "' from state '" + stateName + "'";
	        }
	        if (!this._definition)
	            return "No such state '" + this.name() + "'";
	        if (!this._definition.self)
	            return "State '" + this.name() + "' has an invalid definition";
	    };
	    return TargetState;
	})();
	exports.TargetState = TargetState;
	//# sourceMappingURL=targetState.js.map

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var coreservices_1 = __webpack_require__(4);
	var angular1_1 = __webpack_require__(31);
	var ViewHooks = (function () {
	    function ViewHooks(transition, $view) {
	        this.transition = transition;
	        this.$view = $view;
	        this.treeChanges = transition.treeChanges();
	        this.enteringViews = transition.views("entering");
	        this.exitingViews = transition.views("exiting");
	    }
	    ViewHooks.prototype.loadAllEnteringViews = function () {
	        var _this = this;
	        var loadView = function (vc) {
	            var resolveInjector = common_1.find(_this.treeChanges.to, common_1.propEq('state', vc.context)).resolveInjector;
	            return _this.$view.load(vc, resolveInjector);
	        };
	        return coreservices_1.services.$q.all(this.enteringViews.map(loadView)).then(common_1.noop);
	    };
	    ViewHooks.prototype.loadAllControllerLocals = function () {
	        var _this = this;
	        var loadLocals = function (vc) {
	            var deps = angular1_1.annotateController(vc.controller);
	            var resolveInjector = common_1.find(_this.treeChanges.to, common_1.propEq('state', vc.context)).resolveInjector;
	            function $loadControllerLocals() { }
	            $loadControllerLocals.$inject = deps;
	            return coreservices_1.services.$q.all(resolveInjector.getLocals($loadControllerLocals)).then(function (locals) { return vc.locals = locals; });
	        };
	        var loadAllLocals = this.enteringViews.filter(function (vc) { return !!vc.controller; }).map(loadLocals);
	        return coreservices_1.services.$q.all(loadAllLocals).then(common_1.noop);
	    };
	    ViewHooks.prototype.updateViews = function () {
	        var $view = this.$view;
	        this.exitingViews.forEach(function (viewConfig) { return $view.reset(viewConfig); });
	        this.enteringViews.forEach(function (viewConfig) { return $view.registerStateViewConfig(viewConfig); });
	        $view.sync();
	    };
	    ViewHooks.prototype.registerHooks = function () {
	        if (this.enteringViews.length) {
	            this.transition.onStart({}, this.loadAllEnteringViews.bind(this));
	            this.transition.onFinish({}, this.loadAllControllerLocals.bind(this));
	        }
	        if (this.exitingViews.length || this.enteringViews.length)
	            this.transition.onSuccess({}, this.updateViews.bind(this));
	    };
	    return ViewHooks;
	})();
	exports.ViewHooks = ViewHooks;
	//# sourceMappingURL=viewHooks.js.map

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var router_1 = __webpack_require__(32);
	var coreservices_1 = __webpack_require__(4);
	var common_1 = __webpack_require__(3);
	var app = angular.module("ui.router.angular1", []);
	function annotateController(controllerExpression) {
	    var $injector = coreservices_1.services.$injector;
	    var $controller = $injector.get("$controller");
	    var oldInstantiate = $injector.instantiate;
	    try {
	        var deps;
	        $injector.instantiate = function fakeInstantiate(constructorFunction) {
	            $injector.instantiate = oldInstantiate;
	            deps = $injector.annotate(constructorFunction);
	        };
	        $controller(controllerExpression, { $scope: {} });
	        return deps;
	    }
	    finally {
	        $injector.instantiate = oldInstantiate;
	    }
	}
	exports.annotateController = annotateController;
	runBlock.$inject = ['$injector', '$q'];
	function runBlock($injector, $q) {
	    coreservices_1.services.$injector = $injector;
	    coreservices_1.services.$q = $q;
	}
	app.run(runBlock);
	var bindFunctions = function (fnNames, from, to) {
	    return fnNames.forEach(function (name) { return to[name] = from[name].bind(from); });
	};
	var router = null;
	ng1UIRouter.$inject = ['$locationProvider'];
	function ng1UIRouter($locationProvider) {
	    router = new router_1.Router();
	    bindFunctions(['hashPrefix'], $locationProvider, coreservices_1.services.locationConfig);
	    this.$get = $get;
	    $get.$inject = ['$location', '$browser', '$sniffer'];
	    function $get($location, $browser, $sniffer) {
	        coreservices_1.services.locationConfig.html5Mode = function () {
	            var html5Mode = $locationProvider.html5Mode();
	            html5Mode = common_1.isObject(html5Mode) ? html5Mode.enabled : html5Mode;
	            return html5Mode && $sniffer.history;
	        };
	        bindFunctions(["replace", "url", "path", "search", "hash"], $location, coreservices_1.services.location);
	        bindFunctions(['port', 'protocol', 'host'], $location, coreservices_1.services.locationConfig);
	        bindFunctions(['baseHref'], $browser, coreservices_1.services.locationConfig);
	        return router;
	    }
	}
	angular.module('ui.router.init', []).provider("ng1UIRouter", ng1UIRouter);
	angular.module('ui.router.util').provider('$urlMatcherFactory', ['ng1UIRouterProvider', function () { return router.urlMatcherFactory; }]);
	angular.module('ui.router.router').provider('$urlRouter', ['ng1UIRouterProvider', function () { return router.urlRouterProvider; }]);
	angular.module('ui.router.state').provider('$state', ['ng1UIRouterProvider', function () { return router.stateProvider; }]);
	angular.module('ui.router.init').run(['ng1UIRouter', function (ng1UIRouter) { }]);
	angular.module('ui.router.state').run(['$state', function ($state) { }]);
	angular.module('ui.router.util').run(['$urlMatcherFactory', function ($urlMatcherFactory) { }]);
	//# sourceMappingURL=angular1.js.map

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var urlMatcherFactory_1 = __webpack_require__(33);
	var urlRouter_1 = __webpack_require__(38);
	var state_1 = __webpack_require__(14);
	var Router = (function () {
	    function Router() {
	        this.urlMatcherFactory = new urlMatcherFactory_1.UrlMatcherFactory();
	        this.urlRouterProvider = new urlRouter_1.$UrlRouterProvider(this.urlMatcherFactory);
	        this.stateProvider = new state_1.$StateProvider(this.urlRouterProvider, this.urlMatcherFactory);
	    }
	    return Router;
	})();
	exports.Router = Router;
	//# sourceMappingURL=router.js.map

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(34);
	var module_2 = __webpack_require__(36);
	function getDefaultConfig() {
	    return {
	        strict: module_1.matcherConfig.strictMode(),
	        caseInsensitive: module_1.matcherConfig.caseInsensitive()
	    };
	}
	var UrlMatcherFactory = (function () {
	    function UrlMatcherFactory() {
	        common_1.extend(this, { UrlMatcher: module_1.UrlMatcher, Param: module_2.Param });
	    }
	    UrlMatcherFactory.prototype.caseInsensitive = function (value) {
	        return module_1.matcherConfig.caseInsensitive(value);
	    };
	    UrlMatcherFactory.prototype.strictMode = function (value) {
	        return module_1.matcherConfig.strictMode(value);
	    };
	    UrlMatcherFactory.prototype.defaultSquashPolicy = function (value) {
	        return module_1.matcherConfig.defaultSquashPolicy(value);
	    };
	    UrlMatcherFactory.prototype.compile = function (pattern, config) {
	        return new module_1.UrlMatcher(pattern, common_1.extend(getDefaultConfig(), config));
	    };
	    UrlMatcherFactory.prototype.isMatcher = function (object) {
	        if (!common_1.isObject(object))
	            return false;
	        var result = true;
	        common_1.forEach(module_1.UrlMatcher.prototype, function (val, name) {
	            if (common_1.isFunction(val))
	                result = result && (common_1.isDefined(object[name]) && common_1.isFunction(object[name]));
	        });
	        return result;
	    };
	    ;
	    UrlMatcherFactory.prototype.type = function (name, definition, definitionFn) {
	        var type = module_2.paramTypes.type(name, definition, definitionFn);
	        return !common_1.isDefined(definition) ? type : this;
	    };
	    ;
	    UrlMatcherFactory.prototype.$get = function () {
	        module_2.paramTypes.enqueue = false;
	        module_2.paramTypes._flushTypeQueue();
	        return this;
	    };
	    ;
	    return UrlMatcherFactory;
	})();
	exports.UrlMatcherFactory = UrlMatcherFactory;
	//# sourceMappingURL=urlMatcherFactory.js.map

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(35));
	__export(__webpack_require__(25));
	__export(__webpack_require__(33));
	__export(__webpack_require__(38));
	//# sourceMappingURL=module.js.map

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(36);
	function quoteRegExp(string, param) {
	    var surroundPattern = ['', ''], result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
	    if (!param)
	        return result;
	    switch (param.squash) {
	        case false:
	            surroundPattern = ['(', ')' + (param.isOptional ? '?' : '')];
	            break;
	        case true:
	            surroundPattern = ['?(', ')?'];
	            break;
	        default:
	            surroundPattern = [("(" + param.squash + "|"), ')?'];
	            break;
	    }
	    return result + surroundPattern[0] + param.type.pattern.source + surroundPattern[1];
	}
	var memoizeTo = function (obj, prop, fn) { return obj[prop] = obj[prop] || fn(); };
	var UrlMatcher = (function () {
	    function UrlMatcher(pattern, config) {
	        var _this = this;
	        this.pattern = pattern;
	        this.config = config;
	        this._cache = { path: [], pattern: null };
	        this._children = [];
	        this._params = [];
	        this._segments = [];
	        this._compiled = [];
	        this.config = common_1.defaults(this.config, {
	            params: {},
	            strict: true,
	            caseInsensitive: false,
	            paramMap: common_1.identity
	        });
	        var placeholder = /([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g, searchPlaceholder = /([:]?)([\w\[\]-]+)|\{([\w\[\]-]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g, last = 0, m, patterns = [];
	        var checkParamErrors = function (id) {
	            if (!UrlMatcher.nameValidator.test(id))
	                throw new Error("Invalid parameter name '" + id + "' in pattern '" + pattern + "'");
	            if (common_1.find(_this._params, common_1.propEq('id', id)))
	                throw new Error("Duplicate parameter name '" + id + "' in pattern '" + pattern + "'");
	        };
	        var matchDetails = function (m, isSearch) {
	            var id = m[2] || m[3], regexp = isSearch ? m[4] : m[4] || (m[1] === '*' ? '.*' : null);
	            return {
	                id: id,
	                regexp: regexp,
	                cfg: _this.config.params[id],
	                segment: pattern.substring(last, m.index),
	                type: !regexp ? null : module_1.paramTypes.type(regexp || "string") || common_1.inherit(module_1.paramTypes.type("string"), {
	                    pattern: new RegExp(regexp, _this.config.caseInsensitive ? 'i' : undefined)
	                })
	            };
	        };
	        var p, param, segment;
	        while ((m = placeholder.exec(pattern))) {
	            p = matchDetails(m, false);
	            if (p.segment.indexOf('?') >= 0)
	                break;
	            checkParamErrors(p.id);
	            this._params.push(module_1.Param.fromPath(p.id, p.type, this.config.paramMap(p.cfg, false)));
	            this._segments.push(p.segment);
	            patterns.push([p.segment, common_1.tail(this._params)]);
	            last = placeholder.lastIndex;
	        }
	        segment = pattern.substring(last);
	        var i = segment.indexOf('?');
	        if (i >= 0) {
	            var search = segment.substring(i);
	            segment = segment.substring(0, i);
	            if (search.length > 0) {
	                last = 0;
	                while ((m = searchPlaceholder.exec(search))) {
	                    p = matchDetails(m, true);
	                    checkParamErrors(p.id);
	                    this._params.push(module_1.Param.fromSearch(p.id, p.type, this.config.paramMap(p.cfg, true)));
	                    last = placeholder.lastIndex;
	                }
	            }
	        }
	        this._segments.push(segment);
	        common_1.extend(this, {
	            _compiled: patterns.map(function (pattern) { return quoteRegExp.apply(null, pattern); }).concat(quoteRegExp(segment)),
	            prefix: this._segments[0]
	        });
	        Object.freeze(this);
	    }
	    UrlMatcher.prototype.append = function (url) {
	        this._children.push(url);
	        common_1.forEach(url._cache, function (val, key) { return url._cache[key] = common_1.isArray(val) ? [] : null; });
	        url._cache.path = this._cache.path.concat(this);
	        return url;
	    };
	    UrlMatcher.prototype.isRoot = function () {
	        return this._cache.path.length === 0;
	    };
	    UrlMatcher.prototype.toString = function () {
	        return this.pattern;
	    };
	    UrlMatcher.prototype.exec = function (path, search, hash, options) {
	        var _this = this;
	        if (search === void 0) { search = {}; }
	        if (options === void 0) { options = {}; }
	        var match = memoizeTo(this._cache, 'pattern', function () {
	            return new RegExp([
	                '^',
	                common_1.unnest(_this._cache.path.concat(_this).map(common_1.prop('_compiled'))).join(''),
	                _this.config.strict === false ? '\/?' : '',
	                '$'
	            ].join(''), _this.config.caseInsensitive ? 'i' : undefined);
	        }).exec(path);
	        if (!match)
	            return null;
	        var allParams = this.parameters(), pathParams = allParams.filter(function (param) { return !param.isSearch(); }), searchParams = allParams.filter(function (param) { return param.isSearch(); }), nPathSegments = this._cache.path.concat(this).map(function (urlm) { return urlm._segments.length - 1; }).reduce(function (a, x) { return a + x; }), values = {};
	        if (nPathSegments !== match.length - 1)
	            throw new Error("Unbalanced capture group in route '" + this.pattern + "'");
	        function decodePathArray(string) {
	            var reverseString = function (str) { return str.split("").reverse().join(""); };
	            var unquoteDashes = function (str) { return str.replace(/\\-/g, "-"); };
	            var split = reverseString(string).split(/-(?!\\)/);
	            var allReversed = common_1.map(split, reverseString);
	            return common_1.map(allReversed, unquoteDashes).reverse();
	        }
	        for (var i = 0; i < nPathSegments; i++) {
	            var param = pathParams[i];
	            var value = match[i + 1];
	            for (var j = 0; j < param.replace; j++) {
	                if (param.replace[j].from === value)
	                    value = param.replace[j].to;
	            }
	            if (value && param.array === true)
	                value = decodePathArray(value);
	            values[param.id] = param.value(value);
	        }
	        common_1.forEach(searchParams, function (param) {
	            values[param.id] = param.value(search[param.id]);
	        });
	        if (hash)
	            values["#"] = hash;
	        return values;
	    };
	    UrlMatcher.prototype.parameters = function (opts) {
	        if (opts === void 0) { opts = {}; }
	        if (opts.inherit === false)
	            return this._params;
	        return common_1.unnest(this._cache.path.concat(this).map(common_1.prop('_params')));
	    };
	    UrlMatcher.prototype.parameter = function (id, opts) {
	        if (opts === void 0) { opts = {}; }
	        var parent = common_1.tail(this._cache.path);
	        return (common_1.find(this._params, common_1.propEq('id', id)) ||
	            (opts.inherit !== false && parent && parent.parameter(id)) ||
	            null);
	    };
	    UrlMatcher.prototype.validates = function (params) {
	        var _this = this;
	        var validParamVal = function (param, val) { return !param || param.validates(val); };
	        return common_1.pairs(params || {}).map(function (_a) {
	            var key = _a[0], val = _a[1];
	            return validParamVal(_this.parameter(key), val);
	        }).reduce(common_1.allTrueR, true);
	    };
	    UrlMatcher.prototype.format = function (values) {
	        if (values === void 0) { values = {}; }
	        var segments = this._segments, result = segments[0], search = false, params = this.parameters({ inherit: false }), parent = common_1.tail(this._cache.path);
	        if (!this.validates(values))
	            return null;
	        function encodeDashes(str) {
	            return encodeURIComponent(str).replace(/-/g, function (c) { return ("%5C%" + c.charCodeAt(0).toString(16).toUpperCase()); });
	        }
	        params.map(function (param, i) {
	            var isPathParam = i < segments.length - 1;
	            var value = param.value(values[param.id]);
	            var isDefaultValue = param.isDefaultValue(value);
	            var squash = isDefaultValue ? param.squash : false;
	            var encoded = param.type.encode(value);
	            if (!isPathParam) {
	                if (encoded == null || (isDefaultValue && squash !== false))
	                    return;
	                if (!common_1.isArray(encoded))
	                    encoded = [encoded];
	                encoded = common_1.map(encoded, encodeURIComponent).join("&" + param.id + "=");
	                result += (search ? '&' : '?') + (param.id + "=" + encoded);
	                search = true;
	                return;
	            }
	            result += (function (segment, result) {
	                if (squash === true)
	                    return segment.match(result.match(/\/$/) ? /\/?(.*)/ : /(.*)/)[1];
	                if (common_1.isString(squash))
	                    return squash + segment;
	                if (squash !== false)
	                    return "";
	                if (encoded == null)
	                    return segment;
	                if (common_1.isArray(encoded))
	                    return common_1.map(encoded, encodeDashes).join("-") + segment;
	                if (param.type.raw)
	                    return encoded + segment;
	                return encodeURIComponent(encoded) + segment;
	            })(segments[i + 1], result);
	        });
	        if (values["#"])
	            result += "#" + values["#"];
	        var processedParams = ['#'].concat(params.map(common_1.prop('id')));
	        return (parent && parent.format(common_1.omit(values, processedParams)) || '') + result;
	    };
	    UrlMatcher.nameValidator = /^\w+(-+\w+)*(?:\[\])?$/;
	    return UrlMatcher;
	})();
	exports.UrlMatcher = UrlMatcher;
	//# sourceMappingURL=urlMatcher.js.map

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(24));
	__export(__webpack_require__(27));
	__export(__webpack_require__(37));
	__export(__webpack_require__(26));
	//# sourceMappingURL=module.js.map

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var StateParams = (function () {
	    function StateParams(params) {
	        if (params === void 0) { params = {}; }
	        common_1.extend(this, params);
	    }
	    StateParams.prototype.$digest = function () { };
	    StateParams.prototype.$inherit = function (newParams, $current, $to) { };
	    StateParams.prototype.$set = function (params, url) { };
	    StateParams.prototype.$sync = function () { };
	    StateParams.prototype.$off = function () { };
	    StateParams.prototype.$raw = function () { };
	    StateParams.prototype.$localize = function (state, params) { };
	    StateParams.prototype.$observe = function (key, fn) { };
	    return StateParams;
	})();
	exports.StateParams = StateParams;
	$StateParamsProvider.$inject = [];
	function $StateParamsProvider() {
	    function stateParamsFactory() {
	        var observers = {}, current = {};
	        function unhook(key, func) {
	            return function () {
	                common_1.forEach(key.split(" "), function (k) { return observers[k].splice(observers[k].indexOf(func), 1); });
	            };
	        }
	        function observeChange(key, val) {
	            if (!observers[key] || !observers[key].length)
	                return;
	            common_1.forEach(observers[key], function (func) { return func(val); });
	        }
	        StateParams.prototype.$digest = function () {
	            var _this = this;
	            common_1.forEach(this, function (val, key) {
	                if (val === current[key] || !_this.hasOwnProperty(key))
	                    return;
	                current[key] = val;
	                observeChange(key, val);
	            });
	        };
	        StateParams.prototype.$inherit = function (newParams, $current, $to) {
	            var parents = common_1.ancestors($current, $to), parentParams, inherited = {}, inheritList = [];
	            for (var i in parents) {
	                if (!parents[i].params)
	                    continue;
	                parentParams = Object.keys(parents[i].params);
	                if (!parentParams.length)
	                    continue;
	                for (var j in parentParams) {
	                    if (inheritList.indexOf(parentParams[j]) >= 0)
	                        continue;
	                    inheritList.push(parentParams[j]);
	                    inherited[parentParams[j]] = this[parentParams[j]];
	                }
	            }
	            return common_1.extend({}, inherited, newParams);
	        };
	        StateParams.prototype.$set = function (params, url) {
	            var _this = this;
	            var hasChanged = false, abort = false;
	            if (url) {
	                common_1.forEach(params, function (val, key) {
	                    if ((url.parameter(key) || {}).dynamic !== true)
	                        abort = true;
	                });
	            }
	            if (abort)
	                return false;
	            common_1.forEach(params, function (val, key) {
	                if (val !== _this[key]) {
	                    _this[key] = val;
	                    observeChange(key);
	                    hasChanged = true;
	                }
	            });
	            this.$sync();
	            return hasChanged;
	        };
	        StateParams.prototype.$sync = function () {
	            common_1.copy(this, current);
	            return this;
	        };
	        StateParams.prototype.$off = function () {
	            observers = {};
	            return this;
	        };
	        StateParams.prototype.$raw = function () {
	            return common_1.omit(this, Object.keys(this).filter(StateParams.prototype.hasOwnProperty.bind(StateParams.prototype)));
	        };
	        StateParams.prototype.$localize = function (state, params) {
	            return new StateParams(common_1.pick(params || this, Object.keys(state.params)));
	        };
	        StateParams.prototype.$observe = function (key, fn) {
	            common_1.forEach(key.split(" "), function (k) { return (observers[k] || (observers[k] = [])).push(fn); });
	            return unhook(key, fn);
	        };
	        return new StateParams();
	    }
	    var global = stateParamsFactory();
	    this.$get = $get;
	    $get.$inject = ['$rootScope'];
	    function $get($rootScope) {
	        $rootScope.$watch(function () {
	            global.$digest();
	        });
	        return global;
	    }
	}
	angular.module('ui.router.state')
	    .provider('$stateParams', $StateParamsProvider);
	//# sourceMappingURL=stateParams.js.map

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var coreservices_1 = __webpack_require__(4);
	var $location = coreservices_1.services.location;
	function $UrlRouterProvider($urlMatcherFactory) {
	    var rules = [], otherwise = null, interceptDeferred = false, listener;
	    function regExpPrefix(re) {
	        var prefix = /^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(re.source);
	        return (prefix != null) ? prefix[1].replace(/\\(.)/g, "$1") : '';
	    }
	    function interpolate(pattern, match) {
	        return pattern.replace(/\$(\$|\d{1,2})/, function (m, what) {
	            return match[what === '$' ? 0 : Number(what)];
	        });
	    }
	    this.rule = function (rule) {
	        if (!common_1.isFunction(rule))
	            throw new Error("'rule' must be a function");
	        rules.push(rule);
	        return this;
	    };
	    this.otherwise = function (rule) {
	        if (!common_1.isFunction(rule) && !common_1.isString(rule))
	            throw new Error("'rule' must be a string or function");
	        otherwise = common_1.isString(rule) ? function () { return rule; } : rule;
	        return this;
	    };
	    function handleIfMatch($injector, handler, match) {
	        if (!match)
	            return false;
	        var result = $injector.invoke(handler, handler, { $match: match });
	        return common_1.isDefined(result) ? result : true;
	    }
	    this.when = function (what, handler) {
	        var redirect, handlerIsString = common_1.isString(handler);
	        if (common_1.isString(what))
	            what = $urlMatcherFactory.compile(what);
	        if (!handlerIsString && !common_1.isFunction(handler) && !common_1.isArray(handler))
	            throw new Error("invalid 'handler' in when()");
	        var strategies = {
	            matcher: function (what, handler) {
	                if (handlerIsString) {
	                    redirect = $urlMatcherFactory.compile(handler);
	                    handler = ['$match', redirect.format.bind(redirect)];
	                }
	                return common_1.extend(function () {
	                    return handleIfMatch(coreservices_1.services.$injector, handler, what.exec($location.path(), $location.search(), $location.hash()));
	                }, {
	                    prefix: common_1.isString(what.prefix) ? what.prefix : ''
	                });
	            },
	            regex: function (what, handler) {
	                if (what.global || what.sticky)
	                    throw new Error("when() RegExp must not be global or sticky");
	                if (handlerIsString) {
	                    redirect = handler;
	                    handler = ['$match', function ($match) { return interpolate(redirect, $match); }];
	                }
	                return common_1.extend(function () {
	                    return handleIfMatch(coreservices_1.services.$injector, handler, what.exec($location.path()));
	                }, {
	                    prefix: regExpPrefix(what)
	                });
	            }
	        };
	        var check = {
	            matcher: $urlMatcherFactory.isMatcher(what),
	            regex: what instanceof RegExp
	        };
	        for (var n in check) {
	            if (check[n])
	                return this.rule(strategies[n](what, handler));
	        }
	        throw new Error("invalid 'what' in when()");
	    };
	    this.deferIntercept = function (defer) {
	        if (defer === undefined)
	            defer = true;
	        interceptDeferred = defer;
	    };
	    this.$get = $get;
	    $get.$inject = ['$rootScope'];
	    function $get($rootScope) {
	        var location = $location.url();
	        function appendBasePath(url, isHtml5, absolute) {
	            var baseHref = coreservices_1.services.locationConfig.baseHref();
	            if (baseHref === '/')
	                return url;
	            if (isHtml5)
	                return baseHref.slice(0, -1) + url;
	            if (absolute)
	                return baseHref.slice(1) + url;
	            return url;
	        }
	        function update(evt) {
	            if (evt && evt.defaultPrevented)
	                return;
	            function check(rule) {
	                var handled = rule(coreservices_1.services.$injector, $location);
	                if (!handled)
	                    return false;
	                if (common_1.isString(handled)) {
	                    $location.replace();
	                    $location.url(handled);
	                }
	                return true;
	            }
	            var n = rules.length, i;
	            for (i = 0; i < n; i++) {
	                if (check(rules[i]))
	                    return;
	            }
	            if (otherwise)
	                check(otherwise);
	        }
	        function listen() {
	            listener = listener || $rootScope.$on('$locationChangeSuccess', update);
	            return listener;
	        }
	        if (!interceptDeferred)
	            listen();
	        return {
	            sync: function () {
	                update();
	            },
	            listen: function () {
	                return listen();
	            },
	            update: function (read) {
	                if (read) {
	                    location = $location.url();
	                    return;
	                }
	                if ($location.url() === location)
	                    return;
	                $location.url(location);
	                $location.replace();
	            },
	            push: function (urlMatcher, params, options) {
	                $location.url(urlMatcher.format(params || {}));
	                if (options && options.replace)
	                    $location.replace();
	            },
	            href: function (urlMatcher, params, options) {
	                if (!urlMatcher.validates(params))
	                    return null;
	                var url = urlMatcher.format(params);
	                options = options || {};
	                var cfg = coreservices_1.services.locationConfig;
	                var isHtml5 = cfg.html5Mode();
	                if (!isHtml5 && url !== null) {
	                    url = "#" + cfg.hashPrefix() + url;
	                }
	                url = appendBasePath(url, isHtml5, options.absolute);
	                if (!options.absolute || !url) {
	                    return url;
	                }
	                var slash = (!isHtml5 && url ? '/' : ''), port = cfg.port();
	                port = (port === 80 || port === 443 ? '' : ':' + port);
	                return [cfg.protocol(), '://', cfg.host(), port, slash, url].join('');
	            }
	        };
	    }
	}
	exports.$UrlRouterProvider = $UrlRouterProvider;
	//# sourceMappingURL=urlRouter.js.map

/***/ },
/* 39 */
/***/ function(module, exports) {

	var EnterExitHooks = (function () {
	    function EnterExitHooks(transition) {
	        this.transition = transition;
	    }
	    EnterExitHooks.prototype.registerHooks = function () {
	        this.registerOnEnterHooks();
	        this.registerOnRetainHooks();
	        this.registerOnExitHooks();
	    };
	    EnterExitHooks.prototype.registerOnEnterHooks = function () {
	        var _this = this;
	        var onEnterRegistration = function (state) { return _this.transition.onEnter({ to: state.name }, state.onEnter); };
	        this.transition.entering().filter(function (state) { return !!state.onEnter; }).forEach(onEnterRegistration);
	    };
	    EnterExitHooks.prototype.registerOnRetainHooks = function () {
	        var _this = this;
	        var onRetainRegistration = function (state) { return _this.transition.onRetain({}, state.onRetain); };
	        this.transition.retained().filter(function (state) { return !!state.onRetain; }).forEach(onRetainRegistration);
	    };
	    EnterExitHooks.prototype.registerOnExitHooks = function () {
	        var _this = this;
	        var onExitRegistration = function (state) { return _this.transition.onExit({ from: state.name }, state.onExit); };
	        this.transition.exiting().filter(function (state) { return !!state.onExit; }).forEach(onExitRegistration);
	    };
	    return EnterExitHooks;
	})();
	exports.EnterExitHooks = EnterExitHooks;
	//# sourceMappingURL=enterExitHooks.js.map

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var interface_1 = __webpack_require__(19);
	var LAZY = interface_1.ResolvePolicy[interface_1.ResolvePolicy.LAZY];
	var EAGER = interface_1.ResolvePolicy[interface_1.ResolvePolicy.EAGER];
	var ResolveHooks = (function () {
	    function ResolveHooks(transition) {
	        this.transition = transition;
	    }
	    ResolveHooks.prototype.registerHooks = function () {
	        var treeChanges = this.transition.treeChanges();
	        $eagerResolvePath.$inject = ['$transition$'];
	        function $eagerResolvePath($transition$) {
	            return common_1.tail(treeChanges.to).resolveContext.resolvePath(common_1.extend({ transition: $transition$ }, { resolvePolicy: EAGER }));
	        }
	        $lazyResolveEnteringState.$inject = ['$state$', '$transition$'];
	        function $lazyResolveEnteringState($state$, $transition$) {
	            var node = common_1.find(treeChanges.entering, common_1.propEq('state', $state$));
	            return node.resolveContext.resolvePathElement(node.state, common_1.extend({ transition: $transition$ }, { resolvePolicy: LAZY }));
	        }
	        this.transition.onStart({}, $eagerResolvePath, { priority: 1000 });
	        this.transition.onEnter({}, $lazyResolveEnteringState, { priority: 1000 });
	    };
	    return ResolveHooks;
	})();
	exports.ResolveHooks = ResolveHooks;
	//# sourceMappingURL=resolveHooks.js.map

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(36);
	var parseUrl = function (url) {
	    if (!common_1.isString(url))
	        return false;
	    var root = url.charAt(0) === '^';
	    return { val: root ? url.substring(1) : url, root: root };
	};
	var StateBuilder = (function () {
	    function StateBuilder(root, matcher, $urlMatcherFactoryProvider) {
	        this.matcher = matcher;
	        var self = this;
	        this.builders = {
	            parent: [function (state) {
	                    if (state === root())
	                        return null;
	                    return matcher.find(self.parentName(state)) || root();
	                }],
	            data: [function (state) {
	                    if (state.parent && state.parent.data) {
	                        state.data = state.self.data = common_1.extend({}, state.parent.data, state.data);
	                    }
	                    return state.data;
	                }],
	            url: [function (state) {
	                    var stateDec = state;
	                    var parsed = parseUrl(stateDec.url), parent = state.parent;
	                    var url = !parsed ? stateDec.url : $urlMatcherFactoryProvider.compile(parsed.val, {
	                        params: state.params || {},
	                        paramMap: function (paramConfig, isSearch) {
	                            if (stateDec.reloadOnSearch === false && isSearch)
	                                paramConfig = common_1.extend(paramConfig || {}, { dynamic: true });
	                            return paramConfig;
	                        }
	                    });
	                    if (!url)
	                        return null;
	                    if (!$urlMatcherFactoryProvider.isMatcher(url))
	                        throw new Error("Invalid url '" + url + "' in state '" + state + "'");
	                    return (parsed && parsed.root) ? url : ((parent && parent.navigable) || root()).url.append(url);
	                }],
	            navigable: [function (state) {
	                    return (state !== root()) && state.url ? state : (state.parent ? state.parent.navigable : null);
	                }],
	            params: [function (state) {
	                    var makeConfigParam = function (config, id) { return module_1.Param.fromConfig(id, null, config); };
	                    var urlParams = (state.url && state.url.parameters({ inherit: false })) || [];
	                    var nonUrlParams = common_1.values(common_1.map(common_1.omit(state.params || {}, urlParams.map(common_1.prop('id'))), makeConfigParam));
	                    return urlParams.concat(nonUrlParams).map(function (p) { return [p.id, p]; }).reduce(common_1.applyPairs, {});
	                }],
	            views: [function (state) {
	                    var views = {}, tplKeys = ['templateProvider', 'templateUrl', 'template', 'notify', 'async'], ctrlKeys = ['controller', 'controllerProvider', 'controllerAs'];
	                    var allKeys = tplKeys.concat(ctrlKeys);
	                    common_1.forEach(state.views || { "$default": common_1.pick(state, allKeys) }, function (config, name) {
	                        name = name || "$default";
	                        common_1.forEach(ctrlKeys, function (key) {
	                            if (state[key] && !config[key])
	                                config[key] = state[key];
	                        });
	                        if (Object.keys(config).length > 0)
	                            views[name] = config;
	                    });
	                    return views;
	                }],
	            path: [function (state) {
	                    return state.parent ? state.parent.path.concat(state) : [state];
	                }],
	            includes: [function (state) {
	                    var includes = state.parent ? common_1.extend({}, state.parent.includes) : {};
	                    includes[state.name] = true;
	                    return includes;
	                }]
	        };
	    }
	    StateBuilder.prototype.builder = function (name, fn) {
	        var builders = this.builders;
	        var array = builders[name] || [];
	        if (common_1.isString(name) && !common_1.isDefined(fn))
	            return array.length > 1 ? array : array[0];
	        if (!common_1.isString(name) || !common_1.isFunction(fn))
	            return;
	        builders[name] = array;
	        builders[name].push(fn);
	        return function () { return builders[name].splice(builders[name].indexOf(fn, 1)) && null; };
	    };
	    StateBuilder.prototype.build = function (state) {
	        var _a = this, matcher = _a.matcher, builders = _a.builders;
	        var parent = this.parentName(state);
	        if (parent && !matcher.find(parent))
	            return null;
	        for (var key in builders) {
	            if (!builders.hasOwnProperty(key))
	                continue;
	            var chain = builders[key].reduce(function (parentFn, step) { return function (state) { return step(state, parentFn); }; }, common_1.noop);
	            state[key] = chain(state);
	        }
	        return state;
	    };
	    StateBuilder.prototype.parentName = function (state) {
	        var name = state.name || "";
	        if (name.indexOf('.') !== -1)
	            return name.substring(0, name.lastIndexOf('.'));
	        if (!state.parent)
	            return "";
	        return common_1.isString(state.parent) ? state.parent : state.parent.name;
	    };
	    StateBuilder.prototype.name = function (state) {
	        var name = state.name;
	        if (name.indexOf('.') !== -1 || !state.parent)
	            return name;
	        var parentName = common_1.isString(state.parent) ? state.parent : state.parent.name;
	        return parentName ? parentName + "." + name : name;
	    };
	    return StateBuilder;
	})();
	exports.StateBuilder = StateBuilder;
	//# sourceMappingURL=stateBuilder.js.map

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(9);
	function parseStateRef(ref, current) {
	    var preparsed = ref.match(/^\s*({[^}]*})\s*$/), parsed;
	    if (preparsed)
	        ref = current + '(' + preparsed[1] + ')';
	    parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\((.*)\))?$/);
	    if (!parsed || parsed.length !== 4)
	        throw new Error("Invalid state ref '" + ref + "'");
	    return { state: parsed[1], paramExpr: parsed[3] || null };
	}
	function stateContext(el) {
	    var stateData = el.parent().inheritedData('$uiView');
	    if (stateData && stateData.context && stateData.context.name) {
	        return stateData.context;
	    }
	}
	$StateRefDirective.$inject = ['$state', '$timeout'];
	function $StateRefDirective($state, $timeout) {
	    return {
	        restrict: 'A',
	        require: ['?^uiSrefActive', '?^uiSrefActiveEq'],
	        link: function (scope, element, attrs, uiSrefActive) {
	            var ref = parseStateRef(attrs.uiSref, $state.current.name);
	            var params = null, base = stateContext(element) || $state.$current;
	            var newHref = null, isAnchor = element.prop("tagName") === "A";
	            var isForm = element[0].nodeName === "FORM";
	            var attr = isForm ? "action" : "href", nav = true;
	            var srefOpts = scope.$eval(attrs.uiSrefOpts);
	            var defaultSrefOpts = { relative: base, inherit: true };
	            var options = common_1.defaults(srefOpts, defaultSrefOpts, module_1.defaultTransOpts);
	            var update = function (newVal) {
	                if (newVal)
	                    params = common_1.copy(newVal);
	                if (!nav)
	                    return;
	                newHref = $state.href(ref.state, params, options);
	                var activeDirective = uiSrefActive[1] || uiSrefActive[0];
	                if (activeDirective) {
	                    activeDirective.$$addStateInfo(ref.state, params);
	                }
	                if (newHref === null) {
	                    nav = false;
	                    return false;
	                }
	                attrs.$set(attr, newHref);
	            };
	            if (ref.paramExpr) {
	                scope.$watch(ref.paramExpr, function (newVal) { if (newVal !== params)
	                    update(newVal); }, true);
	                params = common_1.copy(scope.$eval(ref.paramExpr));
	            }
	            update();
	            if (isForm)
	                return;
	            element.bind("click", function (e) {
	                var button = e.which || e.button;
	                if (!(button > 1 || e.ctrlKey || e.metaKey || e.shiftKey || element.attr('target'))) {
	                    var transition = $timeout(function () {
	                        $state.go(ref.state, params, options);
	                    });
	                    e.preventDefault();
	                    var ignorePreventDefaultCount = isAnchor && !newHref ? 1 : 0;
	                    e.preventDefault = function () {
	                        if (ignorePreventDefaultCount-- <= 0)
	                            $timeout.cancel(transition);
	                    };
	                }
	            });
	        }
	    };
	}
	$StateRefActiveDirective.$inject = ['$state', '$stateParams', '$interpolate'];
	function $StateRefActiveDirective($state, $stateParams, $interpolate) {
	    return {
	        restrict: "A",
	        controller: ['$scope', '$element', '$attrs', '$timeout', '$transitions', function ($scope, $element, $attrs, $timeout, $transitions) {
	                var states = [], activeClasses = {}, activeEqClass;
	                activeEqClass = $interpolate($attrs.uiSrefActiveEq || '', false)($scope);
	                var uiSrefActive = $scope.$eval($attrs.uiSrefActive) || $interpolate($attrs.uiSrefActive || '', false)($scope);
	                if (common_1.isObject(uiSrefActive)) {
	                    common_1.forEach(uiSrefActive, function (stateOrName, activeClass) {
	                        if (common_1.isString(stateOrName)) {
	                            var ref = parseStateRef(stateOrName, $state.current.name);
	                            addState(ref.state, $scope.$eval(ref.paramExpr), activeClass);
	                        }
	                    });
	                }
	                this.$$addStateInfo = function (newState, newParams) {
	                    if (common_1.isObject(uiSrefActive) && states.length > 0) {
	                        return;
	                    }
	                    addState(newState, newParams, uiSrefActive);
	                    update();
	                };
	                $scope.$on('$stateChangeSuccess', update);
	                function addState(stateName, stateParams, activeClass) {
	                    var state = $state.get(stateName, stateContext($element));
	                    var stateHash = createStateHash(stateName, stateParams);
	                    states.push({
	                        state: state || { name: stateName },
	                        params: stateParams,
	                        hash: stateHash
	                    });
	                    activeClasses[stateHash] = activeClass;
	                }
	                updateAfterTransition.$inject = ['$transition$'];
	                function updateAfterTransition($transition$) { $transition$.promise.then(update); }
	                ;
	                var deregisterFn = $transitions.onStart({}, updateAfterTransition);
	                $scope.$on('$destroy', deregisterFn);
	                function createStateHash(state, params) {
	                    if (!common_1.isString(state)) {
	                        throw new Error('state should be a string');
	                    }
	                    if (common_1.isObject(params)) {
	                        return state + common_1.toJson(params);
	                    }
	                    params = $scope.$eval(params);
	                    if (common_1.isObject(params)) {
	                        return state + common_1.toJson(params);
	                    }
	                    return state;
	                }
	                function update() {
	                    for (var i = 0; i < states.length; i++) {
	                        if (anyMatch(states[i].state, states[i].params)) {
	                            addClass($element, activeClasses[states[i].hash]);
	                        }
	                        else {
	                            removeClass($element, activeClasses[states[i].hash]);
	                        }
	                        if (exactMatch(states[i].state, states[i].params)) {
	                            addClass($element, activeEqClass);
	                        }
	                        else {
	                            removeClass($element, activeEqClass);
	                        }
	                    }
	                }
	                function addClass(el, className) { $timeout(function () { el.addClass(className); }); }
	                function removeClass(el, className) { el.removeClass(className); }
	                function anyMatch(state, params) { return $state.includes(state.name, params); }
	                function exactMatch(state, params) { return $state.is(state.name, params); }
	            }]
	    };
	}
	angular.module('ui.router.state')
	    .directive('uiSref', $StateRefDirective)
	    .directive('uiSrefActive', $StateRefActiveDirective)
	    .directive('uiSrefActiveEq', $StateRefActiveDirective);
	//# sourceMappingURL=stateDirectives.js.map

/***/ },
/* 43 */
/***/ function(module, exports) {

	$IsStateFilter.$inject = ['$state'];
	function $IsStateFilter($state) {
	    return function (state) {
	        return $state.is(state);
	    };
	}
	exports.$IsStateFilter = $IsStateFilter;
	$IncludedByStateFilter.$inject = ['$state'];
	function $IncludedByStateFilter($state) {
	    return function (state, params, options) {
	        return $state.includes(state, params, options);
	    };
	}
	exports.$IncludedByStateFilter = $IncludedByStateFilter;
	angular.module('ui.router.state')
	    .filter('isState', $IsStateFilter)
	    .filter('includedByState', $IncludedByStateFilter);
	//# sourceMappingURL=stateFilters.js.map

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var module_1 = __webpack_require__(2);
	var State = (function () {
	    function State(config) {
	        module_1.extend(this, config);
	    }
	    State.prototype.is = function (ref) {
	        return this === ref || this.self === ref || this.fqn() === ref;
	    };
	    State.prototype.fqn = function () {
	        if (!this.parent || !(this.parent instanceof this.constructor))
	            return this.name;
	        var name = this.parent.fqn();
	        return name ? name + "." + this.name : this.name;
	    };
	    State.prototype.root = function () {
	        return this.parent && this.parent.root() || this;
	    };
	    State.prototype.parameters = function (opts) {
	        opts = module_1.defaults(opts, { inherit: true });
	        var inherited = opts.inherit && this.parent && this.parent.parameters() || [];
	        return inherited.concat(module_1.values(this.params));
	    };
	    State.prototype.parameter = function (id, opts) {
	        if (opts === void 0) { opts = {}; }
	        return (this.url && this.url.parameter(id, opts) ||
	            module_1.find(module_1.values(this.params), module_1.propEq('id', id)) ||
	            opts.inherit && this.parent && this.parent.parameter(id));
	    };
	    State.prototype.toString = function () {
	        return this.fqn();
	    };
	    return State;
	})();
	exports.State = State;
	//# sourceMappingURL=stateObject.js.map

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var StateMatcher = (function () {
	    function StateMatcher(_states) {
	        this._states = _states;
	    }
	    StateMatcher.prototype.isRelative = function (stateName) {
	        stateName = stateName || "";
	        return stateName.indexOf(".") === 0 || stateName.indexOf("^") === 0;
	    };
	    StateMatcher.prototype.find = function (stateOrName, base) {
	        if (!stateOrName && stateOrName !== "")
	            return undefined;
	        var isStr = common_1.isString(stateOrName);
	        var name = isStr ? stateOrName : stateOrName.name;
	        if (this.isRelative(name))
	            name = this.resolvePath(name, base);
	        var state = this._states[name];
	        if (state && (isStr || (!isStr && (state === stateOrName || state.self === stateOrName)))) {
	            return state;
	        }
	        return undefined;
	    };
	    StateMatcher.prototype.resolvePath = function (name, base) {
	        if (!base)
	            throw new Error("No reference point given for path '" + name + "'");
	        var baseState = this.find(base);
	        var splitName = name.split("."), i = 0, pathLength = splitName.length, current = baseState;
	        for (; i < pathLength; i++) {
	            if (splitName[i] === "" && i === 0) {
	                current = baseState;
	                continue;
	            }
	            if (splitName[i] === "^") {
	                if (!current.parent)
	                    throw new Error("Path '" + name + "' not valid for state '" + baseState.name + "'");
	                current = current.parent;
	                continue;
	            }
	            break;
	        }
	        var relName = splitName.slice(i).join(".");
	        return current.name + (current.name && relName ? "." : "") + relName;
	    };
	    return StateMatcher;
	})();
	exports.StateMatcher = StateMatcher;
	//# sourceMappingURL=stateMatcher.js.map

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var module_1 = __webpack_require__(12);
	var StateQueueManager = (function () {
	    function StateQueueManager(states, builder, $urlRouterProvider, $state) {
	        this.states = states;
	        this.builder = builder;
	        this.$urlRouterProvider = $urlRouterProvider;
	        this.$state = $state;
	        this.autoFlush = false;
	        this.queue = [];
	    }
	    StateQueueManager.prototype.register = function (config, pre) {
	        var _a = this, states = _a.states, queue = _a.queue, $state = _a.$state;
	        var state = common_1.inherit(new module_1.State(), common_1.extend({}, config, {
	            self: config,
	            resolve: config.resolve || {},
	            toString: function () { return config.name; }
	        }));
	        if (!common_1.isString(state.name))
	            throw new Error("State must have a valid name");
	        if (states.hasOwnProperty(state.name) || common_1.pluck(queue, 'name').indexOf(state.name) !== -1)
	            throw new Error("State '" + state.name + "' is already defined");
	        queue[pre ? "unshift" : "push"](state);
	        if (this.autoFlush) {
	            this.flush($state);
	        }
	        return state;
	    };
	    StateQueueManager.prototype.flush = function ($state) {
	        var _a = this, queue = _a.queue, states = _a.states, builder = _a.builder;
	        var result, state, orphans = [], orphanIdx, previousQueueLength = {};
	        while (queue.length > 0) {
	            state = queue.shift();
	            result = builder.build(state);
	            orphanIdx = orphans.indexOf(state);
	            if (result) {
	                if (states.hasOwnProperty(state.name))
	                    throw new Error("State '" + name + "' is already defined");
	                states[state.name] = state;
	                this.attachRoute($state, state);
	                if (orphanIdx >= 0)
	                    orphans.splice(orphanIdx, 1);
	                continue;
	            }
	            var prev = previousQueueLength[state.name];
	            previousQueueLength[state.name] = queue.length;
	            if (orphanIdx >= 0 && prev === queue.length) {
	                throw new Error("Cannot register orphaned state '" + state.name + "'");
	            }
	            else if (orphanIdx < 0) {
	                orphans.push(state);
	            }
	            queue.push(state);
	        }
	        return states;
	    };
	    StateQueueManager.prototype.attachRoute = function ($state, state) {
	        var $urlRouterProvider = this.$urlRouterProvider;
	        if (state[common_1.abstractKey] || !state.url)
	            return;
	        $urlRouterProvider.when(state.url, ['$match', '$stateParams', function ($match, $stateParams) {
	                if ($state.$current.navigable !== state || !common_1.equalForKeys($match, $stateParams)) {
	                    $state.transitionTo(state, $match, { inherit: true, location: false });
	                }
	            }]);
	    };
	    return StateQueueManager;
	})();
	exports.StateQueueManager = StateQueueManager;
	//# sourceMappingURL=stateQueueManager.js.map

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var trace_1 = __webpack_require__(6);
	var coreservices_1 = __webpack_require__(4);
	var rejectFactory_1 = __webpack_require__(28);
	var module_1 = __webpack_require__(12);
	var REJECT = new rejectFactory_1.RejectFactory();
	var defaultOptions = {
	    async: true,
	    rejectIfSuperseded: true,
	    current: common_1.noop,
	    transition: null,
	    traceData: {}
	};
	var TransitionHook = (function () {
	    function TransitionHook(fn, locals, resolveContext, options) {
	        var _this = this;
	        this.fn = fn;
	        this.locals = locals;
	        this.resolveContext = resolveContext;
	        this.options = options;
	        this.isSuperseded = function () { return _this.options.current() !== _this.options.transition; };
	        this.mapHookResult = common_1.pattern([
	            [this.isSuperseded, function () { return REJECT.superseded(_this.options.current()); }],
	            [common_1.eq(false), common_1.val(REJECT.aborted("Hook aborted transition"))],
	            [common_1.is(module_1.TargetState), function (target) { return REJECT.redirected(target); }],
	            [common_1.isPromise, function (promise) { return promise.then(_this.handleHookResult.bind(_this)); }]
	        ]);
	        this.invokeStep = function (moreLocals) {
	            var _a = _this, options = _a.options, fn = _a.fn, resolveContext = _a.resolveContext;
	            var locals = common_1.extend({}, _this.locals, moreLocals);
	            trace_1.trace.traceHookInvocation(_this, options);
	            if (options.rejectIfSuperseded && _this.isSuperseded()) {
	                return REJECT.superseded(options.current());
	            }
	            if (!options.async) {
	                var hookResult = resolveContext.invokeNow(fn, locals, options);
	                return _this.handleHookResult(hookResult);
	            }
	            return resolveContext.invokeLater(fn, locals, options).then(_this.handleHookResult.bind(_this));
	        };
	        this.options = common_1.defaults(options, defaultOptions);
	    }
	    TransitionHook.prototype.handleHookResult = function (hookResult) {
	        if (!common_1.isDefined(hookResult))
	            return undefined;
	        trace_1.trace.traceHookResult(hookResult, undefined, this.options);
	        var transitionResult = this.mapHookResult(hookResult);
	        if (transitionResult)
	            trace_1.trace.traceHookResult(hookResult, transitionResult, this.options);
	        return transitionResult;
	    };
	    TransitionHook.prototype.toString = function () {
	        var _a = this, options = _a.options, fn = _a.fn;
	        var event = common_1.parse("traceData.hookType")(options) || "internal", context = common_1.parse("traceData.context.state.name")(options) || common_1.parse("traceData.context")(options) || "unknown", name = common_1.fnToString(fn);
	        return event + " context: " + context + ", " + common_1.maxLength(200, name);
	    };
	    TransitionHook.runSynchronousHooks = function (hooks, locals, swallowExceptions) {
	        if (locals === void 0) { locals = {}; }
	        if (swallowExceptions === void 0) { swallowExceptions = false; }
	        var results = [];
	        for (var i = 0; i < hooks.length; i++) {
	            try {
	                results.push(hooks[i].invokeStep(locals));
	            }
	            catch (exception) {
	                if (!swallowExceptions)
	                    throw exception;
	                console.log("Swallowed exception during synchronous hook handler: " + exception);
	            }
	        }
	        var rejections = results.filter(TransitionHook.isRejection);
	        if (rejections.length)
	            return rejections[0];
	        return results
	            .filter(common_1.not(TransitionHook.isRejection))
	            .filter(common_1.isPromise)
	            .reduce(function (chain, promise) { return chain.then(common_1.val(promise)); }, coreservices_1.services.$q.when());
	    };
	    TransitionHook.isRejection = function (hookResult) {
	        return hookResult && hookResult.reason instanceof rejectFactory_1.TransitionRejection && hookResult;
	    };
	    return TransitionHook;
	})();
	exports.TransitionHook = TransitionHook;
	//# sourceMappingURL=transitionHook.js.map

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var transition_1 = __webpack_require__(8);
	var hookRegistry_1 = __webpack_require__(11);
	exports.defaultTransOpts = {
	    location: true,
	    relative: null,
	    inherit: false,
	    notify: true,
	    reload: false,
	    custom: {},
	    current: function () { return null; }
	};
	var TransitionService = (function () {
	    function TransitionService() {
	        this._defaultErrorHandler = function $defaultErrorHandler($error$) {
	            if ($error$ instanceof Error)
	                console.log($error$);
	        };
	        this._reinit();
	    }
	    TransitionService.prototype.defaultErrorHandler = function (handler) {
	        return this._defaultErrorHandler = handler || this._defaultErrorHandler;
	    };
	    TransitionService.prototype._reinit = function () {
	        hookRegistry_1.HookRegistry.mixin(new hookRegistry_1.HookRegistry(), this);
	    };
	    TransitionService.prototype.create = function (fromPath, targetState) {
	        return new transition_1.Transition(fromPath, targetState);
	    };
	    return TransitionService;
	})();
	exports.$transitions = new TransitionService();
	$TransitionProvider.prototype = exports.$transitions;
	function $TransitionProvider() {
	    this._reinit.bind(exports.$transitions)();
	    this.$get = function $get() {
	        return exports.$transitions;
	    };
	}
	exports.$transitionsProvider = $TransitionProvider;
	angular.module('ui.router.state')
	    .provider('$transitions', exports.$transitionsProvider);
	//# sourceMappingURL=transitionService.js.map

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(50));
	__export(__webpack_require__(21));
	__export(__webpack_require__(51));
	__export(__webpack_require__(52));
	//# sourceMappingURL=module.js.map

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	$TemplateFactory.$inject = ['$http', '$templateCache'];
	function $TemplateFactory($http, $templateCache) {
	    this.fromConfig = function (config, params, injectFn) {
	        return (common_1.isDefined(config.template) ? this.fromString(config.template, params) :
	            common_1.isDefined(config.templateUrl) ? this.fromUrl(config.templateUrl, params) :
	                common_1.isDefined(config.templateProvider) ? this.fromProvider(config.templateProvider, params, injectFn) :
	                    null);
	    };
	    this.fromString = function (template, params) {
	        return common_1.isFunction(template) ? template(params) : template;
	    };
	    this.fromUrl = function (url, params) {
	        if (common_1.isFunction(url))
	            url = url(params);
	        if (url == null)
	            return null;
	        return $http.get(url, { cache: $templateCache, headers: { Accept: 'text/html' } }).then(common_1.prop("data"));
	    };
	    this.fromProvider = function (provider, params, injectFn) {
	        return injectFn(provider);
	    };
	}
	angular.module('ui.router.util').service('$templateFactory', $TemplateFactory);
	//# sourceMappingURL=templateFactory.js.map

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(3);
	var trace_1 = __webpack_require__(6);
	$ViewDirective.$inject = ['$view', '$animate', '$uiViewScroll', '$interpolate', '$q'];
	function $ViewDirective($view, $animate, $uiViewScroll, $interpolate, $q) {
	    function getRenderer(attrs, scope) {
	        return {
	            enter: function (element, target, cb) {
	                if (angular.version.minor > 2) {
	                    $animate.enter(element, null, target).then(cb);
	                }
	                else {
	                    $animate.enter(element, null, target, cb);
	                }
	            },
	            leave: function (element, cb) {
	                if (angular.version.minor > 2) {
	                    $animate.leave(element).then(cb);
	                }
	                else {
	                    $animate.leave(element, cb);
	                }
	            }
	        };
	    }
	    function configsEqual(config1, config2) {
	        return config1 === config2;
	    }
	    var rootData = {
	        context: $view.rootContext()
	    };
	    var directive = {
	        count: 0,
	        restrict: 'ECA',
	        terminal: true,
	        priority: 400,
	        transclude: 'element',
	        compile: function (tElement, tAttrs, $transclude) {
	            return function (scope, $element, attrs) {
	                var previousEl, currentEl, currentScope, unregister, onloadExp = attrs.onload || '', autoScrollExp = attrs.autoscroll, renderer = getRenderer(attrs, scope), viewConfig = undefined, inherited = $element.inheritedData('$uiView') || rootData, name = $interpolate(attrs.uiView || attrs.name || '')(scope) || '$default';
	                var viewData = {
	                    id: directive.count++,
	                    name: name,
	                    fqn: inherited.name ? inherited.fqn + "." + name : name,
	                    config: null,
	                    configUpdated: configUpdatedCallback,
	                    get creationContext() { return inherited.context; }
	                };
	                trace_1.trace.traceUiViewEvent("Linking", viewData);
	                function configUpdatedCallback(config) {
	                    if (configsEqual(viewConfig, config))
	                        return;
	                    trace_1.trace.traceUiViewConfigUpdated(viewData, config && config.context);
	                    viewConfig = config;
	                    updateView(config);
	                }
	                $element.data('$uiView', viewData);
	                updateView();
	                unregister = $view.registerUiView(viewData);
	                scope.$on("$destroy", function () {
	                    trace_1.trace.traceUiViewEvent("Destroying/Unregistering", viewData);
	                    unregister();
	                });
	                function cleanupLastView() {
	                    if (previousEl) {
	                        trace_1.trace.traceUiViewEvent("Removing    (previous) el", viewData);
	                        previousEl.remove();
	                        previousEl = null;
	                    }
	                    if (currentScope) {
	                        trace_1.trace.traceUiViewEvent("Destroying  (previous) scope", viewData);
	                        currentScope.$destroy();
	                        currentScope = null;
	                    }
	                    if (currentEl) {
	                        trace_1.trace.traceUiViewEvent("Animate out (previous)", viewData);
	                        renderer.leave(currentEl, function () {
	                            previousEl = null;
	                        });
	                        previousEl = currentEl;
	                        currentEl = null;
	                    }
	                }
	                function updateView(config) {
	                    config = config || {};
	                    var newScope = scope.$new();
	                    trace_1.trace.traceUiViewScopeCreated(viewData, newScope);
	                    common_1.extend(viewData, {
	                        context: config.context,
	                        $template: config.template,
	                        $controller: config.controller,
	                        $controllerAs: config.controllerAs,
	                        $locals: config.locals
	                    });
	                    var cloned = $transclude(newScope, function (clone) {
	                        renderer.enter(clone.data('$uiView', viewData), $element, function onUiViewEnter() {
	                            if (currentScope) {
	                                currentScope.$emit('$viewContentAnimationEnded');
	                            }
	                            if (common_1.isDefined(autoScrollExp) && !autoScrollExp || scope.$eval(autoScrollExp)) {
	                                $uiViewScroll(clone);
	                            }
	                        });
	                        cleanupLastView();
	                    });
	                    currentEl = cloned;
	                    currentScope = newScope;
	                    currentScope.$emit('$viewContentLoaded', config || viewConfig);
	                    currentScope.$eval(onloadExp);
	                }
	            };
	        }
	    };
	    return directive;
	}
	$ViewDirectiveFill.$inject = ['$compile', '$controller', '$interpolate', '$injector', '$q'];
	function $ViewDirectiveFill($compile, $controller, $interpolate, $injector, $q) {
	    return {
	        restrict: 'ECA',
	        priority: -400,
	        compile: function (tElement) {
	            var initial = tElement.html();
	            return function (scope, $element) {
	                var data = $element.data('$uiView');
	                if (!data)
	                    return;
	                $element.html(data.$template || initial);
	                trace_1.trace.traceUiViewFill(data, $element.html());
	                var link = $compile($element.contents());
	                var controller = data.$controller;
	                var controllerAs = data.$controllerAs;
	                if (controller) {
	                    var locals = data.$locals;
	                    var controllerInstance = $controller(controller, common_1.extend(locals, { $scope: scope }));
	                    if (controllerAs)
	                        scope[controllerAs] = controllerInstance;
	                    $element.data('$ngControllerController', controllerInstance);
	                    $element.children().data('$ngControllerController', controllerInstance);
	                }
	                link(scope);
	            };
	        }
	    };
	}
	angular.module('ui.router.state').directive('uiView', $ViewDirective);
	angular.module('ui.router.state').directive('uiView', $ViewDirectiveFill);
	//# sourceMappingURL=viewDirective.js.map

/***/ },
/* 52 */
/***/ function(module, exports) {

	function $ViewScrollProvider() {
	    var useAnchorScroll = false;
	    this.useAnchorScroll = function () {
	        useAnchorScroll = true;
	    };
	    this.$get = ['$anchorScroll', '$timeout', function ($anchorScroll, $timeout) {
	            if (useAnchorScroll) {
	                return $anchorScroll;
	            }
	            return function ($element) {
	                return $timeout(function () {
	                    $element[0].scrollIntoView();
	                }, 0, false);
	            };
	        }];
	}
	angular.module('ui.router.state').provider('$uiViewScroll', $ViewScrollProvider);
	//# sourceMappingURL=viewScroll.js.map

/***/ }
/******/ ])
});
;