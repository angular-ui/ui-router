// <package>/../../src/ is copied to <package>/src
// This config is then copied to <package>/src/webpack.config.js

var webpack = require('webpack');
module.exports = {
  entry: {
    "angular-ui-router": "./ng1.ts",
    "angular-ui-router.min": "./ng1.ts"
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
    })
  ],

  module: {
    loaders: [
      { test: /\.ts$/, loader: "ts-loader" }
    ]
  }
};
