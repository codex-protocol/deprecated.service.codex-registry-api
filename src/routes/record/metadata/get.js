import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'get',
  path: '/records?/:tokenId/metadata',

  handler(request, response) {

    // @NOTE: we must retrieve the entire CodexRecord record (and not just the
    //  metadata even though that's all we need here) because the toJSON()
    //  method needs other values to determine if this user should be allowed to
    //  view the metadata
    return models.CodexRecord.findById(request.params.tokenId)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new RestifyErrors.NotFoundError(`CodexRecord with tokenId ${request.params.tokenId} does not exist.`)
        }

        return codexRecord
          .setLocals(response.locals)
          .toJSON()
          .metadata

      })

  },

}
