/** @module params */ /** for typedoc */
import {IServiceProviderFactory} from "angular";
import {forEach, ancestors, extend, copy, pick, omit} from "../common/common";

export class StateParams {
  constructor(params: Object = {}) {
    extend(this, params);
  }

  $digest() {}
  $inherit(newParams, $current, $to) {}
  $set(params, url) {}
  $sync() {}
  $off() {}
  $raw() {}
  $localize(state, params) {}
  $observe(key: string, fn: Function) {}
}

$StateParamsProvider.$inject = [];
function $StateParamsProvider() {

  function stateParamsFactory() {
    let observers = {}, current = {};

    function unhook(key, func) {
      return () => {
        forEach(key.split(" "), k => observers[k].splice(observers[k].indexOf(func), 1));
      };
    }

    function observeChange(key, val?: any) {
      if (!observers[key] || !observers[key].length) return;
      forEach(observers[key], func => func(val));
    }


    StateParams.prototype.$digest = function() {
      forEach(this, (val, key) => {
        if (val === current[key] || !this.hasOwnProperty(key)) return;
        current[key] = val;
        observeChange(key, val);
      });
    };

    /**
     * Merges a set of parameters with all parameters inherited between the common parents of the
     * current state and a given destination state.
     *
     * @param {Object} newParams The set of parameters which will be composited with inherited params.
     * @param {Object} $current Internal definition of object representing the current state.
     * @param {Object} $to Internal definition of object representing state to transition to.
     */
    StateParams.prototype.$inherit = function(newParams, $current, $to) {
      let parents = ancestors($current, $to), parentParams, inherited = {}, inheritList = [];

      for (let i in parents) {
        if (!parents[i].params) continue;
        parentParams = Object.keys(parents[i].params);
        if (!parentParams.length) continue;

        for (let j in parentParams) {
          if (inheritList.indexOf(parentParams[j]) >= 0) continue;
          inheritList.push(parentParams[j]);
          inherited[parentParams[j]] = this[parentParams[j]];
        }
      }
      return extend({}, inherited, newParams);
    };

    StateParams.prototype.$set = function(params, url) {
      let hasChanged = false, abort = false;

      if (url) {
        forEach(params, function(val, key) {
          if ((url.parameter(key) || {}).dynamic !== true) abort = true;
        });
      }
      if (abort) return false;

      forEach(params, (val, key) => {
        if (val !== this[key]) {
          this[key] = val;
          observeChange(key);
          hasChanged = true;
        }
      });

      this.$sync();
      return hasChanged;
    };

    StateParams.prototype.$sync = function() {
      copy(this, current);
      return this;
    };

    StateParams.prototype.$off = function() {
      observers = {};
      return this;
    };

    StateParams.prototype.$raw = function() {
      return omit(
        this,
        Object.keys(this).filter(StateParams.prototype.hasOwnProperty.bind(StateParams.prototype))
      );
    };

    StateParams.prototype.$localize = function(state, params) {
      return new StateParams(pick(params || this, Object.keys(state.params)));
    };

    StateParams.prototype.$observe = function(key: string, fn: Function) {
      forEach(key.split(" "), k => (observers[k] || (observers[k] = [])).push(fn));
      return unhook(key, fn);
    };

    return new StateParams();
  }

  let global = stateParamsFactory();

  this.$get = $get;
  $get.$inject = ['$rootScope'];
  function $get(   $rootScope) {

    $rootScope.$watch(function() {
      global.$digest();
    });

    return global;
  }
}

angular.module('ui.router.state')
    .provider('$stateParams', <IServiceProviderFactory> $StateParamsProvider);
