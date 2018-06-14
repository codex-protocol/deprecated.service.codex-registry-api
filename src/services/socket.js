import redis from './redis'
import logger from './logger'

export default {

  // this is set in the socket initializer (src/initializers/socket.js)
  socketApp: null,

  redisKeyPrefix: 'user-socket-ids',

  addSocket(socket) {

    const userAddress = socket.decoded_token.userAddress.toLowerCase()
    const redisKey = `${this.redisKeyPrefix}:${userAddress}`

    redis.get(redisKey)
      .then((userSocketIds = []) => {
        userSocketIds.push(socket.id)
        return redis.set(redisKey, userSocketIds)
      })
      .catch((error) => {
        logger.warn(`[addSocket] could not read / write redis key "${redisKey}"`, error)
      })

  },

  removeSocket(socket) {

    const userAddress = socket.decoded_token.userAddress.toLowerCase()
    const redisKey = `${this.redisKeyPrefix}:${userAddress}`

    redis.get(redisKey)
      .then((userSocketIds = []) => {

        const indexToRemove = userSocketIds.indexOf(socket.id)

        if (indexToRemove === -1) {
          return userSocketIds
        }

        userSocketIds.splice(indexToRemove, 1)

        if (userSocketIds.length === 0) {
          return redis.remove(redisKey)
        }

        return redis.set(redisKey, userSocketIds)

      })
      .catch((error) => {
        logger.warn(`[removeSocket] could not read / write redis key "${redisKey}"`, error)
      })

  },

  emitToAddress(userAddress, eventName, eventData) {

    const redisKey = `${this.redisKeyPrefix}:${userAddress.toLowerCase()}`

    redis.get(redisKey)
      .then((userSocketIds = []) => {
        userSocketIds.forEach((socketId) => {
          this.socketApp.to(socketId).emit('user-event', { name: eventName, data: eventData })
        })
      })
      .catch((error) => {
        logger.warn(`[emitToAddress] could not read / write redis key "${redisKey}"`, error)
      })

  },

}
