import logger from './logger'

export default {

  create: (ownerAddress, tokenId) => {
    // TODO: implement create functionality here
    logger.debug('codexTitleService.create() called', { ownerAddress, tokenId })
  },

  transfer: (fromAddress, toAddress, tokenId) => {
    // TODO: implement transfer functionality here
    logger.debug('codexTitleService.transfer() called', { fromAddress, toAddress, tokenId })
  },

  approve: (ownerAddress, approvedAddress, tokenId) => {
    // TODO: implement approve functionality here
    logger.debug('codexTitleService.approve() called', { ownerAddress, approvedAddress, tokenId })
  },

  approveAll: (ownerAddress, operatorAddress, isApproved) => {
    // TODO: implement approveAll functionality here
    logger.debug('codexTitleService.approveAll() called', { ownerAddress, operatorAddress, isApproved })
  },
}
