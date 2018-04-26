import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'get',
  path: '/titles?/:tokenId/metadata',

  handler(request, response) {

    // TODO: add permissions here

    return models.CodexTitle.findById(request.params.tokenId, 'metadata')
      .populate('metadata')
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with tokenId ${request.params.tokenId} does not exist.`)
        }

        return codexTitle.metadata

      })

  },

}
