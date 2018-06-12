import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../../models'

export default {

  method: 'post',
  path: '/users?/records?/:tokenId/whitelisted-address(es)?',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    address: Joi.string().regex(/^0x[0-9a-f]{40}$/i, 'ethereum address').lowercase(),
  }),

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

        if (codexRecord.whitelistedAddresses.includes(request.parameters.address)) {
          return codexRecord
        }

        codexRecord.whitelistedAddresses.push(request.parameters.address)

        return codexRecord.save()

      })
      .then((codexRecord) => {
        return codexRecord.whitelistedAddresses
      })

  },

}
