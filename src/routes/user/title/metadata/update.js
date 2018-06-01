import Joi from 'joi'
import RestifyErrors from 'restify-errors'

import models from '../../../../models'

const fileSchema = Joi.object().keys({
  _id: Joi.string().regex(/^[0-9a-f]{24}$/i).required(),
}).rename('id', '_id')

export default {

  method: 'put',
  path: '/users?/titles?/:tokenId/metadata',

  requireAuthentication: true,

  parameters: Joi.object().keys({
    description: Joi.string().allow(null),
    mainImage: fileSchema,
    name: Joi.string(),
    images: Joi.array().items(
      fileSchema,
    ).single(),
    files: Joi.array().items(
      fileSchema,
    ).single(),
  }).or(
    'description',
    'mainImage',
    'images',
    'files',
    'name',
  ),

  handler(request, response) {

    const conditions = {
      _id: request.params.tokenId,
      ownerAddress: response.locals.userAddress,
    }

    return models.CodexTitle.findOne(conditions)
      .populate('metadata')
      .then((codexTitle) => {

        if (!codexTitle) {
          throw new RestifyErrors.NotFoundError(`CodexTitle with tokenId ${request.params.tokenId} does not exist.`)
        }

        const newPendingUpdateData = Object.assign({}, codexTitle.metadata.toObject(), request.parameters)

        // delete some things we don't really want to copy over because they'll
        //  get set independently by mongoose
        delete newPendingUpdateData.updatedAt
        delete newPendingUpdateData.createdAt
        delete newPendingUpdateData._id

        // remove the main image from the images array if it exists in both places
        newPendingUpdateData.images = newPendingUpdateData.images.filter((image) => {
          return image._id !== newPendingUpdateData.mainImage._id
        })

        // TODO: dedupe pendingUpdates to make sure that two of the exact same
        //  updates aren't saved?
        const newPendingUpdate = new models.CodexTitleMetadataPendingUpdate(newPendingUpdateData)

        return newPendingUpdate.save()
          .then(() => {
            return newPendingUpdate
              .populate('mainImage images files') // TODO: move this to a post-save hook (but check that they haven't been populated already)
              .execPopulate()
          })
          .then(() => {
            codexTitle.metadata.pendingUpdates.push(newPendingUpdate)
            return codexTitle.metadata.save() // TODO: should this route just return newPendingUpdate only?
          })

      })

  },

}
