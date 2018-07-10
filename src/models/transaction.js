import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
}

const schema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'faucet-transfer',
      'giveaway-mint',
    ],
  },
  status: {
    type: String,
    enum: [
      'created',
      'pending',
      'error',
    ],
  },
  tx: mongoose.Schema.Types.Mixed,
}, schemaOptions)

schema.set('toObject', {
  virtuals: true,
})

export default mongooseService.codexRegistry.model('Transaction', schema)
