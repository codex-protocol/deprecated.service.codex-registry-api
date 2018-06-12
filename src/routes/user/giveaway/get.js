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

        return giveaway

      })
      .then((giveaway) => {
        return models.User.findById(response.locals.userAddress)
          .then((user) => {

            if (user.giveawaysParticipatedIn && user.giveawaysParticipatedIn.length && user.giveawaysParticipatedIn.includes[giveaway.id]) {
              throw new RestifyErrors.ForbiddenError('You have already participated in this give away.')
            }

            return user
          })
          .then((user) => {

            return models.CodexRecordMetadata.findById(giveaway.metadata)
              .lean()
              .then((giveawayMetadata) => {
                // const newCodexRecordMetadataData = Object.assign({
                //   creatorAddress: user.address,
                // }, giveawayMetadata)

                delete giveawayMetadata.codexRecordTokenId
                delete giveawayMetadata._id
                giveawayMetadata.creatorAddress = user.address

                const newCodexRecordMetadata = new models.CodexRecordMetadata(giveawayMetadata)

                return newCodexRecordMetadata.save()
                  .then(() => {
                    return newCodexRecordMetadata
                      .populate('mainImage images files') // @TODO: move this to a post-save hook (but check that they haven't been populated already)
                      .execPopulate()
                  })
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
