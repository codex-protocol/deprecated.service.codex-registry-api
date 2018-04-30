import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'get',
  path: '/titles?/:tokenId/provenance',

  // NOTE: even though this route is not returning user-specific data, business
  //  logic dictates that we should not return provenance if the user isn't
  //  logged in
  requireAuthentication: true,

  parameters: Joi.object().keys({
    order: Joi.string().valid('createdAt', '-createdAt').default('-createdAt'),
  }),

  handler(request, response) {

    return models.CodexTitle.findById(request.params.tokenId, 'provenance')
      .populate({
        path: 'provenance',
        options: {
          sort: request.parameters.order,
        },
      })
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with tokenId ${request.params.tokenId} does not exist.`)
        }

        return codexTitle.provenance

      })

  },

}
