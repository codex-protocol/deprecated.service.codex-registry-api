import Joi from 'joi'
import RestifyErrors from 'restify-errors'

export default (schema) => {

  return (request, response, next) => {

    request.parameters = {}

    // merge body & query because who cares how parameters were sent in
    const inputParameters = Object.assign({}, request.body, request.query)
    const options = { stripUnknown: true }

    Joi.validate(inputParameters, schema, options, (error, value) => {

      if (error) {
        throw new RestifyErrors.MissingParameterError(error.message)
      }

      request.parameters = value

      next()

    })

  }
}
