// <package>/../../src/ is copied to <package>/src
// This config is then copied to <package>/src/webpack.config.js

var webpack = require('webpack');
module.exports = {
  entry: {
    "ui-router-ng2": "./ng2.ts",
    "ui-router-ng2.min": "./ng2.ts"
  },

  output: {
    path: __dirname + "/../_bundles",
    filename: "[name].js",
    libraryTarget: "umd",
    library: "ui-router-ng2",
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
    })
  ],

  module: {
    loaders: [
      { test: /\.ts$/, loader: "ts-loader" }
    ]
  },
 
  externals: {
    "angular2/core": { root: 'angular2/core', commonjs2: 'angular2/core', commonjs: 'angular2/core' }
  }
};
