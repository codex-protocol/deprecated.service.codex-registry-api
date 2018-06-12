import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../models'

export default {

  method: 'get',

  path: '/giveaways?',

  parameters: Joi.object().keys({
    active: Joi.boolean(),
  }),

  handler(request, response) {

    // @TODO: Filter for ones the user has not participated in
    // @TODO: Filter for ones that have editions remaining (if active=true)

    return models.Giveaway.find()
      .then((giveaways) => {

        if (!giveaways) {
          throw new RestifyErrors.NotFoundError('No Giveaway documents found.')
        }

        return giveaways

      })

  },

}
