// This initializer traverses over the /src/routes directory and attaches all
//  defined routes to the express app

import uuid from 'uuid'
import multer from 'multer'
import Bluebird from 'bluebird'
import filewalker from 'filewalker'

import logger from '../services/logger'
import authenticateUserMiddleware from '../middleware/authenticate-user'
import validateParametersMiddleware from '../middleware/validate-parameters'
import restrictToEnvironmentsMiddleware from '../middleware/restrict-to-environments'

const upload = multer({
  storage: multer.diskStorage({
    destination(request, file, callback) {
      callback(null, '/tmp')
    },
    filename(request, file, callback) {
      const extension = file.originalname.split('.').pop().toLowerCase()
      callback(null, `${Date.now()}.${uuid.v4()}.${extension}`)
    },
  }),
})

export default (app) => {

  return new Bluebird((resolve, reject) => {

    const filewalkerHandler = filewalker(`${__dirname}/../routes`, { recursive: true })

    filewalkerHandler.on('error', reject)
    filewalkerHandler.on('done', () => { resolve(app) })

    filewalkerHandler.on('file', (routeFilePath) => {

      // do not consider files & folders that start with an underscore or dot as
      //  valid routes (also ignore sourcemap files)
      if (/^(_|\.)/.test(routeFilePath) || /\/(_|\.)/g.test(routeFilePath) || /\.js\.map$/.test(routeFilePath)) {
        return
      }

      /* eslint import/no-dynamic-require: 0 global-require: 0 */
      const route = require(`${__dirname}/../routes/${routeFilePath}`).default

      if (!route || !route.method || (!route.path && !route.paths) || typeof route.handler !== 'function') {
        logger.warn(`route ${routeFilePath} has no method, path(s), and/or handler defined`)
        return
      }

      // convert "single path" routes to single-element "paths" array
      route.paths = route.paths || [route.path]

      // lowercase the method name for consistency
      route.method = route.method.toLowerCase()

      // now build up an array of middleware for this route based on the
      //  properties definied in the route file
      const middleware = []

      // the first middleware rejects the request if this route is forbidden in
      //  this environment
      if (route.restrictToEnvironments) {
        middleware.push(restrictToEnvironmentsMiddleware(route.restrictToEnvironments))
      }

      // the next middleware will accept multipart/form-data (with file support
      //  if necessary)
      //
      // route.fileOptions should be an object with the following keys:
      //   {
      //     as: 'image', // specifies the field name for the file(s) to be read from (default is "file(s)")
      //     multiple: true, // should this route accept an array of files or only one?
      //   }
      if (route.fileOptions) {

        if (route.fileOptions.multiple === true) {
          middleware.push(upload.array(route.fileOptions.as || 'files'))
        } else {
          middleware.push(upload.single(route.fileOptions.as || 'file'))
        }

      } else {
        // not specifying a file name for upload.array() allows routes to accept
        //  multipart/form-data requests, but not files
        //
        // see: https://www.npmjs.com/package/multer#usage
        middleware.push(upload.array())
      }

      // the next middleware logs the request and sets an initial status code
      middleware.push((request, response, next) => {

        logger.verbose(route.method.toUpperCase(), request.originalUrl, request.body)

        // set a flag here to let the "throw route not found error" middleware
        //  know that a route has processed this request
        response.locals.wasRequestProcessedByRoute = true

        // set an appropriate status code that will be overwritten in the
        //  "format response" middleware if an error is thrown
        switch (route.method) {
          case 'put':
          case 'post':
            response.status(201)
            break

          case 'delete':
            response.status(204)
            break

          default:
            response.status(200)
        }

        next()

      })

      // the next middleware will check the authorization header for a valid JWT
      //  and add response.locals.user if the specified token corresponds to a
      //  valid user record
      //
      // @NOTE: we always call the authenticate middleware even if the route is
      //  public, so that routes can know if the user is "logged in" or not
      //
      // routes are responsible for returning appropriate data based on whether
      //  or not the user is authenticated
      middleware.push(authenticateUserMiddleware(route.requireAuthentication || false))

      // the next middleware will validate parameters based on the specified
      //  Joi schema
      //
      // @NOTE: this should come after the authenticateUser middleware,
      //  otherwise the response would be sent for invalid parameters before
      //  authentication takes place, thus giving potential attackers too much
      //  info about a protected route
      if (route.parameters) {
        middleware.push(validateParametersMiddleware(route.parameters))
      }

      // the next method will be the actual route handler
      middleware.push((request, response, next) => {
        Bluebird.resolve(route.handler.call(null, request, response, next))
          .then((result) => {

            // some routes directly send the response, without the need for all
            //  the subsequent JSON formatting middleware and such, so if the
            //  sendsResponse key is set, do not call next() here
            if (route.sendsResponse) {
              return
            }

            response.result = result
            next()
          })
          .catch(next)
      })

      route.paths.forEach((path) => {
        app[route.method](path, middleware)
      })

    })

    filewalkerHandler.walk()

  })
}
