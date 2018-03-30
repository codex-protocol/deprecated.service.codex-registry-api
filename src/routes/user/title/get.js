import Joi from 'joi'

import models from '../../../models'

export default {

  method: 'get',
  path: '/address(es)?/:userAddress/titles?/:tokenId',

  parameters: Joi.object().keys({

    include: Joi.array().items(
      Joi.string().valid('provenance'),
    ).single().default([]),

    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).max(100).default(25),

  }),

  handler(request, response) {

    const conditions = {
      ownerAddress: request.params.userAddress,
      _id: request.params.tokenId,
    }

    const fieldsToOmit = []

    // don't retrieve the provenance if it's not explicitly requested, since
    //  it'll just be an array of ObjectIds otherwise
    if (!request.parameters.include.includes('provenance')) {
      fieldsToOmit.push('-provenance')
    }

    return models.CodexTitle.findOne(conditions, fieldsToOmit)
      .populate(request.parameters.include)

  },

}
