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

    // find all metadata records that have not been tied to a CodexRecord after
    //  the specified expiry threshold
    const findOrphanedMetadataConditions = {
      codexRecordTokenId: null,
      createdAt: {
        $lte: now - config.orphanedMetadata.expiryThreshold,
      },
    }

    return models.CodexRecordMetadata
      .find(findOrphanedMetadataConditions)
      .then((metadata) => {

        if (metadata.length === 0) return null

        logger.verbose(`[${this.name}]`, `found ${metadata.length} metadata(um) to remove`)

        return this.getJob()
          .then((job) => {

            // alright, the code below is a little intense, but basically all
            //  it's doing is looking up the images assiciated with the metadata
            //  to delete, and checking to see if there are any other records
            //  that have those images assigned to them. if the images aren't
            //  referenced anywhere else, we delete them.
            //
            // @TODO: maybe this is entirely unnecessary??

            const fileIdsToSave = []
            const metadataIdsToRemove = []
            const potentialFileIdsToRemove = []
            const metadataPendingUpdateIdsToRemove = []

            return Bluebird
              .map(metadata, (metadatum) => {

                const metadatumFileIds = [
                  ...metadatum.files.map((file) => { return file.id }),
                  ...metadatum.images.map((image) => { return image.id }),
                ]

                if (metadatum.mainImage && metadatum.mainImage.id) {
                  metadatumFileIds.push(metadatum.mainImage.id)
                }

                metadataIdsToRemove.push(metadatum.id)
                potentialFileIdsToRemove.push(...metadatumFileIds)
                metadataPendingUpdateIdsToRemove.push(...metadatum.pendingUpdates.map((pendingUpdate) => { return pendingUpdate.id }))

              })
              .then(() => {

                const promiseProps = {
                  otherMetadata: Bluebird.resolve([]),
                  otherModifiedEvents: Bluebird.resolve([]),
                  otherPendingUpdates: Bluebird.resolve([]),
                }

                if (potentialFileIdsToRemove.length > 0) {
                  promiseProps.otherMetadata = models.CodexRecordMetadata.find({
                    _id: { $nin: metadataIdsToRemove },
                    $or: [
                      { files: { $in: potentialFileIdsToRemove } },
                      { images: { $in: potentialFileIdsToRemove } },
                      { mainImage: { $in: potentialFileIdsToRemove } },
                    ],
                  })

                  promiseProps.otherModifiedEvents = models.CodexRecordModifiedEvent.find({
                    providerMetadataId: { $nin: metadataIdsToRemove },
                    $or: [
                      { newFiles: { $in: potentialFileIdsToRemove } },
                      { oldFiles: { $in: potentialFileIdsToRemove } },
                      { newImages: { $in: potentialFileIdsToRemove } },
                      { oldImages: { $in: potentialFileIdsToRemove } },
                      { newMainImage: { $in: potentialFileIdsToRemove } },
                      { oldMainImage: { $in: potentialFileIdsToRemove } },
                    ],
                  })
                }

                if (metadataPendingUpdateIdsToRemove.length > 0) {
                  promiseProps.otherPendingUpdates = models.CodexRecordMetadataPendingUpdate.find({
                    _id: { $nin: metadataPendingUpdateIdsToRemove },
                    $or: [
                      { files: { $in: potentialFileIdsToRemove } },
                      { images: { $in: potentialFileIdsToRemove } },
                      { mainImage: { $in: potentialFileIdsToRemove } },
                    ],
                  })
                }

                return Bluebird
                  .props(promiseProps)
                  .then(({ otherMetadata, otherModifiedEvents, otherPendingUpdates }) => {

                    otherMetadata.forEach((otherMetadatum) => {
                      fileIdsToSave.push(...otherMetadatum.files.map((file) => { return file.id }))
                      fileIdsToSave.push(...otherMetadatum.images.map((image) => { return image.id }))
                      if (otherMetadatum.mainImage) fileIdsToSave.push(otherMetadatum.mainImage.id)
                    })

                    otherModifiedEvents.forEach((otherModifiedEvent) => {
                      fileIdsToSave.push(...otherModifiedEvent.newFiles.map((file) => { return file.id }))
                      fileIdsToSave.push(...otherModifiedEvent.oldFiles.map((file) => { return file.id }))
                      fileIdsToSave.push(...otherModifiedEvent.newImages.map((image) => { return image.id }))
                      fileIdsToSave.push(...otherModifiedEvent.oldImages.map((image) => { return image.id }))
                      if (otherModifiedEvent.oldMainImage) fileIdsToSave.push(otherModifiedEvent.oldMainImage.id)
                      if (otherModifiedEvent.newMainImage) fileIdsToSave.push(otherModifiedEvent.newMainImage.id)
                    })

                    otherPendingUpdates.forEach((otherPendingUpdate) => {
                      fileIdsToSave.push(...otherPendingUpdate.files.map((file) => { return file.id }))
                      fileIdsToSave.push(...otherPendingUpdate.images.map((image) => { return image.id }))
                      if (otherPendingUpdate.mainImage) fileIdsToSave.push(otherPendingUpdate.mainImage.id)
                    })

                  })
              })
              .then(() => {

                const fileIdsToRemove = potentialFileIdsToRemove.filter((potentialFileIdToRemove) => {
                  return !fileIdsToSave.includes(potentialFileIdToRemove)
                })

                logger.verbose(`[${this.name}]`, `removing ${metadataIdsToRemove.length} metadata records and ${fileIdsToRemove.length} associated file records`)
                logger.verbose(`[${this.name}]`, 'metadataIdsToRemove:', metadataIdsToRemove)
                logger.verbose(`[${this.name}]`, 'fileIdsToRemove:', fileIdsToRemove)

                const promises = [
                  models.CodexRecordMetadata.remove({ _id: { $in: metadataIdsToRemove } }),
                ]

                if (fileIdsToRemove.length > 0) {
                  promises.push(models.CodexRecordFile.remove({ _id: { $in: fileIdsToRemove } }))
                }

                // @TODO: remove old pendingUpdates here too?
                return Bluebird.all(promises)

              })
              .then(() => {
                // @NOTE: for some reason, returning the CommandResult objects
                //  that mongoose resolves Model.remove() calls with makes
                //  Agenda flip a shit and throw an error about cyclic
                //  dependencies... so let's just return something else...
                return null
              })

          })

      })

  },

}
