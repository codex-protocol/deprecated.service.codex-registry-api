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
    //  one week
    const findOrphanedMetadatumConditions = {
      codexTitleTokenId: null,
      createdAt: {
        $lte: now - config.orphanedMetadata.expiryThreshold,
      },
    }

    return models.CodexTitleMetadata
      .find(findOrphanedMetadatumConditions)
      .populate('mainImage')
      .populate('images')

      .then((metadatum) => {

        if (metadatum.length > 0) {
          logger.verbose(`[${this.name}]`, `found ${metadatum.length} metadata(um) to remove`)
        }

        return this.getJob()
          .then((job) => {

            return Bluebird.map(metadatum, (metadata) => {

              logger.verbose(`removing metadata with id ${metadata.id} and associated file records`)

              const removeMetadataImagesConditions = {
                _id: {
                  $in: [
                    metadata.mainImage,
                    ...metadata.images,
                  ],
                },
              }

              return models.CodexTitleFile
                .remove(removeMetadataImagesConditions)
                .then(() => {
                  return metadata.remove()
                })

            })

          })

      })

  },

}
