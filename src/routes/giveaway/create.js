import ethUtil from 'ethereumjs-util'

import models from '../../models'

export default {

  method: 'post',
  path: '/giveaways?',

  requireAuthentication: true,

  handler(request, response) {

    // @TODO: Create a scalable way to do this in the future w/o hardcoding
    // @TODO: Update w/ the giveaway art
    return models.CodexRecordFile.findById('5b1fdc11b9a435238854f448')
      .lean()
      .then((leanMainImage) => {
        delete leanMainImage._id

        return new models.CodexRecordFile(leanMainImage).save()
      })
      .then((giveawayMainImage) => {
        const giveawayMetadata = {
          creatorAddress: ethUtil.zeroAddress(),

          // Creating a placeholder codexRecordTokenId so that it doesn't get cleaned up by the orphan job
          // @TODO: Use some Mongo ObjectId instead so new giveaways can be created in the future
          codexRecordTokenId: 'giveaway',

          name: 'Codex Original Art',
          description: 'Designed by Seb',
          mainImage: giveawayMainImage,
        }

        const newCodexRecordMetadata = new models.CodexRecordMetadata(giveawayMetadata)

        return newCodexRecordMetadata.save()
      })
      .then((codexRecordMetadata) => {
        const newGiveawayData = {
          name: 'New User Giveaway!',
          numberOfEditions: 1000,
          numberOfEditionsRemaining: 1000,
          metadata: codexRecordMetadata,
        }

        return models.Giveaway.create(newGiveawayData)
      })

  },

}
