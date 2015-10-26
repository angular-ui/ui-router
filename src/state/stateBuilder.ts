import {map, noop, extend, pick, omit, values, applyPairs, prop,  isArray, isDefined, isFunction, isString, forEach} from "../common/common";
import Param from "../params/param";

const parseUrl = (url: string): any => {
  if (!isString(url)) return false;
  var root = url.charAt(0) === '^';
  return { val: root ? url.substring(1) : url, root };
};

// Builds state properties from definition passed to StateQueueManager.register()
export default function StateBuilder(root, matcher, $urlMatcherFactoryProvider) {

  let self = this, builders = {

    parent: function(state) {
      if (state === root()) return null;
      return matcher.find(self.parentName(state)) || root();
    },

    data: function(state) {
      if (state.parent && state.parent.data) {
        state.data = state.self.data = extend({}, state.parent.data, state.data);
      }
      return state.data;
    },

    // Build a URLMatcher if necessary, either via a relative or absolute URL
    url: function(state) {
      const parsed = parseUrl(state.url), parent = state.parent;
      const url = !parsed ? state.url : $urlMatcherFactoryProvider.compile(parsed.val, {
        params: state.params || {},
        paramMap: function(paramConfig, isSearch) {
          if (state.reloadOnSearch === false && isSearch) paramConfig = extend(paramConfig || {}, { dynamic: true });
          return paramConfig;
        }
      });

      if (!url) return null;
      if (!$urlMatcherFactoryProvider.isMatcher(url)) throw new Error(`Invalid url '${url}' in state '${state}'`);
      return (parsed && parsed.root) ? url : ((parent && parent.navigable) || root()).url.append(url);
    },

    // Keep track of the closest ancestor state that has a URL (i.e. is navigable)
    navigable: function(state) {
      return (state !== root()) && state.url ? state : (state.parent ? state.parent.navigable : null);
    },

    params: function(state): { [key: string]: Param } {
      const makeConfigParam = (config: any, id: string) => Param.fromConfig(id, null, config);
      let urlParams: Param[] = (state.url && state.url.parameters({ inherit: false })) || [];
      let nonUrlParams: Param[] = values(map(omit(state.params || {}, urlParams.map(prop('id'))), makeConfigParam));
      return urlParams.concat(nonUrlParams).map(p => [p.id, p]).reduce(applyPairs, {});
    },

    // If there is no explicit multi-view configuration, make one up so we don't have
    // to handle both cases in the view directive later. Note that having an explicit
    // 'views' property will mean the default unnamed view properties are ignored. This
    // is also a good time to resolve view names to absolute names, so everything is a
    // straight lookup at link time.
    views: function(state) {
      let views    = {},
          tplKeys  = ['templateProvider', 'templateUrl', 'template', 'notify', 'async'],
          ctrlKeys = ['controller', 'controllerProvider', 'controllerAs'];
      let allKeys = tplKeys.concat(ctrlKeys);

      forEach(state.views || { "$default": pick(state, allKeys) }, function (config, name) {
        name = name || "$default"; // Account for views: { "": { template... } }
        // Allow controller settings to be defined at the state level for all views
        forEach(ctrlKeys, (key) => {
          if (state[key] && !config[key]) config[key] = state[key];
        });
        if (Object.keys(config).length > 0) views[name] = config;
      });
      return views;
    },

    // Keep a full path from the root down to this state as this is needed for state activation.
    path: function(state) {
      return state.parent ? state.parent.path.concat(state) : /*root*/ [state];
    },

    // Speed up $state.includes() as it's used a lot
    includes: function(state) {
      let includes = state.parent ? extend({}, state.parent.includes) : {};
      includes[state.name] = true;
      return includes;
    }
  };

  extend(this, {
    builder: function(_name, _func) {
      if (isString(_name) && !isDefined(_func)) return builders[_name];
      if (!isFunction(_func) || !isString(_name)) return;

      function remove(name, func) {
        if (!builders[name].length) {
          delete builders[name];
          return;
        }
        builders[name].splice(builders[name].indexOf(func, 1));

        if (builders[name].length === 1) {
          builders[name] = builders[name][0];
        }
      }

      function add(name, func) {
        if (!builders[name]) {
          builders[name] = func;
          return function() { remove(name, func); };
        }

        if (!isArray(builders[name])) {
          builders[name] = [builders[name]];
        }
        builders[name].push(func);
        return function() { remove(name, func); };
      }

      return add(_name, _func);
    },

    build: function(state) {
      let parent = this.parentName(state);
      if (parent && !matcher.find(parent)) return null;

      for (let key in builders) {
        if (!builders.hasOwnProperty(key)) continue;
        let steps = isArray(builders[key]) ? builders[key].reverse() : [builders[key]];
        let chainFns = (memo, step) => step(state, memo);
        state[key] = steps.reduce(chainFns, noop);
      }
      return state;
    },

    parentName: function(state) {
      let name = state.name || "";
      if (name.indexOf('.') !== -1) return name.substring(0, name.lastIndexOf('.'));
      if (!state.parent) return "";
      return isString(state.parent) ? state.parent : state.parent.name;
    },

    name: function(state) {
      let name = state.name;
      if (name.indexOf('.') !== -1 || !state.parent) return name;

      let parentName = isString(state.parent) ? state.parent : state.parent.name;
      return parentName ? parentName + "." + name : name;
    }
  });
}
