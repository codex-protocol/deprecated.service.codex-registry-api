import Bluebird from 'bluebird'

import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import compression from 'compression'

import config from '../config'
import logger from '../services/logger'

export default (app) => {

  const bodySizeLimit = '100mb'

  // trust IP addresses forwarded by nginx and the AWS load balancer (i.e.
  //  X-Forwarded-For headers)
  //
  // See: https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])

  // sentry's request middleware must come before any others
  if (config.useSentry) {
    app.use(logger.transports.sentry.raven.requestHandler())
  }

  app.use(compression())
  app.use(helmet())
  app.use(cors())

  app.use(bodyParser.json({
    limit: bodySizeLimit,
  }))
  app.use(bodyParser.urlencoded({
    limit: bodySizeLimit,
    extended: true,
  }))

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
