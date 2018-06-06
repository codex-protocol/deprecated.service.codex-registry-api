import mongoose from 'mongoose'
import Bluebird from 'bluebird'

import config from '../config'
import logger from '../services/logger'
import mongooseService from '../services/mongoose'

export default (app) => {

  mongoose.Promise = Bluebird

  // this is a "global" mongoose plugin and will affect all models
  mongoose.plugin((schema) => {

    // give every model a setLocals() method that can be used to give a "user
    //  context" for toJSON methods (for hiding private fields, etc)
    //
    // NOTE: at the moment, this is only really used for the CodexTitle model,
    //  maybe it should just be moved to a local method?
    schema.methods.setLocals = function setLocals(locals) {
      this.locals = locals
      return this
    }

    // this method name is a bit of a misnomer; it takes an array of
    //  "permissions" and REMOVES all fields on an instance that have a
    //  "permissions" array with entires that match the specified permissions
    //
    // so really it's more of a "scrub these fields" kind of thing, but
    //  "applyPermissions" seemed more apropriate
    schema.methods.applyPermissions = function applyPermissions(permissions = []) {
      permissions.forEach((permission) => {
        Object.entries(schema.obj).forEach(([key, value]) => {

          const isArray = Object.prototype.toString.call(value) === '[object Array]'
          const definition = isArray ? value[0] : value

          const fieldPermissions = definition.permissions || []

          if (fieldPermissions.includes(permission)) {

            delete this[key]

            // this will "preserve" keys but set them to null / empty values
            //
            // if (isArray) {
            //   this[key] = []
            // } else if (typeof definition.default !== 'undefined') {
            //   this[key] = definition.default
            // } else {
            //   delete this[key]
            // }
          }

        })
      })
    }
  })

  const connectionOptions = { useMongoClient: true }

  const connections = {
    eelConnection: mongoose.createConnection(config.mongodb.dbUris.eel, connectionOptions),
    codexRegistryConnection: mongoose.createConnection(config.mongodb.dbUris.codexRegistry, connectionOptions),
  }

  return Bluebird.props(connections)
    .then((result) => {
      mongooseService.eel = result.eelConnection
      mongooseService.codexRegistry = result.codexRegistryConnection
      return app
    })
    .catch((error) => {
      logger.error('could not connect to database(s), please make sure mongodb is running', error)
    })

}
