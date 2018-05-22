import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../../models'

export default {

  method: 'put',
  path: '/users?/transfers?/incoming/:tokenId',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    isIgnored: Joi.boolean(),
  }).or(
    'isIgnored',
  ),

  handler(request, response) {

    const conditions = {
      _id: request.params.tokenId,
      approvedAddress: response.locals.userAddress,
    }

    return models.CodexTitle.findOne(conditions)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with tokenId ${request.params.tokenId} does not exist.`)
        }

        Object.assign(codexTitle, request.parameters)

        return codexTitle.save()

      })

      .then((codexTitle) => {

        codexTitle.applyPrivacyFilters(response.locals.userAddress)

        return codexTitle

      })

  },

}
