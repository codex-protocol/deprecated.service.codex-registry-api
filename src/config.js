import dotenv from 'dotenv'

// Reads environment variables stored in the '.env' file and writes them to the
//  process.env object
const dotenvResult = dotenv.config({ path: `${__dirname}/../.env` })

if (dotenvResult.error) {
  throw dotenvResult.error
}

const mongodbUriPrefix = (process.env.EEL_MONGO_USER && process.env.EEL_MONGO_PW) ? `mongodb://${process.env.EEL_MONGO_USER}:${encodeURIComponent(process.env.EEL_MONGO_PW)}@` : 'mongodb://'

// this is the message that will be signed by MetaMask and checked against when
//  authenticating users
const personalMessageToSign = 'Please sign this message to authenticate with the Codex Title Registry.'

const config = {
  development: {

    personalMessageToSign,

    mongodb: {
      dbUris: {
        // DB URI for Ethereum Event Listener service
        eel: `${mongodbUriPrefix}localhost:27017/eel`,

        // DB URI for this project
        titleRegistry: `${mongodbUriPrefix}localhost:27017/codex-title-registry`,
      },
    },

    process: {
      port: 3001,
      logLevel: 'silly',
    },

    blockchain: {
      minConfirmations: 3,
      startingBlockHeight: 0,
      networkId: '5777', // Ganache
      providerRpcUrl: process.env.RPC_URL,
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs
    },
  },

  // TODO: populate when a staging environment is set up
  // TODO: logLevel: 'verbose',
  staging: {},

  // TODO: populate when a production environment is set up
  // TODO: logLevel: 'info',
  production: {},
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

export default config[process.env.NODE_ENV]
