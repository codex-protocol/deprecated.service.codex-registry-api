import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../models'
import SocketService from '../../../services/socket'

export default {

  method: 'put',
  path: '/users?/records?/:tokenId',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    isPrivate: Joi.boolean(),
    whitelistedAddresses: Joi.array().items(
      Joi.string().regex(/^0x[0-9a-f]{40}$/i, 'ethereum address').lowercase(),
    ).unique(),
  }).or(
    'isPrivate',
    'whitelistedAddresses',
  ),

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

        let newWhitelistedAddresses = []

        if (request.parameters.whitelistedAddresses) {
          newWhitelistedAddresses = request.parameters.whitelistedAddresses.filter((address) => {
            return address !== response.locals.userAddress && !codexRecord.whitelistedAddresses.includes(address)
          })
        }

        Object.assign(codexRecord, request.parameters)

        return codexRecord.save()
          .then(() => {

            newWhitelistedAddresses.forEach((address) => {
              const whitelistedAddressResponse = codexRecord.setLocals({ userAddress: address }).toJSON()
              SocketService.emitToAddress(address, 'address-whitelisted', whitelistedAddressResponse)
            })

            // we need to set the userAddress back to the owner's address after
            //  setting it in the loop above, otherwise non-owner fields will be
            //  stripped
            codexRecord.setLocals(response.locals)

            return codexRecord

          })

      })

  },

}
