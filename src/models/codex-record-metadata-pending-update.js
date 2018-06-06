import mongoose from 'mongoose'
import { web3 } from '@codex-protocol/ethereum-service'

import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
  usePushEach: true, // see https://github.com/Automattic/mongoose/issues/5574
}

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  nameHash: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  descriptionHash: {
    type: String,
    default: null,
  },
  mainImage: {
    required: true,
    ref: 'CodexRecordFile',
    type: mongoose.Schema.Types.ObjectId,
  },
  images: [{
    ref: 'CodexRecordFile',
    type: mongoose.Schema.Types.ObjectId,
  }],
  files: [{
    ref: 'CodexRecordFile',
    type: mongoose.Schema.Types.ObjectId,
  }],
}, schemaOptions)

schema.virtual('fileHashes').get(function getFileHashes() {

  const hashes = [
    ...this.images.map((image) => { return image.hash }),
    ...this.files.map((file) => { return file.hash }),
  ]

  if (this.mainImage && this.mainImage.hash) {
    hashes.unshift(this.mainImage.hash)
  }

  return hashes.sort()

})

schema.set('toObject', {
  virtuals: true,
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

// always get images & files
function populate(next) {
  this.populate('mainImage images files')
  next()
}

schema.pre('find', populate)
schema.pre('findOne', populate)
schema.pre('findOneAndUpdate', populate)

// set hashes when their unhashed counterparts are set
function setHashesBeforeValidation(next) {
  this.nameHash = web3.utils.soliditySha3(this.name)
  this.descriptionHash = this.description ? web3.utils.soliditySha3(this.description) : null
  next()
}

schema.pre('validate', setHashesBeforeValidation)

// unless an ID is specified in the bulk update query, there's no way to
//  update the parent CodexRecord records without first running the query and
//  grabbing all matching IDs... and if an ID is passed, then why not just
//  find & save?
schema.pre('update', (next) => {
  return next(new Error('Bulk updating metadata is not supported as it has some tricky implications with updating hashes on the parent CodexRecordMetadata record. Please find & save instead.'))
})

export default mongooseService.codexRegistry.model('CodexRecordMetadataPendingUpdate', schema)
