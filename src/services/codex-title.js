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

        const newCodexTitleTransferEventData = {
          newOwnerAddress: ownerAddress,
          oldOwnerAddress: zeroAddress,
          codexTitleTokenId: tokenId,
          transactionHash,
          type: 'create',
        }

        return new models.CodexTitleTransferEvent(newCodexTitleTransferEventData).save()
          .then((newCodexTitleTransferEvent) => {

            // TODO: store fileHashes?
            const newCodexTitleData = {
              provenance: [newCodexTitleTransferEvent],
              descriptionHash,
              ownerAddress,
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

    return models.CodexTitle.findOne(findCodexTitleConditions)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new Error(`Could not modify CodexTitle with tokenId ${tokenId} because it does not exist.`)
        }

        codexTitle.nameHash = newNameHash
        codexTitle.descriptionHash = newDescriptionHash

        // TODO: sort out proper provider ID functionality
        if (codexTitle.providerId !== '1') {
          return codexTitle
        }

        return models.CodexTitleMetadata.findById(providerMetadataId)
          .then((codexTitleMetadata) => {

            if (!codexTitleMetadata) {
              throw new Error(`Can not modify CodexTitle with tokenId ${codexTitle.tokenId} because metadata with id ${providerMetadataId} does not exit.`)
            }

            const pendingUpdateToCommitIndex = codexTitleMetadata.pendingUpdates.findIndex((pendingUpdate) => {

              if (
                newNameHash !== pendingUpdate.nameHash ||
                newDescriptionHash !== pendingUpdate.descriptionHash ||
                newFileHashes.length !== pendingUpdate.fileHashes.length
              ) {
                return false
              }

              newFileHashes.sort()
              pendingUpdate.fileHashes.sort()

              return pendingUpdate.fileHashes.every((fileHash, index) => {
                return fileHash === newFileHashes[index]
              })
            })

            if (pendingUpdateToCommitIndex === -1) {
              throw new Error(`Can not modify CodexTitle with tokenId ${codexTitle.tokenId} because metadata with id ${providerMetadataId} has no matching pending updates.`)
            }

            const [pendingUpdateToCommit] = codexTitleMetadata.pendingUpdates.splice(pendingUpdateToCommitIndex, 1)

            const oldFileIds = [
              codexTitleMetadata.mainImage.id,
              ...codexTitleMetadata.files.map((file) => { return file.id }),
              ...codexTitleMetadata.images.map((image) => { return image.id }),
            ]

            const newFileIds = [
              pendingUpdateToCommit.mainImage.id,
              ...pendingUpdateToCommit.files.map((file) => { return file.id }),
              ...pendingUpdateToCommit.images.map((image) => { return image.id }),
            ]

            const fileIdsToRemove = oldFileIds.filter((oldFileId) => {
              return !newFileIds.includes(oldFileId)
            })

            // TODO: maybe verify hases here? e.g.:
            // pendingUpdateToCommit.nameHash === nameHash
            // pendingUpdateToCommit.descriptionHash === descriptionHash

            codexTitleMetadata.name = pendingUpdateToCommit.name
            codexTitleMetadata.files = pendingUpdateToCommit.files
            codexTitleMetadata.images = pendingUpdateToCommit.images
            codexTitleMetadata.nameHash = pendingUpdateToCommit.nameHash
            codexTitleMetadata.mainImage = pendingUpdateToCommit.mainImage
            codexTitleMetadata.description = pendingUpdateToCommit.description
            codexTitleMetadata.descriptionHash = pendingUpdateToCommit.descriptionHash

            // TODO: create provenance record here (before saving anything else)
            return codexTitleMetadata.save()
              .then(() => {
                return models.CodexTitleFile.remove({ _id: { $in: fileIdsToRemove } })
              })
              .then(() => {
                return pendingUpdateToCommit.remove()
              })
          })
      })

  },

  transfer: (oldOwnerAddress, newOwnerAddress, tokenId, transactionHash) => {

    return models.CodexTitle.findById(tokenId)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new Error(`Could not transfer CodexTitle with tokenId ${tokenId} because it does not exist.`)
        }

        const newCodexTitleTransferEventData = {
          codexTitleTokenId: tokenId,
          oldOwnerAddress,
          newOwnerAddress,
          transactionHash,
          type: 'transfer',
        }

        return new models.CodexTitleTransferEvent(newCodexTitleTransferEventData).save()
          .then((newCodexTitleTransferEvent) => {

            codexTitle.provenance.push(newCodexTitleTransferEvent)
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

        const newCodexTitleTransferEventData = {
          oldOwnerAddress: ownerAddress,
          newOwnerAddress: zeroAddress,
          codexTitleTokenId: tokenId,
          transactionHash,
          type: 'destroy',
        }

        return new models.CodexTitleTransferEvent(newCodexTitleTransferEventData).save()
          .then((newCodexTitleTransferEvent) => {

            codexTitle.provenance.push(newCodexTitleTransferEvent)
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
