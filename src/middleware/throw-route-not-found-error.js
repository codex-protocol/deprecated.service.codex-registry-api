// This middleware is added after all route middleware, so that if it is reached
//  we know no route picked up the request and we should return a 404

import RestifyErrors from 'restify-errors'

export default () => {

  return (request, response, next) => {

    if (response.locals.wasRequestProcessedByRoute === false) {
      throw new RestifyErrors.NotFoundError('Route not found.')
    }

    next()

  }

}
