const webpack = require('webpack');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  context: './src/',
  output: {
    publicPath: '/',
    filename: 'js/[name].[chunkhash].js'
  },
  entry: {
    site: [
      'bootstrap',
      './css/_site.scss',
      './fonts/fonts.css'
    ],
    index: [
      'bootstrap',
      './css/index.scss',
      './fonts/fonts.css'
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
    }),
    new ExtractTextPlugin('css/[name].[chunkhash].css'),
  ],
  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: ExtractTextPlugin.extract({
          use: [ 'css-loader', 'sass-loader' ]
        })
      },
      {
        test: /\.(css)$/,
        use: ExtractTextPlugin.extract({
          use: [ 'css-loader' ]
        })
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'fonts/'
            }
          }
        ]
      },
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
