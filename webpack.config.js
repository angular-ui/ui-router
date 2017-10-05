const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  entry: {
    'angular-ui-router': './src/index.ts',
    'stateEvents': './src/legacy/stateEvents.ts',
  },

  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },

  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader', options: { transpileOnly: true } }
    ]
  },

  stats: false,

  plugins: [
    new ForkTsCheckerWebpackPlugin(),
  ],

  externals: [ 'angular' ]
};
