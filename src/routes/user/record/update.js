import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'put',
  path: '/users?/records?/:tokenId',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    isPrivate: Joi.boolean(),
    whitelistedAddresses: Joi.array().items(
      Joi.string().regex(/^0x[0-9a-f]{40}$/i, 'ethereum address').lowercase(),
    ).unique(),
  }).or(
    'isPrivate',
    'whitelistedAddresses',
  ),

  handler(request, response) {

    const conditions = {
      _id: request.params.tokenId,
      ownerAddress: response.locals.userAddress,
    }

    return models.CodexRecord.findOne(conditions)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new RestifyErrors.NotFoundError(`CodexRecord with tokenId ${request.params.tokenId} does not exist.`)
        }

        Object.assign(codexRecord, request.parameters)

        codexRecord.whitelistedAddresses = request.parameters.whitelistedAddresses.filter((whitelistedAddress) => {
          return whitelistedAddress !== response.locals.userAddress
        })

        return codexRecord.save()

      })

  },

}
