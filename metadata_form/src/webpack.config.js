const path = require('path')

const configIndividual = function (argv) {
  const BUILD_DIR = path.resolve(__dirname, `../../${argv.name}/static/${argv.name}/js`)
  const APP_DIR = path.resolve(__dirname, `../../${argv.name}/metadata-form/src`)
  // Our custom fields shared by research, deposit, and vault
  const SHARED_DIR = path.resolve(__dirname, './')

  const conf = {
    entry: APP_DIR + '/index.js',
    output: {
      path: BUILD_DIR,
      filename: 'metadata-form.js'
    },
    resolve: {
      modules: ['...', SHARED_DIR + '/node_modules', 'node_modules'],
      alias: {
        YodaFields: SHARED_DIR + '/js',
        YodaTemplates: SHARED_DIR + '/js'
      }
    },
    module: {
      rules: [
        {
          test: /\.(?:js|jsx)$/,
          exclude: /node_modules/,
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
    name: argv.name,
    mode: argv.mode === 'development' ? 'development' : 'production'
  }
  if (argv.mode === 'development') {
    conf.devtool = 'eval-source-map'
    // conf.devtool = 'source-map'
  }
  return conf
}

const config = function (env, argv) {
  if (argv.name === 'all') {
    // Build research, deposit, and vault
    const confArray = []
    confArray.push(configIndividual({ name: 'research', mode: 'production' }))
    confArray.push(configIndividual({ name: 'deposit', mode: 'production' }))
    confArray.push(configIndividual({ name: 'vault', mode: 'production' }))
    return confArray
  }

  return configIndividual(argv)
}

module.exports = config
