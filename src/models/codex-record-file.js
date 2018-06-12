import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
}

const schema = new mongoose.Schema({
  creatorAddress: {
    type: String,
    required: true,
    lowercase: true,
    // TODO: add validators to make sure only proper addresses can be specified
  },
  s3Key: {
    type: String,
    required: true,
  },
  s3Bucket: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
    enum: [
      'image',
      'video',
      'document',
    ],
  },
  size: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  width: {
    type: String,
    default: null,
  },
  height: {
    type: String,
    default: null,
  },
  hash: {
    type: String,
    required: true,
    lowercase: true,
  },
}, schemaOptions)

schema.virtual('uri').get(function getUri() {
  // @TODO: Investigate why, some policy issue
  if (process.env.NODE_ENV === 'production') {
    return `https://s3-us-west-2.amazonaws.com/${this.s3Bucket}/${this.s3Key}`
  }

  return `https://s3.amazonaws.com/${this.s3Bucket}/${this.s3Key}`
})

schema.set('toJSON', {
  getters: true, // essentially converts _id to just id
  virtuals: true,
  versionKey: false,
  transform(document, transformedDocument) {

    // remove some mongo-specific keys that aren't necessary to send in
    //  responses
    delete transformedDocument._id

    return transformedDocument

  },
})

schema.set('toObject', {
  virtuals: true,
})

// make all queries for addresses lowercase, since that's how we store them
function makeQueryAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (typeof query.creatorAddress === 'string') query.creatorAddress = query.creatorAddress.toLowerCase()
  next()
}

schema.pre('find', makeQueryAddressesCaseInsensitive)
schema.pre('count', makeQueryAddressesCaseInsensitive)
schema.pre('update', makeQueryAddressesCaseInsensitive)
schema.pre('findOne', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeQueryAddressesCaseInsensitive)

export default mongooseService.codexRegistry.model('CodexRecordFile', schema)
