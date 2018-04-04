import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../models'

export default {

  method: 'get',
  path: '/titles?/:tokenId',

  parameters: Joi.object().keys({
    include: Joi.array().items(
      Joi.string().valid('provenance'),
    ).single().default([]),
  }),

  handler(request, response) {

    // even though this is a public route, business logic dictates that we
    //  should not return provenance if the user isn't logged in
    if (!response.locals.userAddress) {
      request.parameters.include = request.parameters.include.filter((include) => {
        return include !== 'provenance'
      })
    }

    const fieldsToOmit = []

    // don't retrieve the provenance if it's not explicitly requested, since
    //  it'll just be an array of ObjectIds otherwise
    if (!request.parameters.include.includes('provenance')) {
      fieldsToOmit.push('-provenance')
    }

    return models.CodexTitle.findById(request.params.tokenId, fieldsToOmit)
      .populate(request.parameters.include)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with tokenId ${request.params.tokenId} does not exist.`)
        }

        return codexTitle

      })

  },

}
