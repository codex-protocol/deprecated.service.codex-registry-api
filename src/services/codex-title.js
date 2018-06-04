import ethUtil from 'ethereumjs-util'
import { contracts } from '@codex-protocol/ethereum-service'

import logger from './logger'
import models from '../models'

const zeroAddress = ethUtil.zeroAddress()

export default {

  // this links a CodexTitle record to a CodexTitleMetadata record based on the
  //  info emitted by the Minted event
  confirmMint: (tokenId, providerId, providerMetadataId, transactionHash) => {

    return models.CodexTitle.findById(tokenId)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new Error(`Could not confirm CodexTitle with tokenId ${tokenId} because it does not exist.`)
        }

        codexTitle.providerMetadataId = providerMetadataId
        codexTitle.providerId = providerId

        // TODO: sort out proper provider ID functionality
        if (codexTitle.providerId !== '1') {
          return codexTitle
        }

        return models.CodexTitleMetadata.findById(providerMetadataId)
          .then((codexTitleMetadata) => {

            if (!codexTitleMetadata) {
              throw new Error(`Could not confirm CodexTitle with tokenId ${codexTitle.tokenId} because metadata with id ${providerMetadataId} does not exit.`)
            }

            codexTitleMetadata.codexTitleTokenId = codexTitle.tokenId

            // TODO: maybe verify hases here? e.g.:
            // codexTitleMetadata.nameHash === codexTitle.nameHash
            // codexTitleMetadata.descriptionHash === codexTitle.descriptionHash

            return codexTitleMetadata.save()
              .then(() => {
                codexTitle.metadata = codexTitleMetadata
                return codexTitle
              })
          })
      })

      .then((codexTitle) => {
        return codexTitle.save()
      })

  },

  create: (ownerAddress, tokenId, transactionHash) => {

    return contracts.CodexTitle.methods.getTokenById(tokenId).call()
      .then(({ nameHash, descriptionHash, fileHashes }) => {

        const newCodexTitleProvenanceEventData = {
          newOwnerAddress: ownerAddress,
          oldOwnerAddress: zeroAddress,
          codexTitleTokenId: tokenId,
          transactionHash,
          type: 'create',
        }

        return new models.CodexTitleProvenanceEvent(newCodexTitleProvenanceEventData).save()
          .then((newCodexTitleProvenanceEvent) => {

            const newCodexTitleData = {
              provenance: [newCodexTitleProvenanceEvent],
              descriptionHash,
              ownerAddress,
              fileHashes,
              nameHash,
              tokenId,
            }

            return new models.CodexTitle(newCodexTitleData).save()

          })

      })

  },

  modify: (
    modifierAddress,
    tokenId,
    newNameHash,
    newDescriptionHash,
    newFileHashes,
    providerId,
    providerMetadataId,
    transactionHash,
  ) => {

    const findCodexTitleConditions = {
      providerId,
      _id: tokenId,
      providerMetadataId,
    }

    const newCodexTitleModifiedEvent = new models.CodexTitleModifiedEvent({
      newDescriptionHash,
      newFileHashes,
      newNameHash,

      oldDescriptionHash: null, // set below
      oldFileHashes: null, // set below
      oldNameHash: null, // set below

      providerMetadataId,
      modifierAddress,
      providerId,

    })

    return models.CodexTitle.findOne(findCodexTitleConditions)
      .populate('metadata')
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new Error(`Could not modify CodexTitle with tokenId ${tokenId} because it does not exist.`)
        }

        newCodexTitleModifiedEvent.oldNameHash = codexTitle.nameHash
        newCodexTitleModifiedEvent.oldFileHashes = codexTitle.fileHashes
        newCodexTitleModifiedEvent.oldDescriptionHash = codexTitle.descriptionHash

        return newCodexTitleModifiedEvent.save()
          .then(() => {

            const newCodexTitleProvenanceEventData = {
              codexTitleTokenId: tokenId,
              type: 'modified',
              transactionHash,

              // these aren't really applicable to Modified events, so we'll just
              //  set them to the current ownerAddress ¯\_(ツ)_/¯
              oldOwnerAddress: codexTitle.ownerAddress,
              newOwnerAddress: codexTitle.ownerAddress,

              codexTitleModifiedEvent: newCodexTitleModifiedEvent,
            }

            return new models.CodexTitleProvenanceEvent(newCodexTitleProvenanceEventData).save()
              .then((newCodexTitleProvenanceEvent) => {

                codexTitle.nameHash = newNameHash
                codexTitle.fileHashes = newFileHashes
                codexTitle.descriptionHash = newDescriptionHash

                codexTitle.provenance.push(newCodexTitleProvenanceEvent)

                return codexTitle.save()

              })
          })
      })

      .then((codexTitle) => {

        // TODO: sort out proper provider ID functionality
        if (codexTitle.providerId !== '1') {
          return codexTitle
        }

        if (!codexTitle.metadata) {
          throw new Error(`Could not modify CodexTitle with tokenId ${codexTitle.tokenId} because metadata with id ${providerMetadataId} does not exit.`)
        }

        const pendingUpdateToCommitIndex = codexTitle.metadata.pendingUpdates.findIndex((pendingUpdate) => {

          if (
            newNameHash !== pendingUpdate.nameHash ||
            newDescriptionHash !== pendingUpdate.descriptionHash ||
            newFileHashes.length !== pendingUpdate.fileHashes.length
          ) {
            return false
          }

          // NOTE: pendingUpdate.fileHashes is already sorted as part of the
          //  virtual getter
          newFileHashes.sort()

          return pendingUpdate.fileHashes.every((fileHash, index) => {
            return fileHash === newFileHashes[index]
          })
        })

        if (pendingUpdateToCommitIndex === -1) {
          throw new Error(`Could not modify CodexTitle with tokenId ${codexTitle.tokenId} because metadata with id ${providerMetadataId} has no matching pending updates.`)
        }

        const [pendingUpdateToCommit] = codexTitle.metadata.pendingUpdates.splice(pendingUpdateToCommitIndex, 1)

        // TODO: maybe verify hases here? e.g.:
        // pendingUpdateToCommit.nameHash === nameHash
        // pendingUpdateToCommit.descriptionHash === descriptionHash

        newCodexTitleModifiedEvent.oldName = codexTitle.metadata.name
        newCodexTitleModifiedEvent.oldFiles = codexTitle.metadata.files
        newCodexTitleModifiedEvent.oldImages = codexTitle.metadata.images
        newCodexTitleModifiedEvent.oldMainImage = codexTitle.metadata.mainImage
        newCodexTitleModifiedEvent.oldDescription = codexTitle.metadata.description

        newCodexTitleModifiedEvent.newName = pendingUpdateToCommit.name
        newCodexTitleModifiedEvent.newFiles = pendingUpdateToCommit.files
        newCodexTitleModifiedEvent.newImages = pendingUpdateToCommit.images
        newCodexTitleModifiedEvent.newMainImage = pendingUpdateToCommit.mainImage
        newCodexTitleModifiedEvent.newDescription = pendingUpdateToCommit.description

        return newCodexTitleModifiedEvent.save()
          .then(() => {

            codexTitle.metadata.name = pendingUpdateToCommit.name
            codexTitle.metadata.files = pendingUpdateToCommit.files
            codexTitle.metadata.images = pendingUpdateToCommit.images
            codexTitle.metadata.nameHash = pendingUpdateToCommit.nameHash
            codexTitle.metadata.mainImage = pendingUpdateToCommit.mainImage
            codexTitle.metadata.description = pendingUpdateToCommit.description
            codexTitle.metadata.descriptionHash = pendingUpdateToCommit.descriptionHash

            return codexTitle.metadata.save()

          })
          .then(() => {
            return pendingUpdateToCommit.remove()
          })
      })

  },

  transfer: (oldOwnerAddress, newOwnerAddress, tokenId, transactionHash) => {

    return models.CodexTitle.findById(tokenId)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new Error(`Could not transfer CodexTitle with tokenId ${tokenId} because it does not exist.`)
        }

        const newCodexTitleProvenanceEventData = {
          codexTitleTokenId: tokenId,
          oldOwnerAddress,
          newOwnerAddress,
          transactionHash,
          type: 'transfer',
        }

        return new models.CodexTitleProvenanceEvent(newCodexTitleProvenanceEventData).save()
          .then((newCodexTitleProvenanceEvent) => {

            codexTitle.provenance.push(newCodexTitleProvenanceEvent)
            codexTitle.ownerAddress = newOwnerAddress
            codexTitle.whitelistedAddresses = []
            codexTitle.approvedAddress = null
            codexTitle.isIgnored = false
            codexTitle.isPrivate = true

            return codexTitle.save()

          })

      })

  },

  destroy: (ownerAddress, tokenId, transactionHash) => {

    return models.CodexTitle.findById(tokenId)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new Error(`Could not destroy CodexTitle with tokenId ${tokenId} because it does not exist.`)
        }

        const newCodexTitleProvenanceEventData = {
          oldOwnerAddress: ownerAddress,
          newOwnerAddress: zeroAddress,
          codexTitleTokenId: tokenId,
          transactionHash,
          type: 'destroy',
        }

        return new models.CodexTitleProvenanceEvent(newCodexTitleProvenanceEventData).save()
          .then((newCodexTitleProvenanceEvent) => {

            codexTitle.provenance.push(newCodexTitleProvenanceEvent)
            codexTitle.ownerAddress = zeroAddress

            return codexTitle.save()

          })

      })

  },

  approveAddress: (ownerAddress, approvedAddress, tokenId, transactionHash) => {

    return models.CodexTitle.findById(tokenId)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new Error(`Could not update approved address for CodexTitle with tokenId ${tokenId} because it does not exist.`)
        }

        codexTitle.approvedAddress = approvedAddress
        codexTitle.isIgnored = false

        return codexTitle.save()

      })

  },

  approveOperator: (ownerAddress, operatorAddress, isApproved, transactionHash) => {
    // TODO: implement approveAll functionality here
    logger.debug('codexTitleService.approveAll() called', { ownerAddress, operatorAddress, isApproved })
  },

}
