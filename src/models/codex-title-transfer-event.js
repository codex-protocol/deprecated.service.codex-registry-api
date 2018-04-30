import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schema = new mongoose.Schema({
  codexTitleTokenId: {
    type: String,
    required: true,
    ref: 'CodexTitle',
  },
  type: {
    type: String,
    enum: [
      'create',
      'destroy',
      'transfer',
    ],
  },
  transactionHash: {
    type: String,
    required: true,
  },
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
  description: {
    type: String,
    default: null,
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
  transform(document, transformedDocument) {

    // remove some mongo-specicic keys that aren't necessary to send in
    //  responses
    delete transformedDocument.__v
    delete transformedDocument._id
    delete transformedDocument.id

    delete transformedDocument.codexTitleTokenId

    return transformedDocument

  },
})

// make all queries for addresses lowercase, since that's how we store them
function makeQueryAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (query.oldOwnerAddress) query.oldOwnerAddress = query.oldOwnerAddress.toLowerCase()
  if (query.newOwnerAddress) query.newOwnerAddress = query.newOwnerAddress.toLowerCase()
  next()
}

schema.pre('find', makeQueryAddressesCaseInsensitive)
schema.pre('count', makeQueryAddressesCaseInsensitive)
schema.pre('update', makeQueryAddressesCaseInsensitive)
schema.pre('findOne', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeQueryAddressesCaseInsensitive)

export default mongooseService.titleRegistry.model('CodexTitleTransferEvent', schema)
