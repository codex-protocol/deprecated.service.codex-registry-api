import Joi from 'joi'

import models from '../../../models'

export default {

  method: 'get',
  path: '/users?/titles?',

  requireAuthentication: true,

  parameters: Joi.object().keys({

    include: Joi.array().items(
      Joi.string().valid('metadata', 'provenance'),
    ).single().default([]),

    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).max(100).default(25),

  }),

  handler(request, response) {

    const conditions = {
      ownerAddress: response.locals.userAddress,
    }

    // don't retrieve the includes if they're not explicitly requested, since
    //  they'll just be ObjectIds otherwise
    const fieldsToOmit = []

    if (!request.parameters.include.includes('provenance')) fieldsToOmit.push('-provenance')
    if (!request.parameters.include.includes('metadata')) fieldsToOmit.push('-metadata')

    return models.CodexTitle.find(conditions, fieldsToOmit)
      .populate(request.parameters.include)
      .limit(request.parameters.limit)
      .skip(request.parameters.offset)

  },

}
