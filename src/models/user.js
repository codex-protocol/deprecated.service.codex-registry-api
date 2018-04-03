import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
  usePushEach: true, // see https://github.com/Automattic/mongoose/issues/5574
}

const schema = new mongoose.Schema({
  // instead of using an auto-generated ObjectId, let's just use the user's
  //  wallet address since it's already a unique identifier
  _id: {
    type: String,
    required: true,
    alias: 'address',
  },
  email: {
    type: String,
    default: null,
  },
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
    if (document.address) transformedDocument.address = document.address.toLowerCase()

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
  if (query.address) query.address = new RegExp(`^${query.address}$`, 'i')
  next()
}
schema.pre('find', makeAddressesCaseInsensitive)
schema.pre('count', makeAddressesCaseInsensitive)
schema.pre('update', makeAddressesCaseInsensitive)
schema.pre('findOne', makeAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeAddressesCaseInsensitive)

export default mongooseService.titleRegistry.model('User', schema)
