import { contracts } from '@codex-protocol/ethereum-service'

export default {

  method: 'get',
  path: '/users?/faucet/total-supply',

  requireAuthentication: true,

  restrictToEnvironments: [
    'development',
    'staging',
  ],

  handler(request, response) {
    return contracts.CodexToken.methods.totalSupply().call()
      .then((totalSupply) => {
        return {
          totalSupply,
        }
      })
  },

}
