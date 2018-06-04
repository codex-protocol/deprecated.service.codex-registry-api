import Joi from 'joi'

import models from '../../../../models'

export default {

  method: 'get',
  path: '/users?/transfers?/incoming',

  requireAuthentication: true,

  parameters: Joi.object().keys({

    include: Joi.array().items(
      Joi.string().valid('metadata', 'provenance'),
    ).single().default([]),

    filters: Joi.object({
      isIgnored: Joi.array().items(
        Joi.boolean().required()
      ).single(),
    }).default({}),

    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).max(100).default(100),

    order: Joi.string().valid('createdAt', '-createdAt').default('createdAt'),

    includeOrder: Joi.object().keys({
      provenance: Joi.string().valid('createdAt', '-createdAt'),
    }).default({
      provenance: '-createdAt',
    }),

  }),

  handler(request, response) {

    const conditions = {
      approvedAddress: response.locals.userAddress,
    }

    Object.entries(request.parameters.filters).forEach(([key, value]) => {
      conditions[key] = { $in: value }
    })

    const populateConditions = request.parameters.include.map((include) => {
      return {
        path: include,
        options: {
          sort: request.parameters.includeOrder[include],
        },
      }
    })

    return models.CodexRecord.find(conditions)
      .limit(request.parameters.limit)
      .skip(request.parameters.offset)
      .sort(request.parameters.order)
      .populate(populateConditions)

      .then((codexRecords) => {

        codexRecords.forEach((codexRecord) => {
          return codexRecord.applyPrivacyFilters(response.locals.userAddress)
        })

        return codexRecords

      })

  },

}
