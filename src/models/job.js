import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schema = new mongoose.Schema({
  name: {
    index: true,
    type: String,
  },
  data: mongoose.Schema.Types.Mixed,
})

export default mongooseService.codexRegistry.model('Job', schema)
