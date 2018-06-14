import RestifyErrors from 'restify-errors'

import config from '../../../config'
import models from '../../../models'
// import logger from '../../../services/logger'

export default {

  method: 'get',
  path: '/users?/giveaway/:giveawayId',

  requireAuthentication: true,

  handler(request, response) {

    return models.Giveaway.findById(request.params.giveawayId)
      .then((giveaway) => {

        if (!giveaway) {
          throw new RestifyErrors.NotFoundError(`Giveaway with giveawayId ${request.params.giveawayId} does not exist.`)
        }

        giveaway.numberOfEditionsRemaining -= 1

        return giveaway.save()

      })
      .then((giveaway) => {
        return models.User.findById(response.locals.userAddress)
          .then((user) => {

            if (user.giveawaysParticipatedIn && user.giveawaysParticipatedIn.length && user.giveawaysParticipatedIn.includes(giveaway.id)) {
              throw new RestifyErrors.ForbiddenError('You have already participated in this giveaway.')
            }

            return user
          })
          .then((user) => {

            return models.CodexRecordMetadata.findById(giveaway.metadata)
              .lean()
              .then((giveawayMetadata) => {

                // Deleting the temporary codexRecordTokenId because a real one will get provisioned after the token has been minted
                delete giveawayMetadata.codexRecordTokenId

                // Deleting the original metadata ID so a new one is provisioned for this new metadata document
                // This prevents any metadata documents relying on the same Giveaway metadata from being cleaned up if one gets orphaned
                delete giveawayMetadata._id

                const editionNumber = giveaway.numberOfEditions - giveaway.numberOfEditionsRemaining
                giveawayMetadata.name += ` (Edition ${editionNumber} of ${giveaway.numberOfEditions})`

                // Assign the new metadata to the user participating in the giveaway
                giveawayMetadata.creatorAddress = user.address

                const newCodexRecordMetadata = new models.CodexRecordMetadata(giveawayMetadata)

                return newCodexRecordMetadata.save()
              })
              .then((codexRecordMetadata) => {

                const txData = codexRecordMetadata.generateMintTransactionData()
                const newTransactionData = {
                  status: 'created',
                  type: 'giveaway-mint',
                  tx: {
                    value: 0,
                    gasPrice: config.faucet.gasPrice,
                    gasLimit: config.faucet.gasLimit,
                    to: txData.contractAddress,
                    from: config.blockchain.signerPublicAddress,
                    data: txData.mintTransactionData,
                  },
                }

                return new models.Transaction(newTransactionData).save()
                  .then(() => {

                    user.giveawaysParticipatedIn.push(giveaway)

                    return user.save()
                  })
              })
          })
      })
  },

}
