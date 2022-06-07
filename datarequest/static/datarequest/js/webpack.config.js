var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, '.');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
  mode: 'production',
  entry: {'add': APP_DIR + '/add.js',
          'add_attachments': APP_DIR + '/add_attachments.js',
          'preliminary_review': APP_DIR + '/preliminary_review.js',
          'datamanager_review': APP_DIR + '/datamanager_review.js',
          'assign': APP_DIR + '/assign.js',
          'review': APP_DIR + '/review.js',
          'evaluate': APP_DIR + '/evaluate.js',
          'dao_evaluate': APP_DIR + '/dao_evaluate.js',
          'preregister': APP_DIR + '/preregister.js',
          'preregistration_confirm': APP_DIR + '/preregistration_confirm.js',
          'view': APP_DIR + '/view.js'},
  output: {
    path: BUILD_DIR,
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js?/,
        include : APP_DIR,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};

module.exports = config;
