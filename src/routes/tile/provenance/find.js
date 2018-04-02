import models from '../../../models'

export default {

  method: 'get',
  path: '/titles?/:tokenId/provenance',

  handler(request, response) {

    return models.CodexTitle.findById(request.params.tokenId, 'provenance')
      .populate('provenance')
      .then(({ provenance }) => {
        return provenance
      })

  },

}
