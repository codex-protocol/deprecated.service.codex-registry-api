import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  numberOfEditions: {
    type: Number,
    required: true,
  },
  numberOfEditionsRemaining: {
    type: Number,
    required: true,
  },

  metadata: {
    default: null,
    ref: 'CodexRecordMetadata',
    required: true,
    type: mongoose.Schema.Types.ObjectId,
  },
})

// always get metadata
function populate(next) {
  this.populate('metadata')
  next()
}

schema.pre('find', populate)
schema.pre('findOne', populate)
schema.pre('findOneAndUpdate', populate)

export default mongooseService.codexRegistry.model('Giveaway', schema)
