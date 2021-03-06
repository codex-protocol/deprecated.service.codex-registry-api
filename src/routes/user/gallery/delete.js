import RestifyErrors from 'restify-errors'

import models from '../../../models'

export default {

  method: 'delete',
  path: '/users?/galler(y|ies)/:galleryId',

  requireAuthentication: true,

  // @TODO: allow this in all environments when user galleries are implemented
  restrictToEnvironments: [
    'development',
  ],

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

        return gallery.remove()

      })
  },

}
