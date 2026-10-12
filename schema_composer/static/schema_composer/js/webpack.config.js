const path = require('path')

const configIndividual = function (argv) {
  const BUILD_DIR = path.resolve(__dirname, '.')
  const APP_DIR = path.resolve(__dirname, 'src')

  const conf = {
    entry: {
      preview: APP_DIR + '/preview.js'
    },
    output: {
      path: BUILD_DIR,
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: APP_DIR,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react']
            }
          }
        }
      ]
    },
    mode: argv.mode === 'development' ? 'development' : 'production'
  }
  return conf
}

const config = function (env, argv) {
  return configIndividual(argv)
}

module.exports = config
