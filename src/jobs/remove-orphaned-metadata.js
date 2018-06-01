import Bluebird from 'bluebird'

import config from '../config'
import models from '../models'
import logger from '../services/logger'

export default {

  name: 'remove-orphaned-metadata',
  frequency: config.orphanedMetadata.jobFrequency,

  setup() {

  },

  getJob() {
    return models.Job.findOne({ name: this.name })
      .then((job) => {

        if (job) {
          return job
        }

        logger.verbose(`[${this.name}] no job found, creating a new one`)

        return models.Job.create({
          name: this.name,
          data: {},
        })

      })
  },

  execute() {

    const now = Date.now()

    // find all metadata records that have not been tied to a CodexTitle after
    //  the specified expiry threshold
    const findOrphanedMetadataConditions = {
      codexTitleTokenId: null,
      createdAt: {
        $lte: now - config.orphanedMetadata.expiryThreshold,
      },
    }

    return models.CodexTitleMetadata
      .find(findOrphanedMetadataConditions)
      .then((metadata) => {

        if (metadata.length === 0) return null

        logger.verbose(`[${this.name}]`, `found ${metadata.length} metadata(um) to remove`)

        return this.getJob()
          .then((job) => {

            return Bluebird.map(metadata, (metadatum) => {

              const fileIds = [
                metadatum.mainImage.id,
                ...metadatum.files.map((file) => { return file.id }),
                ...metadatum.images.map((image) => { return image.id }),
              ]

              logger.verbose(`removing metadatum with id ${metadatum.id} and ${fileIds.length} associated file records`)

              const removeMetadataFilesConditions = { _id: { $in: fileIds } }

              return models.CodexTitleFile
                .remove(removeMetadataFilesConditions)
                .then(() => {
                  // TODO: remove old pendingUpdates here?
                  return metadatum.remove()
                })

            })

          })

      })

  },

}
