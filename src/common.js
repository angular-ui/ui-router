/*jshint globalstrict:true*/
/*global angular:false*/
'use strict';

var isDefined = angular.isDefined,
    isFunction = angular.isFunction,
    isString = angular.isString,
    isObject = angular.isObject,
    isArray = angular.isArray,
    forEach = angular.forEach,
    extend = angular.extend,
    copy = angular.copy;

function inherit(parent, extra) {
  return extend(new (extend(function() {}, { prototype: parent }))(), extra);
}

/**
 * Extends the destination object `dst` by copying all of the properties from the `src` object(s)
 * to `dst` if the `dst` object has no own property of the same name. You can specify multiple
 * `src` objects.
 *
 * @param {Object} dst Destination object.
 * @param {...Object} src Source object(s).
 * @see angular.extend
 */
function merge(dst) {
  forEach(arguments, function(obj) {
    if (obj !== dst) {
      forEach(obj, function(value, key) {
        if (!dst.hasOwnProperty(key)) dst[key] = value;
      });
    }
  });
  return dst;
}

angular.module('ui.util', ['ng']);
angular.module('ui.router', ['ui.util']);
angular.module('ui.state', ['ui.router', 'ui.util']);
angular.module('ui.compat', ['ui.state']);
