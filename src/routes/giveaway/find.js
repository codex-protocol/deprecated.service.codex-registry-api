import RestifyErrors from 'restify-errors'

import models from '../../models'

export default {

  method: 'get',

  path: '/giveaways?/:giveawayId',

  requireAuthentication: true,

  handler(request, response) {

    return models.Giveaway.findById(request.params.giveawayId)
      .then((giveaway) => {

        if (!giveaway) {
          throw new RestifyErrors.NotFoundError(`Giveaway with giveawayId ${request.params.giveawayId} does not exist.`)
        }

        return giveaway

      })
  },
}
