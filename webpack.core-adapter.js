var webpack = require('webpack');
module.exports = {
  entry: {
    "ui-router-core-adapter": "./src/legacy/core-adapter.js",
  },

  output: {
    path: __dirname + "/release",
    filename: "[name].js",
    libraryTarget: "umd",
    library: "@uirouter/core",
    umdNamedDefine: true
  },

  resolve: {
    extensions: ['', '.js', '.ts']
  },

  externals: {
    "@uirouter/angularjs": { 
      root: '@uirouter/angularjs',
      amd: '@uirouter/angularjs',
      commonjs2: '@uirouter/angularjs',
      commonjs: '@uirouter/angularjs'
    }
  }
};
