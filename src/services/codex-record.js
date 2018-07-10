import { contracts } from '@codex-protocol/ethereum-service'

import config from '../config'
import models from '../models'
import SocketService from './socket'

export default {

  // this is the delimiter used to separate providerId, providerMetadataId, etc
  //  in additionalData strings sent to CodexRecord.mint() and
  //  CodexRecord.modifyMetadataHashes() contract calls
  additionalDataDelimiter: '::',

  // this links a CodexRecord record to a CodexRecordMetadata record based on
  //  the info emitted by the Minted event
  confirmMint(tokenId, additionalData, transactionHash) {

    return models.CodexRecord.findById(tokenId)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new Error(`Could not confirm CodexRecord with tokenId ${tokenId} because it does not exist.`)
        }

        const [providerId, providerMetadataId] = this.decodeAdditionalData(additionalData)

        codexRecord.providerMetadataId = providerMetadataId
        codexRecord.providerId = providerId

        // @TODO: sort out proper provider ID functionality
        if (codexRecord.providerId !== '1') {
          return codexRecord
        }

        return models.CodexRecordMetadata.findById(providerMetadataId)
          .then((codexRecordMetadata) => {

            if (!codexRecordMetadata) {
              throw new Error(`Could not confirm CodexRecord with tokenId ${codexRecord.tokenId} because metadata with id ${providerMetadataId} does not exit.`)
            }

            codexRecordMetadata.codexRecordTokenId = codexRecord.tokenId

            // @TODO: maybe verify hases here? e.g.:
            // codexRecordMetadata.nameHash === codexRecord.nameHash
            // codexRecordMetadata.descriptionHash === codexRecord.descriptionHash

            return codexRecordMetadata.save()
              .then(() => {
                codexRecord.metadata = codexRecordMetadata
                return codexRecord
              })
          })
      })

      .then((codexRecord) => {
        return codexRecord.save()
      })

      .then((codexRecord) => {
        // @TODO: sort out proper provider ID functionality
        if (codexRecord.providerId === '1') {
          codexRecord.setLocals({ userAddress: codexRecord.ownerAddress })
          SocketService.emitToAddress(codexRecord.ownerAddress, 'mint-confirmed', codexRecord)
        }
        return codexRecord
      })

  },

  create(ownerAddress, tokenId, transactionHash) {

    return contracts.CodexRecord.methods.getTokenById(tokenId).call()
      .then(({ nameHash, descriptionHash, fileHashes }) => {

        const newCodexRecordProvenanceEventData = {
          oldOwnerAddress: config.zeroAddress,
          newOwnerAddress: ownerAddress,
          codexRecordTokenId: tokenId,
          transactionHash,
          type: 'created',
        }

        return new models.CodexRecordProvenanceEvent(newCodexRecordProvenanceEventData).save()
          .then((newCodexRecordProvenanceEvent) => {

            const newCodexRecordData = {
              provenance: [newCodexRecordProvenanceEvent],
              descriptionHash,
              ownerAddress,
              fileHashes,
              nameHash,
              tokenId,
            }

            return new models.CodexRecord(newCodexRecordData).save()

          })

      })

  },

  modify(
    modifierAddress,
    tokenId,
    newNameHash,
    newDescriptionHash,
    newFileHashes,
    additionalData,
    transactionHash,
  ) {

    const [providerId, providerMetadataId] = this.decodeAdditionalData(additionalData)

    const findCodexRecordConditions = {
      providerId,
      _id: tokenId,
      providerMetadataId,
    }

    const newCodexRecordModifiedEvent = new models.CodexRecordModifiedEvent({
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

    return models.CodexRecord.findOne(findCodexRecordConditions)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new Error(`Could not modify CodexRecord with tokenId ${tokenId} because it does not exist.`)
        }

        newCodexRecordModifiedEvent.oldNameHash = codexRecord.nameHash
        newCodexRecordModifiedEvent.oldFileHashes = codexRecord.fileHashes
        newCodexRecordModifiedEvent.oldDescriptionHash = codexRecord.descriptionHash

        return newCodexRecordModifiedEvent.save()
          .then(() => {

            const newCodexRecordProvenanceEventData = {
              codexRecordTokenId: tokenId,
              type: 'modified',
              transactionHash,

              // these aren't really applicable to Modified events, so we'll just
              //  set them to the current ownerAddress ¯\_(ツ)_/¯
              oldOwnerAddress: codexRecord.ownerAddress,
              newOwnerAddress: codexRecord.ownerAddress,

              codexRecordModifiedEvent: newCodexRecordModifiedEvent,
            }

            return new models.CodexRecordProvenanceEvent(newCodexRecordProvenanceEventData).save()
              .then((newCodexRecordProvenanceEvent) => {

                codexRecord.nameHash = newNameHash
                codexRecord.fileHashes = newFileHashes
                codexRecord.descriptionHash = newDescriptionHash

                codexRecord.provenance.unshift(newCodexRecordProvenanceEvent)

                return codexRecord.save()

              })
          })
      })

      .then((codexRecord) => {

        // @TODO: sort out proper provider ID functionality
        if (codexRecord.providerId !== '1') {
          return codexRecord
        }

        if (!codexRecord.metadata) {
          throw new Error(`Could not modify CodexRecord with tokenId ${codexRecord.tokenId} because metadata with id ${providerMetadataId} does not exit.`)
        }

        const pendingUpdateToCommitIndex = codexRecord.metadata.pendingUpdates.findIndex((pendingUpdate) => {

          if (
            newNameHash !== pendingUpdate.nameHash ||
            newFileHashes.length !== pendingUpdate.fileHashes.length ||
            (pendingUpdate.descriptionHash && newDescriptionHash !== pendingUpdate.descriptionHash)
          ) {
            return false
          }

          // @NOTE: pendingUpdate.fileHashes is already sorted as part of the
          //  virtual getter
          newFileHashes.sort()

          return pendingUpdate.fileHashes.every((fileHash, index) => {
            return fileHash === newFileHashes[index]
          })
        })

        if (pendingUpdateToCommitIndex === -1) {
          throw new Error(`Could not modify CodexRecord with tokenId ${codexRecord.tokenId} because metadata with id ${providerMetadataId} has no matching pending updates.`)
        }

        const [pendingUpdateToCommit] = codexRecord.metadata.pendingUpdates.splice(pendingUpdateToCommitIndex, 1)

        // @TODO: maybe verify hases here? e.g.:
        // pendingUpdateToCommit.nameHash === nameHash
        // pendingUpdateToCommit.descriptionHash === descriptionHash

        newCodexRecordModifiedEvent.oldName = codexRecord.metadata.name
        newCodexRecordModifiedEvent.oldFiles = codexRecord.metadata.files
        newCodexRecordModifiedEvent.oldImages = codexRecord.metadata.images
        newCodexRecordModifiedEvent.oldMainImage = codexRecord.metadata.mainImage
        newCodexRecordModifiedEvent.oldDescription = codexRecord.metadata.description

        newCodexRecordModifiedEvent.newName = pendingUpdateToCommit.name
        newCodexRecordModifiedEvent.newFiles = pendingUpdateToCommit.files
        newCodexRecordModifiedEvent.newImages = pendingUpdateToCommit.images
        newCodexRecordModifiedEvent.newMainImage = pendingUpdateToCommit.mainImage
        newCodexRecordModifiedEvent.newDescription = pendingUpdateToCommit.description

        return newCodexRecordModifiedEvent.save()
          .then(() => {

            codexRecord.metadata.name = pendingUpdateToCommit.name
            codexRecord.metadata.files = pendingUpdateToCommit.files
            codexRecord.metadata.images = pendingUpdateToCommit.images
            codexRecord.metadata.nameHash = pendingUpdateToCommit.nameHash
            codexRecord.metadata.mainImage = pendingUpdateToCommit.mainImage
            codexRecord.metadata.description = pendingUpdateToCommit.description
            codexRecord.metadata.descriptionHash = pendingUpdateToCommit.descriptionHash

            return codexRecord.metadata.save()

          })
          .then(() => {
            return pendingUpdateToCommit.remove()
          })
          .then(() => {
            return codexRecord
          })
      })
      .then((codexRecord) => {
        // @TODO: sort out proper provider ID functionality
        if (codexRecord.providerId === '1') {
          codexRecord.setLocals({ userAddress: codexRecord.ownerAddress })
          SocketService.emitToAddress(codexRecord.ownerAddress, 'record-modified', codexRecord)
        }
        return codexRecord
      })

  },

  transfer(oldOwnerAddress, newOwnerAddress, tokenId, transactionHash) {

    return models.CodexRecord.findById(tokenId)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new Error(`Could not transfer CodexRecord with tokenId ${tokenId} because it does not exist.`)
        }

        const newCodexRecordProvenanceEventData = {
          codexRecordTokenId: tokenId,
          type: 'transferred',
          oldOwnerAddress,
          newOwnerAddress,
          transactionHash,
        }

        return new models.CodexRecordProvenanceEvent(newCodexRecordProvenanceEventData).save()
          .then((newCodexRecordProvenanceEvent) => {

            codexRecord.provenance.unshift(newCodexRecordProvenanceEvent)
            codexRecord.ownerAddress = newOwnerAddress
            codexRecord.whitelistedAddresses = []
            codexRecord.approvedAddress = null
            codexRecord.isIgnored = false
            codexRecord.isPrivate = true

            return codexRecord.save()

          })

      })

      .then((codexRecord) => {
        // @TODO: sort out proper provider ID functionality
        if (codexRecord.providerId === '1') {
          // @NOTE: normally we'd want to use
          //  codexRecord.setLocals({ userAddress: oldOwnerAddress }) when
          //  constructing the JSON for the old owner... but if we do that then
          //  the Record's name will not be available in the front end
          //  notification
          //
          // so instead we'll just send the full "owner" Record to both people,
          //  since this really won't give away any new info to the old owner,
          //  (because he literally just had access to all that info)
          const responseJSON = codexRecord.setLocals({ userAddress: newOwnerAddress }).toJSON()
          SocketService.emitToAddress(newOwnerAddress, 'record-transferred:new-owner', responseJSON)
          SocketService.emitToAddress(oldOwnerAddress, 'record-transferred:old-owner', responseJSON)
        }
        return codexRecord
      })

  },

  destroy(ownerAddress, tokenId, transactionHash) {

    return models.CodexRecord.findById(tokenId)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new Error(`Could not destroy CodexRecord with tokenId ${tokenId} because it does not exist.`)
        }

        const newCodexRecordProvenanceEventData = {
          newOwnerAddress: config.zeroAddress,
          oldOwnerAddress: ownerAddress,
          codexRecordTokenId: tokenId,
          type: 'destroyed',
          transactionHash,
        }

        return new models.CodexRecordProvenanceEvent(newCodexRecordProvenanceEventData).save()
          .then((newCodexRecordProvenanceEvent) => {

            codexRecord.provenance.unshift(newCodexRecordProvenanceEvent)
            codexRecord.ownerAddress = config.zeroAddress

            return codexRecord.save()

          })

      })

      .then((codexRecord) => {
        // @TODO: sort out proper provider ID functionality
        if (codexRecord.providerId === '1') {
          codexRecord.setLocals({ userAddress: codexRecord.ownerAddress })
          SocketService.emitToAddress(ownerAddress, 'record-destroyed', codexRecord)
        }
        return codexRecord
      })

  },

  approveAddress(ownerAddress, approvedAddress, tokenId, transactionHash) {

    return models.CodexRecord.findById(tokenId)
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new Error(`Could not update approved address for CodexRecord with tokenId ${tokenId} because it does not exist.`)
        }

        codexRecord.approvedAddress = approvedAddress === config.zeroAddress ? null : approvedAddress
        codexRecord.isIgnored = false

        return codexRecord.save()

      })

      .then((codexRecord) => {
        // @TODO: sort out proper provider ID functionality
        if (codexRecord.providerId === '1') {

          const ownerResponse = codexRecord.setLocals({ userAddress: codexRecord.ownerAddress }).toJSON()
          const approvedResponse = codexRecord.setLocals({ userAddress: codexRecord.approvedAddress }).toJSON()

          if (!codexRecord.approvedAddress) {
            // @NOTE: there's no way to know if this was emitted from
            //  clearApproval() or just an explicit cancel via
            //  transferFrom(owner, zeroAddress) so I guess we just have to
            //  settle for not notifying the owner of a successful cancel :/
            //
            // (if we just emit this either way, then a successfull transfer
            //  will also emit this socket event)
            //
            // SocketService.emitToAddress(codexRecord.ownerAddress, 'address-approved:cancel', ownerResponse)
          } else {
            SocketService.emitToAddress(codexRecord.ownerAddress, 'address-approved:owner', ownerResponse)
            SocketService.emitToAddress(codexRecord.approvedAddress, 'address-approved:approved', approvedResponse)
          }
        }
        return codexRecord
      })

  },

  // this simply returns all arguments passed concatenated in a string delimited
  //  by the additionalDataDelimeter defined above - it also hex-encodes the
  //  string
  //
  // this string should be passed to CodexRecord.mint() and
  //  CodexRecord.modifyMetadataHashes() contract calls as the additionalData
  //  parameter
  encodeAdditionalData(...args) {

    // allow an array or a list of arguments to be passed in
    const additionalData = (Object.prototype.toString.call(args[0]) === '[object Array]') ? args[0] : args

    const hexString = Buffer
      .from(additionalData.join(this.additionalDataDelimiter))
      .toString('hex')

    return `0x${hexString}`
  },

  // this decodes additionalData strings when a Minted or Modified event is
  //  processed to determine which CodexRecordMetadata or
  //  CodexRecordMetadataPendingUpdate record to apply
  decodeAdditionalData(additionalData) {
    return Buffer
      .from(additionalData.substr(2), 'hex')
      .toString()
      .split(this.additionalDataDelimiter)
  },

}
