import Joi from 'joi'

import models from '../../../models'

const fileSchema = Joi.object().keys({
  _id: Joi.string().regex(/^[0-9a-f]{24}$/i).required(),
}).rename('id', '_id')

export default {

  method: 'post',
  path: '/users?/title-metadata',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    description: Joi.string().allow(null),
    mainImage: fileSchema.required(),
    name: Joi.string().required(),
    images: Joi.array().items(
      fileSchema.required(),
    ).single().default([]),
    files: Joi.array().items(
      fileSchema.required(),
    ).single().default([]),
  }),

  handler(request, response) {

    const newCodexTitleMetadataData = Object.assign({
      creatorAddress: response.locals.userAddress,
    }, request.parameters)

    // remove the main image from the images array if it exists in both places
    newCodexTitleMetadataData.images = newCodexTitleMetadataData.images.filter((image) => {
      return image._id !== newCodexTitleMetadataData.mainImage._id
    })

    const newCodexTitleMetadata = new models.CodexTitleMetadata(newCodexTitleMetadataData)

    return newCodexTitleMetadata.save()
      .then(() => {
        return newCodexTitleMetadata
          .populate('mainImage images files') // TODO: move this to a post-save hook (but check that they haven't been populated already)
          .execPopulate()
      })

  },

}
