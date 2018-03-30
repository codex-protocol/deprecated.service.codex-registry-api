import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
  usePushEach: true, // see https://github.com/Automattic/mongoose/issues/5574
}

const schema = new mongoose.Schema({
  // instead of using an auto-generated ObjectId, let's just use the tokenId
  //  stored in the smart contract since it's already a unique identifier for
  //  this title (and also makes mapping DB records to smart contract records
  //  easier)
  _id: {
    type: Number,
    required: true,
    alias: 'tokenId',
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  imageUri: {
    type: String,
    default: null,
  },
  ownerAddress: {
    type: String,
    required: true,
  },
  approvedAddress: {
    type: String,
    default: null,
  },
  provenance: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodexTitleTransferEvent',
  }],
}, schemaOptions)

// remove some mongo-specicic keys that aren't necessary to send in responses
schema.set('toJSON', {
  virtuals: true,
  transform(document, transformedDocument) {
    delete transformedDocument.__v
    delete transformedDocument._id
    delete transformedDocument.id
    return transformedDocument
  },
})

schema.set('toObject', {
  virtuals: true,
})

export default mongooseService.titleRegistry.model('CodexTitle', schema)
