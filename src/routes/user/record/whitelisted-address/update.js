import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../../models'

export default {

  method: 'put',
  path: '/users?/records?/:tokenId/whitelisted-address(es)?',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    addresses: Joi.array().items(
      Joi.string().regex(/^0x[0-9a-f]{40}$/i, 'ethereum address').lowercase(),
    ).unique().required(),
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

        codexRecord.whitelistedAddresses = request.parameters.addresses.filter((address) => {
          return address !== response.locals.userAddress
        })

        return codexRecord.save()

      })
      .then((codexRecord) => {
        return codexRecord.whitelistedAddresses
      })

  },

}
