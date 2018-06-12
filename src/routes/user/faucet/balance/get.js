import { contracts } from '@codex-protocol/ethereum-service'

import config from '../../../../config'

export default {

  method: 'get',
  path: '/users?/faucet/balance',

  requireAuthentication: true,

  restrictToEnvironments: [
    config.faucet.enabled ? process.env.NODE_ENV : '',
  ],

  handler(request, response) {
    return contracts.CodexCoin.methods.balanceOf(response.locals.userAddress).call()
      .then((balance) => {
        return {
          balance,
        }
      })
  },

}
