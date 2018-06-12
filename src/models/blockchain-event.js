import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schema = new mongoose.Schema({
  eventName: {
    index: true,
    type: String,
  },
  blockNumber: Number,
  contractName: String,
  contractAddress: String,
  transactionHash: String,
  returnValues: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: () => {
      return Date.now()
    },
  },
})

schema.index({ blockNumber: 1, contractName: 1 })

export default mongooseService.eel.model('BlockchainEvent', schema)
