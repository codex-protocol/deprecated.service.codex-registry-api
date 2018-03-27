// This is a special "error middleware" that standardizes errors sent in API
//  responses (see: http://expressjs.com/en/guide/error-handling.html)

import logger from '../services/logger'

export default () => {

  return (error, request, response, next) => {

    response.error = {
      code: error.statusCode || 500,
      message: error.message || 'An internal server error has occurred.',
    }

    logger.verbose('sending response with error:', response.error)

    next()

  }

}
