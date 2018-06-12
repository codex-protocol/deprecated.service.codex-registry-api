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

  metadata: {
    default: null,
    ref: 'CodexRecordMetadata',
    required: true,
    type: mongoose.Schema.Types.ObjectId,
  },
})

export default mongooseService.codexRegistry.model('Giveaway', schema)
