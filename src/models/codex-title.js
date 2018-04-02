import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
  usePushEach: true, // see https://github.com/Automattic/mongoose/issues/5574
}

const schema = new mongoose.Schema({
  // instead of using an auto-generated ObjectId, let's just use the tokenId
  //  stored in the smart contract since it's already a unique identifier for
  //  this title (and also makes mapping DB records to smart contract records
  //  easier)
  _id: {
    type: Number,
    required: true,
    alias: 'tokenId',
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  imageUri: {
    type: String,
    default: null,
  },
  ownerAddress: {
    type: String,
    required: true,
  },
  approvedAddress: {
    type: String,
    default: null,
  },
  provenance: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodexTitleTransferEvent',
  }],
}, schemaOptions)

schema.set('toJSON', {
  virtuals: true,
  transform(document, transformedDocument) {

    // remove some mongo-specicic keys that aren't necessary to send in
    //  responses
    delete transformedDocument.__v
    delete transformedDocument._id
    delete transformedDocument.id

    // convert addresses to lowercase from their checksum counterpart because
    //  MetaMask always expects the lowercase format and not the checksum format
    if (document.ownerAddress) transformedDocument.ownerAddress = document.ownerAddress.toLowerCase()
    if (document.approvedAddress) transformedDocument.approvedAddress = document.approvedAddress.toLowerCase()

    return transformedDocument

  },
})

schema.set('toObject', {
  virtuals: true,
})

// make all queries for addresses case insensitive
//
// TODO: maybe it's better to just convert the addresses to lowercase before
//  saving the documents like John did initially so we don't incur the
//  additional overhead for every query 🤔
function makeAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (query.ownerAddress) query.ownerAddress = new RegExp(`^${query.ownerAddress}$`, 'i')
  if (query.approvedAddress) query.approvedAddress = new RegExp(`^${query.approvedAddress}$`, 'i')
  next()
}
schema.pre('find', makeAddressesCaseInsensitive)
schema.pre('count', makeAddressesCaseInsensitive)
schema.pre('update', makeAddressesCaseInsensitive)
schema.pre('findOne', makeAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeAddressesCaseInsensitive)

export default mongooseService.titleRegistry.model('CodexTitle', schema)
