import RestifyErrors from 'restify-errors'

import models from '../../models'

export default {

  method: 'get',
  path: '/records?/:tokenId',

  handler(request, response) {

    return models.CodexRecord.findById(request.params.tokenId)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new RestifyErrors.NotFoundError(`CodexRecord with tokenId ${request.params.tokenId} does not exist.`)
        }

        return codexRecord.setLocals(response.locals)

      })

  },

}
