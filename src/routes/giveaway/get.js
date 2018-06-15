import RestifyErrors from 'restify-errors'

import models from '../../models'

export default {

  method: 'get',

  path: '/giveaways?',

  requireAuthentication: true,

  handler(request, response) {

    return models.User.findById(response.locals.userAddress)
      .then((user) => {

        const conditions = {
          _id: '5b20316fbaad057952794aa7',
          numberOfEditionsRemaining: {
            $gt: 0,
          },
        }

        return models.Giveaway.find(conditions)
          .then((giveaways) => {

            if (!giveaways) {
              throw new RestifyErrors.NotFoundError('No Giveaway documents found.')
            }

            return giveaways

          })

      })

  },

}
