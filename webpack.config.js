const webpack = require('webpack')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  output: {
    filename: 'src/assets/js/[name].[chunkhash].js'
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
    new ExtractTextPlugin('src/assets/css/[name].[chunkhash].css'),
    new UglifyJSPlugin()
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
              outputPath: 'src/assets/fonts/'
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
