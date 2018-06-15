import models from '../../models'

export default {

  method: 'get',

  path: '/giveaways?',

  requireAuthentication: true,

  handler(request, response) {

    return models.User.findById(response.locals.userAddress)
      .then((user) => {

        const conditions = {
          _id: {
            $nin: user.giveawaysParticipatedIn,
          },
          numberOfEditionsRemaining: {
            $gt: 0,
          },
        }

        return models.Giveaway.find(conditions)

      })

  },

}
