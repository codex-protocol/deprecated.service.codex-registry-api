import shortid from 'shortid'
import mongoose from 'mongoose'

import logger from '../services/logger'
import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
}

const schema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    default: shortid.generate,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  metadataUrl: {
    type: String,
    default: null,
  },
}, schemaOptions)

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(document, transformedDocument) {

    // remove some mongo-specific keys that aren't necessary to send in
    //  responses
    delete transformedDocument._id

    return transformedDocument

  },
})

schema.set('toObject', {
  virtuals: true,
})

const Provider = mongooseService.codexRegistry.model('Provider', schema)

// create a Provider for this API if it doesn't exist yet...
const newProviderOptions = {
  setDefaultsOnInsert: true,
  upsert: true,
}

Provider.findByIdAndUpdate(process.env.METADATA_PROVIDER_ID, {}, newProviderOptions)
  .then((existingRecord) => {
    if (!existingRecord) {
      logger.warn(`Provider with id "${process.env.METADATA_PROVIDER_ID}" did not exist, but one was created automatically.`)
    }
  })

export default Provider
