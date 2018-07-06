import Joi from 'joi'

import models from '../../../models'

const codexRecordSchema = Joi.object().keys({
  _id: Joi.string().regex(/^[0-9a-f]{24}$/i).required(),
}).rename('id', '_id')

export default {

  method: 'post',
  path: '/user/galler(y|ies)',

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
  }),

  handler(request, response) {

    const newGalleryData = Object.assign({
      ownerAddress: response.locals.userAddress,
    }, request.parameters)

    // @TODO: ensure all records are public and owned by the user

    return new models.Gallery(newGalleryData).save()

  },

}
