import express from 'express'
import Bluebird from 'bluebird'

import lusca from 'lusca'
import bodyParser from 'body-parser'
import compression from 'compression'

export default (app) => {

  app.use(express.static(`${__dirname}/../../static/assets`))

  // disable the stupid "X-Powered-By: Express" header
  app.set('x-powered-by', false)

  app.use(compression())
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use(lusca.xframe('SAMEORIGIN'))
  app.use(lusca.xssProtection(true))

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
