import RestifyErrors from 'restify-errors'

import config from '../../config'
import models from '../../models'

export default {

  method: 'get',
  path: '/records?/:tokenId',

  handler(request, response) {

    const conditions = {
      _id: request.params.tokenId,
      ownerAddress: {
        $ne: config.zeroAddress,
      },
    }

    return models.CodexRecord.findOne(conditions)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new RestifyErrors.NotFoundError(`CodexRecord with tokenId ${request.params.tokenId} does not exist.`)
        }

        return codexRecord.setLocals(response.locals)

      })

  },

}
