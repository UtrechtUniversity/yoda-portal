var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, '../static/research/js');
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
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": [
                            ['@babel/preset-typescript', { allowNamespaces: true }],
                            "@babel/preset-env",
                            "@babel/preset-react"
                        ],
                        "plugins": [
                            "@babel/plugin-syntax-dynamic-import",
                            "@babel/plugin-proposal-object-rest-spread",
                            "@babel/plugin-proposal-class-properties",
                            "@babel/plugin-transform-typescript"
                        ]
                    }
                }
            }
        ]
    },
    mode: "production"
};

module.exports = config;