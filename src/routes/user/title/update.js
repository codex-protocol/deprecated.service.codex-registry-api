import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'put',
  path: '/users?/titles?/:tokenId',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    isPrivate: Joi.boolean(),
  }).or(
    'isPrivate',
  ),

  handler(request, response) {

    const conditions = {
      _id: request.params.tokenId,
      ownerAddress: response.locals.userAddress,
    }

    return models.CodexTitle.findOne(conditions)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with tokenId ${request.params.tokenId} does not exist.`)
        }

        codexTitle.isPrivate = request.parameters.isPrivate

        return codexTitle.save()

      })

  },

}
