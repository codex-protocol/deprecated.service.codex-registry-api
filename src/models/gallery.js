import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
  usePushEach: true, // see https://github.com/Automattic/mongoose/issues/5574
}

const schema = new mongoose.Schema({
  ownerAddress: {
    index: true,
    type: String,
    required: true,
    lowercase: true,
    // @TODO: add validators to make sure only proper addresses can be specified
  },
  shareCode: {
    index: true,
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  slideDuration: {
    type: Number,
    default: null,
  },
  codexRecords: [{
    ref: 'CodexRecord',
    type: mongoose.Schema.Types.ObjectId,
  }],
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

// make all queries for addresses case insensitive
function makeQueryAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (typeof query.ownerAddress === 'string') query.ownerAddress = query.ownerAddress.toLowerCase()
  next()
}

schema.pre('find', makeQueryAddressesCaseInsensitive)
schema.pre('count', makeQueryAddressesCaseInsensitive)
schema.pre('update', makeQueryAddressesCaseInsensitive)
schema.pre('findOne', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeQueryAddressesCaseInsensitive)

// always get codexRecords
function populate(next) {
  this.populate('codexRecords')
  next()
}

schema.pre('find', populate)
schema.pre('findOne', populate)
schema.pre('findOneAndUpdate', populate)

export default mongooseService.codexRegistry.model('Gallery', schema)
