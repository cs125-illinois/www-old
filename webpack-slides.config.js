const webpack = require('webpack')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

module.exports = {
  output: {
    publicPath: '/static-assets/',
    path: __dirname + '/src/static-assets',
    filename: 'js/[name].[chunkhash].js'
  },
  entry: {
    slides: [
      './src/js/slides.js',
      './src/css/slides.scss',
      './src/fonts/fonts.css',
      './src/fonts/font-awesome.css'
    ],
  },
  node: {
    fs: 'empty'
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    new ExtractTextPlugin('css/[name].[chunkhash].css'),
    new CleanWebpackPlugin([
      'src/static-assets/js/slides*',
      'src/static-assets/css/slides*'
    ])
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
