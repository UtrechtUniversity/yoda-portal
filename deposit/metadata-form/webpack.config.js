const webpack = require('webpack')
const path = require('path')

const BUILD_DIR = path.resolve(__dirname, '../static/deposit/js')
const APP_DIR = path.resolve(__dirname, 'src')

const config = {
  entry: APP_DIR + '/index.js',
  output: {
    path: BUILD_DIR,
    filename: 'metadata-form.js'
  },
  module: {
    rules: [
      {
        test: /\.js?/,
        include: APP_DIR,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/react'],
            plugins: ['@babel/plugin-proposal-object-rest-spread']
          }
        }
      }
    ]
  },
  mode: 'production'
}

module.exports = config
