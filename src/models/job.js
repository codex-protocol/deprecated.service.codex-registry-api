import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schema = new mongoose.Schema({
  name: String,
  data: mongoose.Schema.Types.Mixed,
})

export default mongooseService.titleRegistry.model('Job', schema)
