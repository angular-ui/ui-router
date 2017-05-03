import nodeResolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';
import progress from 'rollup-plugin-progress';
import sourcemaps from 'rollup-plugin-sourcemaps';
import visualizer from 'rollup-plugin-visualizer';

var MINIFY = process.env.MINIFY;
var ROUTER = process.env.ROUTER;
var EVENTS = process.env.EVENTS;
var RESOLVE = process.env.RESOLVE;

var pkg = require('./package.json');
var banner =
`/**
 * ${pkg.description}
 * @version v${pkg.version}
 * @link ${pkg.homepage}
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */`;

var uglifyOpts = { output: {} };
// retain multiline comment with @license
uglifyOpts.output.comments = (node, comment) =>
comment.type === 'comment2' && /@license/i.test(comment.value);

var plugins = [
  nodeResolve({jsnext: true}),
  progress({ clearLine: false }),
  sourcemaps(),
];

if (MINIFY) plugins.push(uglify(uglifyOpts));
if (ROUTER && MINIFY) plugins.push(visualizer({ sourcemap: true }));

var extension = MINIFY ? ".min.js" : ".js";

const BASE_CONFIG = {
  sourceMap: true,
  format: 'umd',
  exports: 'named',
  plugins: plugins,
  banner: banner,
};

const ROUTER_CONFIG = Object.assign({
  moduleName: '@uirouter/angularjs',
  entry: 'lib-esm/index.js',
  dest: 'release/angular-ui-router' + extension,
  globals: { angular: 'angular' },
  external: 'angular',
}, BASE_CONFIG);

const EVENTS_CONFIG = Object.assign({}, BASE_CONFIG, {
  moduleName: '@uirouter/angularjs-state-events',
  entry: 'lib-esm/legacy/stateEvents.js',
  dest: 'release/stateEvents' + extension,
  globals: { angular: 'angular', '@uirouter/core': '@uirouter/core' },
  external: ['angular', '@uirouter/core'],
});

const RESOLVE_CONFIG = Object.assign({}, BASE_CONFIG, {
  moduleName: '@uirouter/angularjs-resolve-service',
  entry: 'lib-esm/legacy/resolveService.js',
  dest: 'release/resolveService' + extension,
  globals: { angular: 'angular', '@uirouter/core': '@uirouter/core' },
  external: ['angular', '@uirouter/core'],
});

const CONFIG =
    RESOLVE ? RESOLVE_CONFIG :
    EVENTS ? EVENTS_CONFIG :
    ROUTER ? ROUTER_CONFIG : ROUTER_CONFIG;

export default CONFIG;
