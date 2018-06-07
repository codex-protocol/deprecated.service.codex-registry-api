import 'babel-polyfill'

import http from 'http'
import io from 'socket.io'
import express from 'express'


import config from './config'
import logger from './services/logger'
import initialize from './initializers'

const app = express()
const httpApp = http.Server(app)
const socketApp = io(httpApp, { serveClient: false })

initialize(app, socketApp)
  .then(() => {
    const listener = httpApp.listen(config.process.port, () => {
      logger.verbose(`server listening on port ${listener.address().port}`)
    })
  })
  .catch((error) => {
    logger.error('failed to initialize application', error)
  })
