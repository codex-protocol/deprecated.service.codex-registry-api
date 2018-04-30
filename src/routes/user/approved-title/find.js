import Joi from 'joi'

import models from '../../../models'

export default {

  method: 'get',
  path: '/users?/approved-titles?',

  requireAuthentication: true,

  parameters: Joi.object().keys({

    include: Joi.array().items(
      Joi.string().valid('metadata', 'provenance'),
    ).single().default([]),

    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).max(100).default(25),

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

    const populateConditions = request.parameters.include.map((include) => {
      return {
        path: include,
        options: {
          sort: request.parameters.includeOrder[include],
        },
      }
    })

    return models.CodexTitle.find(conditions)
      .limit(request.parameters.limit)
      .skip(request.parameters.offset)
      .sort(request.parameters.order)
      .populate(populateConditions)

      // NOTE: applying privacy filters here is unnecessary as of 2018-04-30
      //  since approved addresses currently have the same privacy priveledges
      //  as the owner of a title, but this is a future-proofing measure just in
      //  case that business logic changes down the road
      .then((codexTitles) => {

        codexTitles.forEach((codexTitle) => {
          return codexTitle.applyPrivacyFilters(response.locals.userAddress)
        })

        return codexTitles

      })

  },

}
