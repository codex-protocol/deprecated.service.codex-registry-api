import { contracts } from '@codex-protocol/ethereum-service'

import logger from './logger'
import models from '../models'

const zeroAddress = '0x0000000000000000000000000000000000000000'

export default {

  create: (ownerAddress, tokenId) => {

    return contracts.CodexTitle.methods.getTokenById(tokenId).call()
      .then(({ name, description, imageUri }) => {

        const newCodexTitleTransferEventData = {
          newOwnerAddress: ownerAddress,
          oldOwnerAddress: zeroAddress,
          codexTitleTokenId: tokenId,
          type: 'create',
        }

        return new models.CodexTitleTransferEvent(newCodexTitleTransferEventData).save()
          .then((newCodexTitleTransferEvent) => {

            const newCodexTitleData = {
              provenance: [newCodexTitleTransferEvent],
              _id: tokenId,
              ownerAddress,
              description,
              imageUri,
              name,
            }

            return new models.CodexTitle(newCodexTitleData).save()

          })

      })

  },

  transfer: (oldOwnerAddress, newOwnerAddress, tokenId) => {

    return models.CodexTitle.findById(tokenId)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new Error(`Can not transfer CodexTitle with tokenId ${tokenId} because it does not exist.`)
        }

        const newCodexTitleTransferEventData = {
          codexTitleTokenId: tokenId,
          oldOwnerAddress,
          newOwnerAddress,
          type: 'transfer',
        }

        return new models.CodexTitleTransferEvent(newCodexTitleTransferEventData).save()
          .then((newCodexTitleTransferEvent) => {

            codexTitle.provenance.push(newCodexTitleTransferEvent)
            codexTitle.ownerAddress = newOwnerAddress

            return codexTitle.save()

          })

      })

  },

  destroy: (ownerAddress, tokenId) => {

    return models.CodexTitle.findById(tokenId)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new Error(`Can not destroy CodexTitle with tokenId ${tokenId} because it does not exist.`)
        }

        const newCodexTitleTransferEventData = {
          oldOwnerAddress: ownerAddress,
          newOwnerAddress: zeroAddress,
          codexTitleTokenId: tokenId,
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

  approveAddress: (ownerAddress, approvedAddress, tokenId) => {

    return models.CodexTitle.findById(tokenId)
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new Error(`Can not update approved address for CodexTitle with tokenId ${tokenId} because it does not exist.`)
        }

        codexTitle.approvedAddress = approvedAddress
        return codexTitle.save()

      })

  },

  approveOperator: (ownerAddress, operatorAddress, isApproved) => {
    // TODO: implement approveAll functionality here
    logger.debug('codexTitleService.approveAll() called', { ownerAddress, operatorAddress, isApproved })
  },
}
