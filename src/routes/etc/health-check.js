export default {

  method: 'get',
  path: '/etc/health-check',

  handler(request, response) {
    return '👌🏻'
  },

}
