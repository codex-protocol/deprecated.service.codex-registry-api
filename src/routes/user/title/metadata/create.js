import Joi from 'joi'

import models from '../../../../models'

export default {

  method: 'post',
  path: '/users?/titles?/metadata',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    description: Joi.string(),
    name: Joi.string().required(),
    files: Joi.array().items(
      Joi.object().keys({
        _id: Joi.string().regex(/^[0-9a-f]{24}$/i).required(),
      }).rename('id', '_id').required(),
    ).single().default([]),
  }),

  handler(request, response) {

    const newCodexTitleData = Object.assign({
      creatorAddress: response.locals.userAddress,
    }, request.parameters)

    const newCodexTitle = new models.CodexTitleMetadata(newCodexTitleData)

    return newCodexTitle.save()
      .then(() => {

        if (newCodexTitle.files.length === 0) {
          return newCodexTitle
        }

        return newCodexTitle.populate('files').execPopulate()

      })

  },

}
