import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'get',
  path: '/titles?/:codexTitleId/metadata',

  handler(request, response) {

    // TODO: add permissions here

    return models.CodexTitle.findById(request.params.codexTitleId, 'metadata')
      .populate('metadata')
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with id ${request.params.codexTitleId} does not exist.`)
        }

        return codexTitle.metadata

      })

  },

}
