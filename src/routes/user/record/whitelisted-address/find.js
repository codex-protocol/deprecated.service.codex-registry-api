import RestifyErrors from 'restify-errors'

import models from '../../../../models'

export default {

  method: 'get',
  path: '/users?/records?/:tokenId/whitelisted-address(es)?',

  requireAuthentication: true,

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

        return codexRecord.whitelistedAddresses

      })

  },

}
