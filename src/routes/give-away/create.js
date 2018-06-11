import models from '../../models'

export default {

  method: 'post',
  path: '/giveaways?',

  requireAuthentication: true,

  handler(request, response) {

    // @TODO: This is getting claned up by the orphan job
    return models.CodexRecordFile.findById('5b1ef57078d795dc2bae3560')
      .lean()
      .then((leanMainImage) => {
        delete leanMainImage._id

        return models.CodexRecordFile.create(leanMainImage)
      })
      .then((giveawayMainImage) => {
        const giveawayMetadata = {
          creatorAddress: '0x0', // placeholder because it's required
          codexRecordTokenId: 'giveaway', // placeholder so it doesn't get cleaned up by the remove-orphans job

          name: 'Codex Original Art',
          description: 'Designed by Seb',
          mainImage: giveawayMainImage,
        }

        const newCodexRecordMetadata = new models.CodexRecordMetadata(giveawayMetadata)

        return newCodexRecordMetadata.save()
          .then(() => {
            return newCodexRecordMetadata
              .populate('mainImage images files') // TODO: move this to a post-save hook (but check that they haven't been populated already)
              .execPopulate()
          })
      })
      .then((codexRecordMetadata) => {
        const giveawayData = {
          name: 'New User Giveaway!',
          numberOfEditions: 1000,
          metadata: codexRecordMetadata,
        }

        return models.Giveaway.create(giveawayData)
      })

  },

}
