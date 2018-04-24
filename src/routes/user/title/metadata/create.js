import Joi from 'joi'

import models from '../../../../models'

export default {

  method: 'post',
  path: '/users?/titles?/metadata',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string(),
  }),

  handler(request, response) {

    // TODO: add image support
    const newCodexTitleData = Object.assign({
      creatorAddress: response.locals.userAddress,
    }, request.parameters)

    return new models.CodexTitleMetadata(newCodexTitleData).save()

  },

}
