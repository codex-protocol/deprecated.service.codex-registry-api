import dotenv from 'dotenv'

// Reads environment variables stored in the '.env' file and writes them to the
//  process.env object
const dotenvResult = dotenv.config({ path: `${__dirname}/../.env` })

if (dotenvResult.error) {
  throw dotenvResult.error
}

// this is the message that will be signed by MetaMask and checked against when
//  authenticating users
const personalMessageToSign = 'Please sign this message to authenticate with the Codex Title Registry.'

const config = {
  development: {

    personalMessageToSign,

    mongodb: {
      dbUris: {
        // DB URI for Ethereum Event Listener service
        eel: encodeURI(process.env.EEL_MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters

        // DB URI for this project
        titleRegistry: encodeURI(process.env.TITLE_REGISTRY_MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters
      },
    },

    process: {
      port: 3001,
      logLevel: 'silly',
    },

    blockchain: {
      minConfirmations: 0,
      startingBlockHeight: 0,
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs

      // remove 0x from beginning of signerPrivateKey and store in a Buffer for
      //  use in various methods that require the private key as a hex buffer
      signerPrivateKey: process.env.SIGNER_PRIVATE_KEY,
      signerPrivateKeyBuffer: Buffer.from(process.env.SIGNER_PRIVATE_KEY.substr(2), 'hex'),
    },
  },

  staging: {

    personalMessageToSign,

    mongodb: {
      dbUris: {
        // DB URI for Ethereum Event Listener service
        eel: encodeURI(process.env.EEL_MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters

        // DB URI for this project
        titleRegistry: encodeURI(process.env.TITLE_REGISTRY_MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters
      },
    },

    process: {
      port: 3000,
      logLevel: 'verbose',
    },

    blockchain: {
      minConfirmations: 5,
      startingBlockHeight: 2053830,
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs

      // remove 0x from beginning of signerPrivateKey and store in a Buffer for
      //  use in various methods that require the private key as a hex buffer
      signerPrivateKey: process.env.SIGNER_PRIVATE_KEY,
      signerPrivateKeyBuffer: Buffer.from(process.env.SIGNER_PRIVATE_KEY.substr(2), 'hex'),
    },
  },

  // TODO: populate when a production environment is set up
  // TODO: logLevel: 'info',
  production: {},
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

export default config[process.env.NODE_ENV]
