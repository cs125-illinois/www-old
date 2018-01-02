const webpack = require('webpack')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  output: {
    publicPath: '/static-assets/',
    path: __dirname + '/src/static-assets',
    filename: 'js/[name].[chunkhash].js'
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
    ]
  },
  node: {
    fs: 'empty'
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
    }),
    new ExtractTextPlugin('css/[name].[chunkhash].css'),
    new UglifyJSPlugin(),
    new CleanWebpackPlugin([ 'src/static-assets' ])
  ],
  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: ExtractTextPlugin.extract({
          use: [
            { loader: 'css-loader',
              options: {
                minimize: true
              }
            },
            { loader: 'sass-loader' },
          ]
        })
      },
      {
        test: /\.(css)$/,
        use: ExtractTextPlugin.extract({
          use: [
            { loader: 'css-loader',
              options: {
                minimize: true
              }
            }
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
// vim: ts=2:sw=2:et:ft=javascript
