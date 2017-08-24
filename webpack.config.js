const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  context: './src/',
  output: {
    publicPath: '/',
    filename: 'js/[name].[chunkhash].js'
  },
  entry: ['bootstrap', './css/overrides.scss'],
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
    }),
    new ExtractTextPlugin('css/[name].[chunkhash].css')
  ],
  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: ExtractTextPlugin.extract({
          use: [ 'css-loader', 'sass-loader' ]
        })
      }
    ]
  },
  stats: {
    hash: false,
    version: false,
    timings: false,
    assets: false,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    publicPath: false
  }
}
// vim: ts=2:sw=2:et:ft=javascript
