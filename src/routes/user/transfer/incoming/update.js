import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../../models'

export default {

  method: 'put',
  path: '/users?/transfers?/incoming/:tokenId',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    isIgnored: Joi.boolean(),
  }).or(
    'isIgnored',
  ),

  handler(request, response) {

    const conditions = {
      _id: request.params.tokenId,
      approvedAddress: response.locals.userAddress,
    }

    return models.CodexRecord.findOne(conditions)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new RestifyErrors.NotFoundError(`CodexRecord with tokenId ${request.params.tokenId} does not exist.`)
        }

        Object.assign(codexRecord, request.parameters)

        codexRecord.setLocals(response.locals)

        return codexRecord.save()

      })

  },

}
