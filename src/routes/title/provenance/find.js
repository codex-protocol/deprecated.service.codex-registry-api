import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'get',
  path: '/titles?/:tokenId/provenance',

  handler(request, response) {

    return models.CodexTitle.findById(request.params.tokenId, 'provenance')
      .populate('provenance')
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with tokenId ${request.params.tokenId} does not exist.`)
        }

        return codexTitle.provenance

      })

  },

}
