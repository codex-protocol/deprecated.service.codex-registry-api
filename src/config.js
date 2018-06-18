import dotenv from 'dotenv'
import BigNumber from 'bignumber.js'
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
      enabled: true,
      cooldown: 1 * 60 * 1000, // 1 minute
      amount: new BigNumber(10).pow(18).times(100), // 100 CODX
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
      gasLimit: 300000,
      gasPrice: 5000000000, // 5 gwei

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
        uriPrefix: 'https://s3.amazonaws.com',
        buckets: {
          codexRegistry: 'codex.registry',
        },
      },
    },

    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  },

  staging: {

    personalMessageToSign,

    faucet: {
      enabled: true,
      cooldown: 24 * 60 * 60 * 1000, // 24 hours
      amount: new BigNumber(10).pow(18).times(100), // 100 CODX
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
      gasLimit: 300000,
      gasPrice: 5000000000, // 5 gwei

      minConfirmations: 5,
      startingBlockHeight: 3436527,
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
        uriPrefix: 'https://s3.amazonaws.com',
        buckets: {
          codexRegistry: 'codex.registry',
        },
      },
    },

    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  },

  production: {

    personalMessageToSign,

    faucet: {
      enabled: true,
      cooldown: 24 * 60 * 60 * 1000, // 24 hours
      amount: new BigNumber(10).pow(18).times(100), // 100 CODX
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
      logLevel: 'info',
    },

    blockchain: {
      gasLimit: 300000,
      gasPrice: 5000000000, // 5 gwei

      minConfirmations: 5,
      startingBlockHeight: 2449841, // TODO: update this when production is pointing to mainnet (non-beta)
      averageBlockTime: 15, // in seconds, this dictates how frequently to run agenda jobs

      // remove 0x from beginning of signerPrivateKey and store in a Buffer for
      //  use in various methods that require the private key as a hex buffer
      signerPrivateKey: process.env.SIGNER_PRIVATE_KEY,
      signerPrivateKeyBuffer: Buffer.from(process.env.SIGNER_PRIVATE_KEY.substr(2), 'hex'),
      signerPublicAddress: ethereumUtil.privateToAddress(process.env.SIGNER_PRIVATE_KEY).toString('hex'),
    },

    aws: {
      region: 'us-west-2',
      s3: {
        uriPrefix: 'https://s3-us-west-2.amazonaws.com',
        buckets: {
          codexRegistry: 'codex.registry-production',
        },
      },
    },

    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  },
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const envConfig = fullConfig[process.env.NODE_ENV]

envConfig.useSentry = !!process.env.SENTRY_DSN

export default envConfig
