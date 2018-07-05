import models from '../../../models'

export default {

  method: 'get',
  path: '/users?/galler(y|ies)',

  requireAuthentication: true,

  handler(request, response) {

    const conditions = {
      ownerAddress: response.locals.userAddress,
    }

    return models.Gallery.find(conditions)

  },

}
