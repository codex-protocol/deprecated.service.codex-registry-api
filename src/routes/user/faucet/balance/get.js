import { contracts } from '@codex-protocol/ethereum-service'

export default {

  method: 'get',
  path: '/users?/faucet/balance',

  requireAuthentication: true,

  restrictToEnvironments: [
    'development',
    'staging',
  ],

  handler(request, response) {
    return contracts.CodexToken.methods.balanceOf(response.locals.userAddress).call()
      .then((balance) => {
        return {
          balance,
        }
      })
  },

}
