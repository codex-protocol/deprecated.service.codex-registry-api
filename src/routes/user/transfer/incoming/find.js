import Joi from 'joi'

import models from '../../../../models'

export default {

  method: 'get',
  path: '/users?/transfers?/incoming',

  requireAuthentication: true,

  parameters: Joi.object().keys({

    filters: Joi.object({
      isIgnored: Joi.array().items(
        Joi.boolean().required()
      ).single(),
    }).default({}),

    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).max(100).default(100),

    order: Joi.string().valid('createdAt', '-createdAt').default('createdAt'),

  }),

  handler(request, response) {

    const conditions = {
      approvedAddress: response.locals.userAddress,
    }

    Object.entries(request.parameters.filters).forEach(([key, value]) => {
      conditions[key] = { $in: value }
    })

    return models.CodexRecord.find(conditions)
      .limit(request.parameters.limit)
      .skip(request.parameters.offset)
      .sort(request.parameters.order)

      .then((codexRecords) => {
        return codexRecords.map((codexRecord) => {
          return codexRecord.setLocals(response.locals)
        })
      })

  },

}
