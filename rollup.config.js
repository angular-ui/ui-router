import nodeResolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';
import progress from 'rollup-plugin-progress';
import sourcemaps from 'rollup-plugin-sourcemaps';
import visualizer from 'rollup-plugin-visualizer';

const MINIFY = process.env.MINIFY;
const MONOLITHIC = process.env.MONOLITHIC;
const ROUTER = process.env.ROUTER;
const EVENTS = process.env.EVENTS;
const RESOLVE = process.env.RESOLVE;

const pkg = require('./package.json');
let banner =
`/**
 * ${pkg.description}`;
if (ROUTER && MONOLITHIC) {
  banner += `
 * NOTICE: This monolithic bundle also bundles the @uirouter/core code.
 *         This causes it to be incompatible with plugins that depend on @uirouter/core.
 *         We recommend switching to the ui-router-core.js and ui-router-angularjs.js bundles instead.
 *         For more information, see https://ui-router.github.io/blog/uirouter-for-angularjs-umd-bundles`
} else if (ROUTER) {
  banner += `
 * This bundle requires the ui-router-core.js bundle from the @uirouter/core package.`
}
banner += `
 * @version v${pkg.version}
 * @link ${pkg.homepage}
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */`;

const uglifyOpts = { output: {} };
// retain multiline comment with @license
uglifyOpts.output.comments = (node, comment) =>
comment.type === 'comment2' && /@license/i.test(comment.value);

const onwarn = (warning) => {
  // Suppress this error message... https://github.com/rollup/rollup/wiki/Troubleshooting#this-is-undefined
  const ignores = ['THIS_IS_UNDEFINED'];
  if (!ignores.some(code => code === warning.code)) {
    console.error(warning.message);
  }
};

const plugins = [
  nodeResolve({jsnext: true}),
  progress({ clearLine: false }),
  sourcemaps(),
];

if (MINIFY) plugins.push(uglify(uglifyOpts));
if (ROUTER && MINIFY) plugins.push(visualizer({ sourcemap: true }));

const extension = MINIFY ? ".min.js" : ".js";

const BASE_CONFIG = {
  sourcemap: true,
  exports: 'named',
  plugins: plugins,
  banner: banner,
  onwarn: onwarn,
};

const ROUTER_CONFIG = Object.assign({
  input: 'lib-esm/index.js',
  external: ['angular', '@uirouter/core'],
  output: {
    file: 'release/ui-router-angularjs' + extension,
    format: 'umd',
    name: '@uirouter/angularjs',
    globals: { angular: 'angular', '@uirouter/core': '@uirouter/core' },
  },
}, BASE_CONFIG);

// Also bundles the code from @uirouter/core into the same bundle
const MONOLITHIC_ROUTER_CONFIG = Object.assign({
  input: 'lib-esm/index.js',
  external: 'angular',
  output: {
    file: 'release/angular-ui-router' + extension,
    format: 'umd',
    name: '@uirouter/angularjs',
    globals: { angular: 'angular' },
  },
}, BASE_CONFIG);

const EVENTS_CONFIG = Object.assign({}, BASE_CONFIG, {
  input: 'lib-esm/legacy/stateEvents.js',
  external: ['angular', '@uirouter/core'],
  output: {
    file: 'release/stateEvents' + extension,
    format: 'umd',
    name: '@uirouter/angularjs-state-events',
    globals: { angular: 'angular', '@uirouter/core': '@uirouter/core' },
  },
});

const RESOLVE_CONFIG = Object.assign({}, BASE_CONFIG, {
  input: 'lib-esm/legacy/resolveService.js',
  external: ['angular', '@uirouter/core'],
  output: {
    file: 'release/resolveService' + extension,
    format: 'umd',
    name: '@uirouter/angularjs-resolve-service',
    globals: { angular: 'angular', '@uirouter/core': '@uirouter/core' },
  },
});

const CONFIG =
    RESOLVE ? RESOLVE_CONFIG :
    EVENTS ? EVENTS_CONFIG :
    MONOLITHIC ? MONOLITHIC_ROUTER_CONFIG :
    ROUTER ? ROUTER_CONFIG : ROUTER_CONFIG;

export default CONFIG;
