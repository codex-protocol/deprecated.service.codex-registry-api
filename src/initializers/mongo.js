import mongoose from 'mongoose'
import Bluebird from 'bluebird'

import config from '../config'
import logger from '../services/logger'
import mongooseService from '../services/mongoose'

export default (app) => {

  mongoose.Promise = Bluebird

  const connectionOptions = { useMongoClient: true }

  const connections = {
    eelConnection: mongoose.createConnection(config.mongodb.dbUris.eel, connectionOptions),
    titleRegistryConnection: mongoose.createConnection(config.mongodb.dbUris.titleRegistry, connectionOptions),
  }

  return Bluebird.props(connections)
    .then((result) => {
      mongooseService.eel = result.eelConnection
      mongooseService.titleRegistry = result.titleRegistryConnection
      return app
    })
    .catch((error) => {
      logger.error('could not connect to database(s), please make sure mongodb is running', error)
    })

}
