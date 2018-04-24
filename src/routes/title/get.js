import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../models'

export default {

  method: 'get',
  path: '/titles?/:tokenId',

  parameters: Joi.object().keys({
    include: Joi.array().items(
      Joi.string().valid('metadata', 'provenance'),
    ).single().default([]),
  }),

  handler(request, response) {

    // even though this is a public route, business logic dictates that we
    //  should not return provenance if the user isn't logged in
    //
    // TODO: should metadata follow the same rules?
    if (!response.locals.userAddress) {
      request.parameters.include = request.parameters.include.filter((include) => {
        return include !== 'provenance'
      })
    }

    // don't retrieve the includes if they're not explicitly requested, since
    //  they'll just be ObjectIds otherwise
    const fieldsToOmit = []

    if (!request.parameters.include.includes('provenance')) fieldsToOmit.push('-provenance')
    if (!request.parameters.include.includes('metadata')) fieldsToOmit.push('-metadata')

    return models.CodexTitle.findById(request.params.tokenId, fieldsToOmit)
      .populate(request.parameters.include)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with id ${request.params.tokenId} does not exist.`)
        }

        return codexTitle

      })

  },

}
