var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, '../static/deposit/js');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
    entry: APP_DIR + '/index.js',
    output: {
        path: BUILD_DIR,
        filename: 'metadata-form.js'
    },
    module: {
        rules: [
            {
                test: /\.js?/,
                include : APP_DIR,
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
    mode: "production"
};

module.exports = config;
