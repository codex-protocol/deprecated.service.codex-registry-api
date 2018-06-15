import RestifyErrors from 'restify-errors'

import config from '../../../config'
import models from '../../../models'

export default {

  method: 'post',
  path: '/users?/giveaways?/:giveawayId',

  requireAuthentication: true,

  handler(request, response) {

    return models.Giveaway.findById(request.params.giveawayId)
      .then((giveaway) => {

        if (!giveaway) {
          throw new RestifyErrors.NotFoundError(`Giveaway with giveawayId ${request.params.giveawayId} does not exist.`)
        }

        if (giveaway.numberOfEditionsRemaining <= 0) {
          throw new RestifyErrors.ForbiddenError(`Giveaway with giveawayId ${request.params.giveawayId} has no more editions left.`)
        }

        return giveaway

      })
      .then((giveaway) => {

        return models.User.findById(response.locals.userAddress)
          .then((user) => {

            if (user.giveawaysParticipatedIn.includes(giveaway.id)) {
              throw new RestifyErrors.ForbiddenError('You have already participated in this giveaway.')
            }

            return user

          })
          .then((user) => {

            const newCodexRecordFileData = giveaway.editionDetails.mainImage

            return new models.CodexRecordFile(newCodexRecordFileData.toObject()).save()
              .then((codexRecordFile) => {

                const editionNumber = 1 + (giveaway.numberOfEditions - giveaway.numberOfEditionsRemaining)

                const newCodexRecordMetadataData = {
                  name: `${giveaway.editionDetails.name} (Edition ${editionNumber} of ${giveaway.numberOfEditions})`,
                  description: giveaway.editionDetails.description,
                  creatorAddress: user.address,
                  mainImage: codexRecordFile,
                }

                return new models.CodexRecordMetadata(newCodexRecordMetadataData).save()
                  .then((codexRecordMetadata) => {

                    const mintTransactionData = codexRecordMetadata.generateMintTransactionData()

                    const newTransactionData = {
                      type: 'giveaway-mint',
                      status: 'created',
                      tx: {
                        value: 0,
                        gasPrice: config.blockchain.gasPrice,
                        gasLimit: config.blockchain.gasLimit,
                        to: mintTransactionData.contractAddress,
                        from: config.blockchain.signerPublicAddress,
                        data: mintTransactionData.mintTransactionData,
                      },
                    }

                    return new models.Transaction(newTransactionData).save()
                      .then(() => {
                        giveaway.numberOfEditionsRemaining -= 1
                        return giveaway.save()
                      })
                      .then(() => {
                        user.giveawaysParticipatedIn.push(giveaway.id)
                        return user.save()
                      })
                      .then(() => {
                        return codexRecordMetadata
                      })

                  })
              })

          })
      })
  },

}
