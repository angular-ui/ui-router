var pkg = require('./package.json');
var banner = pkg.description + '\n' +
    '@version v' + pkg.version + '\n' +
    '@link ' + pkg.homepage + '\n' +
    '@license MIT License, http://www.opensource.org/licenses/MIT';

var webpack = require('webpack');
module.exports = {
  entry: {
    "angular-ui-router": "./src/index.ts",
    "angular-ui-router.min": "./src/index.ts",
    "stateEvents": "./src/legacy/stateEvents.ts",
    "stateEvents.min": "./src/legacy/stateEvents.ts",
  },

  output: {
    path: __dirname + "/release",
    filename: "[name].js",
    libraryTarget: "umd",
    library: "angular-ui-router",
    umdNamedDefine: true
  },

  devtool: 'source-map',

  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.ts']
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/, minimize: true
    }),
    new webpack.BannerPlugin(banner)
  ],

  module: {
    loaders: [
      { test: /\.tsx?$/, loader: "awesome-typescript-loader?noEmit=true" }
    ]
  },

  ts: {
    compilerOptions: {
      declaration: false
    }
  },
 
  externals: {
    "angular": { root: 'angular', amd: 'angular', commonjs2: 'angular', commonjs: 'angular' }
  }
};
