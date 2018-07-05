import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../models'

const codexRecordSchema = Joi.object().keys({
  _id: Joi.string().regex(/^[0-9a-f]{24}$/i).required(),
}).rename('id', '_id')

export default {

  method: 'put',
  path: '/user/galler(y|ies)/:galleryId',

  requireAuthentication: true,

  // @TODO: add admin authentication and allow this in all environments
  restrictToEnvironments: [
    'development',
  ],

  parameters: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow(null),
    slideDuration: Joi.number().integer().max(30).allow(null),
    codexRecords: Joi.array().items(codexRecordSchema).single().default([]),
  }).or(
    'name',
    'description',
    'codexRecords',
    'slideDuration',
  ),

  handler(request, response) {

    const conditions = {
      _id: request.params.galleryId,
      ownerAddress: response.locals.userAddress,
    }

    return models.Gallery.findOne(conditions)
      .then((gallery) => {

        if (!gallery) {
          throw new RestifyErrors.NotFoundError(`Gallery with id ${request.params.galleryId} does not exist.`)
        }

        // @TODO: ensure all records are public and owned by the user

        Object.assign(gallery, request.parameters)

        return gallery.save()

      })

  },

}
