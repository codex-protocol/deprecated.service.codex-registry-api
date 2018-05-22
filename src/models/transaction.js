import mongoose from 'mongoose'

// import config from '../config'
import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
}

const schema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'faucet-transfer',
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

export default mongooseService.titleRegistry.model('Transaction', schema)
