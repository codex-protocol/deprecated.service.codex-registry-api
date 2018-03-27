import RestifyErrors from 'restify-errors'

export default (restrictToEnvironments) => {

  return (request, response, next) => {

    if (!restrictToEnvironments.includes(process.env.NODE_ENV)) {
      throw new RestifyErrors.ForbiddenError(
        `This route is forbidden in ${process.env.NODE_ENV}.`
      )
    }

    next()

  }
}
