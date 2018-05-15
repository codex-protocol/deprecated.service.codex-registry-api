import RestifyErrors from 'restify-errors'

import models from '../../../../models'

export default {

  method: 'get',
  path: '/users?/titles?/:tokenId/whitelisted-address(es)?',

  requireAuthentication: true,

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

        return codexTitle.whitelistedAddresses

      })

  },

}
