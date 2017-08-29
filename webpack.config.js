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
      './js/site.js',
      './css/_site.scss',
      './fonts/fonts.css',
      './fonts/font-awesome.css'
    ],
    index: [
      './js/site.js',
      './css/index.scss',
      './fonts/fonts.css',
      './fonts/font-awesome.css'
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
