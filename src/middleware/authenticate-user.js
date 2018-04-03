import jwt from 'jsonwebtoken'
import RestifyErrors from 'restify-errors'

export default () => {

  return (request, response, next) => {

    if (!request.headers.authorization) {
      response.setHeader('Codex-Unauthorized-Reason', 'missing authorization header')
      throw new RestifyErrors.UnauthorizedError(
        'An auth token is required for this route.'
      )
    }

    jwt.verify(request.headers.authorization, process.env.JWT_SECRET, (error, jwtData) => {

      if (error) {
        response.setHeader('Codex-Unauthorized-Reason', error.message)
        throw new RestifyErrors.UnauthorizedError(
          'The specified auth token is invalid.'
        )
      }

      response.locals.userAddress = jwtData.userAddress

      next()

      return null

    })


  }
}
