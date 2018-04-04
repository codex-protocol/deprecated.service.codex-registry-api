import models from '../../models'

export default {

  method: 'get',
  path: '/user',

  requireAuthentication: true,

  handler(request, response) {
    return models.User.findById(response.locals.userAddress)
  },

}
