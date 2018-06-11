import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../models'

export default {

  method: 'get',

  // @TODO: How to filter?
  path: '/giveaways?',

  parameters: Joi.object().keys({
    active: Joi.boolean(),
  }),

  handler(request, response) {

    // const populateConditions = request.parameters.include.map((active) => {
    //   return {
    //   }
    // })

    // @TODO: Filter for ones the user has not participated in

    if (request.params.giveawayId) {
      return models.Giveaway.findById(request.params.giveawayId)
        .then((giveaway) => {

          if (!giveaway) {
            throw new RestifyErrors.NotFoundError(`Giveaway with giveawayId ${request.params.giveawayId} does not exist.`)
          }

          // @TODO: What does setLocals do?
          return giveaway

        })
    }

    return models.Giveaway.find()
      .then((giveaways) => {

        if (!giveaways) {
          throw new RestifyErrors.NotFoundError('No Giveaway documents found.')
        }

        return giveaways

      })

  },

}
