import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'post',
  path: '/admin/providers?',

  requireAuthentication: true,

  // @TODO: add admin authentication and allow this in all environments
  restrictToEnvironments: [
    'development',
  ],

  parameters: Joi.object().keys({
    _id: Joi.string(),
    name: Joi.string().required(),
    metadataUrl: Joi.string().allow(null),
    description: Joi.string().allow(null),
  }).rename('id', '_id'),

  handler(request, response) {

    return new models.Provider(request.parameters).save()
      .catch((error) => {
        if (error.code === 11000) {
          throw new RestifyErrors.ConflictError(`Provider with id "${request.parameters._id}" already exists.`)
        }
      })

  },

}
