import { contracts } from '@codex-protocol/ethereum-service'

import config from '../../../../config'

export default {

  method: 'get',
  path: '/users?/faucet/total-supply',

  requireAuthentication: true,

  restrictToEnvironments: [
    config.faucet.enabled ? process.env.NODE_ENV : '',
  ],

  handler(request, response) {
    return contracts.CodexCoin.methods.totalSupply().call()
      .then((totalSupply) => {
        return {
          totalSupply,
        }
      })
  },

}
