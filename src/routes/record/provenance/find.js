import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'get',
  path: '/records?/:tokenId/provenance',

  // NOTE: even though this route is not returning user-specific data, business
  //  logic dictates that we should not return provenance if the user isn't
  //  logged in
  requireAuthentication: true,

  parameters: Joi.object().keys({
    order: Joi.string().valid('createdAt', '-createdAt').default('-createdAt'),
  }),

  handler(request, response) {

    // NOTE: we must retrieve the entire CodexRecord record (and not just the
    //  provenance even though that's all we need here) because the toJSON()
    //  method needs other values to determine if this user should be allowed to
    //  view the provenance
    return models.CodexRecord.findById(request.params.tokenId)
      .populate({
        path: 'provenance',
        options: {
          sort: request.parameters.order,
        },
      })
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new RestifyErrors.NotFoundError(`CodexRecord with tokenId ${request.params.tokenId} does not exist.`)
        }

        return codexRecord
          .setLocals(response.locals)
          .toJSON()
          .provenance

      })

  },

}
