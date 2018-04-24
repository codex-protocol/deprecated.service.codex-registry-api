import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'get',
  path: '/titles?/:codexTitleId/provenance',

  // NOTE: even though this route is not returning user-specific data, business
  //  logic dictates that we should not return provenance if the user isn't
  //  logged in
  requireAuthentication: true,

  handler(request, response) {

    return models.CodexTitle.findById(request.params.codexTitleId, 'provenance')
      .populate('provenance')
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with codexTitleId ${request.params.codexTitleId} does not exist.`)
        }

        return codexTitle.provenance

      })

  },

}
