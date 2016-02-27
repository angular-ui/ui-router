// <package>/../../src/ is copied to <package>/src
// This config is then copied to <package>/src/webpack.config.js

var webpack = require('webpack');
module.exports = {
  entry: {
    "ui-router-core": "./core.ts",
    "ui-router-core.min": "./core.ts"
  },

  output: {
    path: __dirname + "/../_bundles",
    filename: "[name].js",
    libraryTarget: "umd",
    library: "ui-router-core",
    umdNamedDefine: true
  },

  devtool: 'source-map',

  resolve: {
    modulesDirectories: ['../../../node_modules'],
    extensions: ['', '.js', '.ts']
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/, minimize: true
    })
  ],

  module: {
    loaders: [
      { test: /\.ts$/, loader: "ts-loader" }
    ]
  }
};
