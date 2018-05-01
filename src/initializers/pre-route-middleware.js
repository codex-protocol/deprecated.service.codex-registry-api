import Bluebird from 'bluebird'

import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import compression from 'compression'

import config from '../config'
import logger from '../services/logger'

export default (app) => {

  // sentry's request middleware must come before any others
  if (config.useSentry) {
    app.use(logger.transports.sentry.raven.requestHandler())
  }

  // in development, we need CORS enabled so the widget test page served by
  //  webpack can talk to this api
  if (process.env.NODE_ENV === 'development') {
    app.use(cors())
  }

  app.use(helmet())
  app.use(compression())

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  // if this response local is still false by the time the "throw route not
  //  found error" middleware, then we know no route touched the request and a
  //  404 error should be returned
  //
  // NOTE: this is set to true in the routes initializer
  app.use((request, response, next) => {
    response.locals.wasRequestProcessedByRoute = false
    next()
  })

  // the initializer index expects promises to be return from all initializers
  //  so just return a resolved promise
  return Bluebird.resolve(app)

}
