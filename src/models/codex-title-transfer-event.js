import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schema = new mongoose.Schema({
  codexTitleTokenId: {
    type: Number,
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
  oldOwnerAddress: {
    type: String,
    required: true,
  },
  newOwnerAddress: {
    type: String,
    required: true,
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

// remove some mongo-specicic keys that aren't necessary to send in responses
schema.set('toJSON', {
  virtuals: true,
  transform(document, transformedDocument) {
    delete transformedDocument.__v
    delete transformedDocument._id
    return transformedDocument
  },
})

export default mongooseService.titleRegistry.model('CodexTitleTransferEvent', schema)
