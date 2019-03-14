require('dotenv').config()
const webpack = require('webpack')
const path = require('path')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const WebpackCleanupPlugin = require('webpack-cleanup-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = function (env, argv) {
  let config = {
    output: {
      publicPath: '/static-assets/',
      path: __dirname + '/src/static-assets/',
      filename: '[name].[chunkhash].js'
    },
    entry: {
      site: [
        './src/js/site.js',
        './src/css/_site.scss',
        './src/fonts/fonts.css',
        './src/fonts/font-awesome.css'
      ],
      index: [
        './src/js/site.js',
        './src/css/index.scss',
        './src/fonts/fonts.css',
        './src/fonts/font-awesome.css'
      ],
      highlight: [
        './src/js/highlight.js',
      ],
      slides: [
        './src/css/slides.scss',
        './src/fonts/fonts.css',
        './src/fonts/font-awesome.css'
      ],
    },
    node: {
      fs: 'empty'
    },
    optimization: {
      minimizer: [ new TerserPlugin() ]
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        Popper: ['popper.js', 'default'],
      }),
      new ExtractTextPlugin('[name].[chunkhash].css'),
      new WebpackCleanupPlugin()
    ],
    module: {
      rules: [
        {
          test: /\.(scss)$/,
          use: ExtractTextPlugin.extract({
            use: [
              { loader: 'css-loader' },
              { loader: 'sass-loader' },
            ]
          })
        },
        {
          test: /\.(css)$/,
          use: ExtractTextPlugin.extract({
            use: [
              { loader: 'css-loader' }
            ]
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
        {
          test: require.resolve('jquery'),
          use: [{
            loader: 'expose-loader',
            options: '$'
          }]
        }
      ]
    }
  }
  return config
}
// vim: ts=2:sw=2:et:ft=javascript
