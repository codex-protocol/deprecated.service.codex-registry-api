import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schema = new mongoose.Schema({
  codexRecordTokenId: {
    type: String,
    required: true,
    ref: 'CodexRecord',
  },
  type: {
    type: String,
    enum: [
      'created',
      'modified',
      'destroyed',
      'transfered',
    ],
  },
  transactionHash: {
    type: String,
    required: true,
  },

  // data specific to "create", "destroy", and "transfer" events
  oldOwnerAddress: {
    type: String,
    required: true,
    lowercase: true,
    // TODO: add validators to make sure only proper addresses can be specified
  },
  newOwnerAddress: {
    type: String,
    required: true,
    lowercase: true,
    // TODO: add validators to make sure only proper addresses can be specified
  },

  // data specific to "modified" events
  codexRecordModifiedEvent: {
    ref: 'CodexRecordModifiedEvent',
    type: mongoose.Schema.Types.ObjectId,
  },

  createdAt: {
    type: Date,
    default: () => {
      return Date.now()
    },
  },
})


schema.set('toJSON', {
  getters: true, // essentially converts _id to just id
  versionKey: false,
  transform(document, transformedDocument) {

    // remove some mongo-specific keys that aren't necessary to send in
    //  responses
    delete transformedDocument._id
    delete transformedDocument.id

    delete transformedDocument.codexRecordTokenId

    return transformedDocument

  },
})

// make all queries for addresses lowercase, since that's how we store them
function makeQueryAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (typeof query.oldOwnerAddress === 'string') query.oldOwnerAddress = query.oldOwnerAddress.toLowerCase()
  if (typeof query.newOwnerAddress === 'string') query.newOwnerAddress = query.newOwnerAddress.toLowerCase()
  next()
}

schema.pre('find', makeQueryAddressesCaseInsensitive)
schema.pre('count', makeQueryAddressesCaseInsensitive)
schema.pre('update', makeQueryAddressesCaseInsensitive)
schema.pre('findOne', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeQueryAddressesCaseInsensitive)

// always get codexRecordModifiedEvents if they exist
function populate(next) {
  this.populate('codexRecordModifiedEvent')
  next()
}

schema.pre('find', populate)
schema.pre('findOne', populate)
schema.pre('findOneAndUpdate', populate)

export default mongooseService.codexRegistry.model('CodexRecordProvenanceEvent', schema)
