const webpack = require('webpack')

module.exports = {
  output: {
    publicPath: '/static-assets/',
    path: __dirname + '/src/static-assets',
    filename: 'js/[name].[chunkhash].js'
  },
  entry: {
    slides: [
      './src/js/slides.js'
    ],
  },
  node: {
    fs: 'empty'
  },
}
