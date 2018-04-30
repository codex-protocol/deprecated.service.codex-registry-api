import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'get',
  path: '/titles?/:tokenId/metadata',

  handler(request, response) {

    // NOTE: we must retrieve the entire CodexTitle record (and not just the
    //  metadata even though that's all we need here) because the
    //  applyPrivacyFilters() instance method needs other values to determine if
    //  this user should be allowed to view the metadata
    return models.CodexTitle.findById(request.params.tokenId)
      .populate('metadata')
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with tokenId ${request.params.tokenId} does not exist.`)
        }

        codexTitle.applyPrivacyFilters(response.locals.userAddress)

        // TODO: return a 403 error here insted?
        return codexTitle.populated('metadata') ? codexTitle.metadata : null

      })

  },

}
