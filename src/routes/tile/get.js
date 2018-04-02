import Joi from 'joi'

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

    const fieldsToOmit = []

    // don't retrieve the provenance if it's not explicitly requested, since
    //  it'll just be an array of ObjectIds otherwise
    if (!request.parameters.include.includes('provenance')) {
      fieldsToOmit.push('-provenance')
    }

    return models.CodexTitle.findById(request.params.tokenId, fieldsToOmit)
      .populate(request.parameters.include)

  },

}
