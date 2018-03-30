import models from '../../../../models'

export default {

  method: 'get',
  path: '/address(es)?/:userAddress/titles?/:tokenId/provenance',

  handler(request, response) {

    const conditions = {
      ownerAddress: request.params.userAddress,
      _id: request.params.tokenId,
    }

    return models.CodexTitle.findOne(conditions, 'provenance').populate('provenance')
      .then(({ provenance }) => {
        return provenance
      })

  },

}
