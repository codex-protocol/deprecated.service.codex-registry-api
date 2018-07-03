import redis from 'redis'
import Bluebird from 'bluebird'

import config from '../config'

Bluebird.promisifyAll(redis.RedisClient.prototype)

const client = redis.createClient(config.redis)

export default {

  get(key) {
    return client.getAsync(key)
      .then((result) => {
        if (!result) return undefined
        return JSON.parse(result)
      })
  },

  set(key, value) {
    return client.setAsync(key, JSON.stringify(value))
  },

  // default expiry is 1 day
  //
  // @NOTE: The expiry is reset when the key is accessed
  //  see: http://redis.io/commands/expire
  setAndExpire(key, value, seconds = 86400) {
    return client.setexAsync(key, seconds, JSON.stringify(value))
  },

  remove(key) {
    return client.delAsync(key)
  },

  // @NOTE: The expiry is reset when the key is accessed
  //  see: http://redis.io/commands/expire
  expire(key, seconds) {
    return client.expireAsync(key, seconds)
  },
}
