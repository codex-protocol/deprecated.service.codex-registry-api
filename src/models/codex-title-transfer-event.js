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


schema.set('toJSON', {
  virtuals: true,
  transform(document, transformedDocument) {

    // remove some mongo-specicic keys that aren't necessary to send in
    //  responses
    delete transformedDocument.__v
    delete transformedDocument._id

    // convert addresses to lowercase from their checksum counterpart because
    //  MetaMask always expects the lowercase format and not the checksum format
    if (document.oldOwnerAddress) transformedDocument.oldOwnerAddress = document.oldOwnerAddress.toLowerCase()
    if (document.newOwnerAddress) transformedDocument.newOwnerAddress = document.newOwnerAddress.toLowerCase()

    return transformedDocument

  },
})

// make all queries for addresses case insensitive
//
// TODO: maybe it's better to just convert the addresses to lowercase before
//  saving the documents like John did initially so we don't incur the
//  additional overhead for every query 🤔
function makeAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (query.oldOwnerAddress) query.oldOwnerAddress = new RegExp(`^${query.oldOwnerAddress}$`, 'i')
  if (query.newOwnerAddress) query.newOwnerAddress = new RegExp(`^${query.newOwnerAddress}$`, 'i')
  next()
}
schema.pre('find', makeAddressesCaseInsensitive)
schema.pre('count', makeAddressesCaseInsensitive)
schema.pre('update', makeAddressesCaseInsensitive)
schema.pre('findOne', makeAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeAddressesCaseInsensitive)


export default mongooseService.titleRegistry.model('CodexTitleTransferEvent', schema)
