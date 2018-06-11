import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../../models'
import SocketService from '../../../../services/socket'

export default {

  method: 'put',
  path: '/users?/records?/:tokenId/whitelisted-address(es)?',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    addresses: Joi.array().items(
      Joi.string().regex(/^0x[0-9a-f]{40}$/i, 'ethereum address').lowercase(),
    ).unique().required(),
  }),

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

        const newWhitelistedAddresses = request.parameters.addresses.filter((address) => {
          return address !== response.locals.userAddress && !codexRecord.whitelistedAddresses.includes(address)
        })

        codexRecord.whitelistedAddresses = codexRecord.whitelistedAddresses.concat(newWhitelistedAddresses)

        return codexRecord.save()
          .then(() => {

            newWhitelistedAddresses.forEach((address) => {
              const whitelistedAddressResponse = codexRecord.setLocals({ userAddress: address }).toJSON()
              SocketService.emitToAddress(address, 'address-whitelisted', whitelistedAddressResponse)
            })

            // we need to set the userAddress back to the owner's address after
            //  setting it in the loop above, otherwise whitelistedAddresses
            //  will be stripped because it's owner only
            codexRecord.setLocals(response.locals)

            return codexRecord.whitelistedAddresses

          })

      })

  },

}
