import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const { Schema } = mongoose

const BlockchainEventSchema = new Schema({
  eventName: String,
  blockNumber: Number,
  contractName: String,
  contractAddress: String,
  transactionHash: String,
  returnValues: Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: () => {
      return Date.now()
    },
  },
})

const BlockchainEvent = mongooseService.eel.model('BlockchainEvent', BlockchainEventSchema)

export default BlockchainEvent
