import Joi from 'joi'
import { web3 } from '@codex-protocol/ethereum-service'

import models from '../../../models'

const imageSchema = Joi.object().keys({
  _id: Joi.string().regex(/^[0-9a-f]{24}$/i).required(),
}).rename('id', '_id')

export default {

  method: 'post',
  path: '/users?/title-metadata',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    description: Joi.string().allow(null),
    mainImage: imageSchema.required(),
    name: Joi.string().required(),
    images: Joi.array().items(
      imageSchema.required()
    ).single().default([]),
  }),

  handler(request, response) {

    const newCodexTitleMetadataData = Object.assign({
      creatorAddress: response.locals.userAddress,
      nameHash: web3.utils.soliditySha3(request.parameters.name),
      descriptionHash: request.parameters.description ? web3.utils.soliditySha3(request.parameters.description) : null,
    }, request.parameters)

    const newCodexTitleMetadata = new models.CodexTitleMetadata(newCodexTitleMetadataData)

    return newCodexTitleMetadata.save()
      .then(() => {

        return newCodexTitleMetadata
          .populate('mainImage')
          .populate('images')
          .execPopulate()

      })

  },

}
