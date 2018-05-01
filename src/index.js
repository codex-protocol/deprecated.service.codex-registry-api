import 'babel-polyfill'

import express from 'express'

import config from './config'
import logger from './services/logger'
import initialize from './initializers'

const app = express()

initialize(app)
  .then(() => {
    const listener = app.listen(config.process.port, () => {
      logger.info(`server listening on port ${listener.address().port}`)
    })
  })
  .catch((error) => {
    logger.error('failed to initialize application', error)
  })
