// <package>/../../src/ is copied to <package>/src
// This config is then copied to <package>/src/webpack.config.js

var pkg = require('../bower.json');
var banner = pkg.description + '\n' +
    '@version v' + pkg.version + '\n' +
    '@link ' + pkg.homepage + '\n' +
    '@license MIT License, http://www.opensource.org/licenses/MIT';

var webpack = require('webpack');
module.exports = {
  entry: {
    "angular-ui-router": "./ng1.ts",
    "angular-ui-router.min": "./ng1.ts",
    "stateEvents": "./ng1/stateEvents.ts",
    "stateEvents.min": "./ng1/stateEvents.ts"
  },

  output: {
    path: __dirname + "/../release",
    filename: "[name].js",
    libraryTarget: "umd",
    library: "angular-ui-router",
    umdNamedDefine: true
  },

  devtool: 'source-map',

  resolve: {
    modulesDirectories: ['../../node_modules'],
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
      { test: /\.ts$/, loader: "ts-loader" }
    ]
  }
};
