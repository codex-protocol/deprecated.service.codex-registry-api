import 'babel-polyfill'

import express from 'express'

import config from './config'
import logger from './services/logger'
import initializer from './initializers'

const app = express()

initializer(app)
  .then(() => {
    const listener = app.listen(config.process.port, () => {
      logger.info(`server listening on port ${listener.address().port}`)
    })
  })
  .catch((error) => {
    logger.error('failed to initialize application', error)
    process.exit(1)
  })
