import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../../models'

export default {

  method: 'put',
  path: '/users?/titles?/:tokenId/whitelisted-address(es)?',

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

    return models.CodexTitle.findOne(conditions)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with tokenId ${request.params.tokenId} does not exist.`)
        }

        codexTitle.whitelistedAddresses = request.parameters.addresses.filter((address) => {
          return address !== response.locals.userAddress
        })

        return codexTitle.save()

      })
      .then((codexTitle) => {
        return codexTitle.whitelistedAddresses
      })

  },

}
