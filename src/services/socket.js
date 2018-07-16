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

  emitToAddress(userAddress, eventName, rawEventData) {

    const redisKey = `${this.redisKeyPrefix}:${userAddress.toLowerCase()}`

    // @NOTE: most socket events emit mongoose instances as their data, and the
    //  .toJSON() seems to fire 3 times for each .emit() below (due to internal
    //  socket.io stuff?) so we pre-.toJSON() it here to elimiate unnecessary
    //  serializations
    const eventData = (typeof rawEventData.toJSON === 'function') ? rawEventData.toJSON() : rawEventData

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
