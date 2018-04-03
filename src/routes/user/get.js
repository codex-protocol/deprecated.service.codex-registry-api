import models from '../../models'

export default {

  method: 'get',
  path: '/user',

  authenticateUser: true,

  handler(request, response) {
    return models.User.findById(response.locals.userAddress)
  },

}
