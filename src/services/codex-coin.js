import SocketService from './socket'

export default {

  transfer(fromAddress, toAddress, value, transactionHash) {
    SocketService.emitToAddress(toAddress, 'codex-coin:transferred', value)
  },

  approveSpender(ownerAddress, spenderAddress, value, transactionHash) {
    SocketService.emitToAddress(ownerAddress, 'codex-coin:registry-contract-approved', value)
  },

}
