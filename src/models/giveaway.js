import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schema = new mongoose.Schema({
  name: String,
  numberOfEditions: Number,

  // @TODO: Figure out provisioning story
  metadata: {
    default: null,
    ref: 'CodexRecordMetadata',
    type: mongoose.Schema.Types.ObjectId,
  },
})

export default mongooseService.codexRegistry.model('Giveaway', schema)
