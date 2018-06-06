import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../models'

export default {

  method: 'get',
  path: '/records?/:tokenId',

  parameters: Joi.object().keys({

    include: Joi.array().items(
      Joi.string().valid('metadata', 'provenance'),
    ).single().default([]),

    includeOrder: Joi.object().keys({
      provenance: Joi.string().valid('createdAt', '-createdAt'),
    }).default({
      provenance: '-createdAt',
    }),

  }),

  handler(request, response) {

    const populateConditions = request.parameters.include.map((include) => {
      return {
        path: include,
        options: {
          sort: request.parameters.includeOrder[include],
        },
      }
    })

    return models.CodexRecord.findById(request.params.tokenId)
      .populate(populateConditions)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new RestifyErrors.NotFoundError(`CodexRecord with tokenId ${request.params.tokenId} does not exist.`)
        }

        return codexRecord

      })

  },

}
