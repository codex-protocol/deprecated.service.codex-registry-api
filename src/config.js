import dotenv from 'dotenv'
import ethereumUtil from 'ethereumjs-util'

// Reads environment variables stored in the '.env' file and writes them to the
//  process.env object
const dotenvResult = dotenv.config({ path: `${__dirname}/../.env` })

if (dotenvResult.error) {
  throw dotenvResult.error
}

// this is the message that will be signed by MetaMask and checked against when
//  authenticating users
const personalMessageToSign = 'Please sign this message to authenticate with the Codex Registry.'

const fullConfig = {
  development: {

    personalMessageToSign,

    faucet: {
      cooldown: 1 * 60 * 1000, // 1 minute
      gasPrice: 5000000000, // 5 gwei
      gasLimit: 300000,
      amount: '100',
    },

    orphanedMetadata: {
      jobFrequency: '1 minute',
      expiryThreshold: 5 * 60 * 1000, // 5 minutes
    },

    mongodb: {
      dbUris: {
        // DB URI for Ethereum Event Listener service
        eel: encodeURI(process.env.EEL_MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters

        // DB URI for this project
        codexRegistry: encodeURI(process.env.CODEX_REGISTRY_MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters
      },
    },

    process: {
      port: 3001,
      logLevel: 'silly',
    },

    blockchain: {
      minConfirmations: 0,
      startingBlockHeight: 0,
      averageBlockTime: 5, // in seconds, this dictates how frequently to run agenda jobs

      // remove 0x from beginning of signerPrivateKey and store in a Buffer for
      //  use in various methods that require the private key as a hex buffer
      signerPrivateKey: process.env.SIGNER_PRIVATE_KEY,
      signerPrivateKeyBuffer: Buffer.from(process.env.SIGNER_PRIVATE_KEY.substr(2), 'hex'),
      signerPublicAddress: ethereumUtil.privateToAddress(process.env.SIGNER_PRIVATE_KEY).toString('hex'),
    },

    aws: {
      region: 'us-east-1',
      s3: {
        buckets: {
          codexRegistry: 'codex.registry',
        },
      },
    },
  },

  staging: {

    personalMessageToSign,

    faucet: {
      cooldown: 24 * 60 * 60 * 1000, // 24 hours
      gasPrice: 5000000000, // 5 gwei
      gasLimit: 300000,
      amount: '100',
    },

    orphanedMetadata: {
      jobFrequency: '1 day',
      expiryThreshold: 7 * 24 * 60 * 60 * 1000, // 1 week
    },

    mongodb: {
      dbUris: {
        // DB URI for Ethereum Event Listener service
        eel: encodeURI(process.env.EEL_MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters

        // DB URI for this project
        codexRegistry: encodeURI(process.env.CODEX_REGISTRY_MONGODB_URI), // NOTE: encodeURI is necessary for passwords with URI reserved characters
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
      signerPublicAddress: ethereumUtil.privateToAddress(process.env.SIGNER_PRIVATE_KEY).toString('hex'),
    },

    aws: {
      region: 'us-east-1',
      s3: {
        buckets: {
          codexRegistry: 'codex.registry',
        },
      },
    },
  },

  // TODO: populate when a production environment is set up
  production: {
    process: {
      port: 3000,
      logLevel: 'info',
    },
    aws: {
      region: 'us-west-2',
      s3: {
        buckets: {
          codexRegistry: 'codex.registry-production',
        },
      },
    },
  },
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const envConfig = fullConfig[process.env.NODE_ENV]

envConfig.useSentry = !!process.env.SENTRY_DSN

export default envConfig
