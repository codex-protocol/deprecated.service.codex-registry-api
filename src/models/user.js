import mongoose from 'mongoose'

import config from '../config'
import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
}

const schema = new mongoose.Schema({
  // instead of using an auto-generated ObjectId, let's just use the user's
  //  wallet address since it's already a unique identifier
  _id: {
    type: String,
    required: true,
    lowercase: true,
    alias: 'address',
  },
  email: {
    type: String,
    default: null,
  },
  faucetLastRequestedAt: {
    type: Date,
    default: null,
  },
}, schemaOptions)

schema.virtual('canRequestFaucetTokens').get(function getCanRequestFaucetTokens() {
  return process.env.NODE_ENV !== 'production' && (this.faucetLastRequestedAt === null || Date.now() - this.faucetLastRequestedAt.getTime() >= config.faucet.cooldown)
})

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(document, transformedDocument) {

    // remove some mongo-specicic keys that aren't necessary to send in
    //  responses
    delete transformedDocument._id
    delete transformedDocument.id

    return transformedDocument

  },
})

schema.set('toObject', {
  virtuals: true,
})

// make all queries for addresses case insensitive
function makeAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (typeof query.id === 'string') query.id = query.id.toLowerCase()
  if (typeof query._id === 'string') query._id = query._id.toLowerCase()
  if (typeof query.address === 'string') query.address = query.address.toLowerCase()
  next()
}

schema.pre('find', makeAddressesCaseInsensitive)
schema.pre('count', makeAddressesCaseInsensitive)
schema.pre('update', makeAddressesCaseInsensitive)
schema.pre('findOne', makeAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeAddressesCaseInsensitive)

export default mongooseService.codexRegistry.model('User', schema)
