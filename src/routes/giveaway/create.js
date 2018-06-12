import ethUtil from 'ethereumjs-util'

import models from '../../models'

export default {

  method: 'post',
  path: '/giveaways?',

  requireAuthentication: true,

  handler(request, response) {

    return models.CodexRecordFile.findById('5b1f1f456b39260fbcc5ed7f')
      .lean()
      .then((leanMainImage) => {
        delete leanMainImage._id

        return new models.CodexRecordFile(leanMainImage).save()
      })
      .then((giveawayMainImage) => {
        const giveawayMetadata = {
          creatorAddress: ethUtil.zeroAddress(),

          // placeholder so it doesn't get cleaned up by the remove-orphans job
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
          metadata: codexRecordMetadata,
        }

        return models.Giveaway.create(newGiveawayData)
      })

  },

}
