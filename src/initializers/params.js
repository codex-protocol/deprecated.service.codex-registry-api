// This initializer traverses over the /src/params directory and attaches all
//  "param" routes to the express app
//
// see: http://expressjs.com/en/api.html#app.param

import Bluebird from 'bluebird'
import filewalker from 'filewalker'

import logger from '../services/logger'

export default (app) => {

  return new Bluebird((resolve, reject) => {

    const filewalkerHandler = filewalker(`${__dirname}/../middleware/params`, { recursive: true })

    filewalkerHandler.on('error', reject)
    filewalkerHandler.on('done', () => { resolve(app) })

    filewalkerHandler.on('file', (paramFilePath) => {

      // do not consider files & folders that start with an underscore or dot as
      //  valid params (also ignore sourcemap files)
      if (/^(_|\.)/.test(paramFilePath) || /\/(_|\.)/g.test(paramFilePath) || /\.js\.map$/.test(paramFilePath)) {
        return
      }

      /* eslint import/no-dynamic-require: 0 global-require: 0 */
      const param = require(`${__dirname}/../middleware/params/${paramFilePath}`).default

      if (typeof param.param !== 'string' && typeof param.handler !== 'function') {
        logger.warn(`param ${paramFilePath} has no param and/or handler defined`)
        return

      }

      app.param(param.param, (request, response, next, paramValue) => {
        Bluebird.resolve(param.handler.call(null, paramValue, response.locals))
          .then((result) => {
            request.params[param.param] = result
            next()
            return null
          })
          .catch(next)
      })

    })

    filewalkerHandler.walk()

  })
}
