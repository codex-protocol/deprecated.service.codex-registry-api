import mongoose from 'mongoose'
import {
  web3,
  contracts,
} from '@codex-protocol/ethereum-service'

import models from '../models'
import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
  usePushEach: true, // see https://github.com/Automattic/mongoose/issues/5574
}

const schema = new mongoose.Schema({
  codexTitleTokenId: {
    type: String,
    default: null,
    ref: 'CodexTitle',
  },
  creatorAddress: {
    type: String,
    required: true,
    lowercase: true,
    // TODO: add validators to make sure only proper addresses can be specified
  },
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
    ref: 'CodexTitleFile',
    type: mongoose.Schema.Types.ObjectId,
  },
  images: [{
    ref: 'CodexTitleFile',
    type: mongoose.Schema.Types.ObjectId,
  }],
  files: [{
    ref: 'CodexTitleFile',
    type: mongoose.Schema.Types.ObjectId,
  }],
  pendingUpdates: [{
    ref: 'CodexTitleMetadataPendingUpdate',
    type: mongoose.Schema.Types.ObjectId,
  }],
}, schemaOptions)

schema.virtual('hasPendingUpdates').get(function getHasPendingUpdates() {
  return this.pendingUpdates.length > 0
})

schema.virtual('fileHashes').get(function getFileHashes() {
  return [
    this.mainImage.hash,
    ...this.images.map((image) => { return image.hash }),
    ...this.files.map((file) => { return file.hash }),
  ]
})

schema.set('toObject', {
  virtuals: true,
})

schema.set('toJSON', {
  getters: true, // essentially converts _id to just id
  virtuals: true,
  versionKey: false,
  transform(document, transformedDocument) {

    // remove some mongo-specicic keys that aren't necessary to send in
    //  responses
    delete transformedDocument._id

    // remove any populations if they weren't populated, since they'll just be
    //  ObjectIds otherwise and that might expose too much information to
    //  someone who isn't allowed to view that data
    //
    // NOTE: instead of deleting keys, we'll just pretend they're empty, that
    //  way the front end can always assume the keys will be present
    if (document.mainImage && !document.populated('mainImage')) {
      // delete transformedDocument.mainImage
      transformedDocument.mainImage = null
    }

    if (document.images.length > 0 && !document.populated('images')) {
      // delete transformedDocument.images
      transformedDocument.images = []
    }

    if (document.files.length > 0 && !document.populated('files')) {
      // delete transformedDocument.files
      transformedDocument.files = []
    }

    if (document.pendingUpdates.length > 0 && !document.populated('pendingUpdates')) {
      // delete transformedDocument.pendingUpdates
      transformedDocument.pendingUpdates = []
    }

    return transformedDocument

  },
})

schema.methods.generateMintTransactionData = function generateMintTransactionData() {

  const mintArguments = [
    this.creatorAddress,
    this.nameHash,
    this.descriptionHash || '',
    this.fileHashes,
    '1', // TODO: sort out proper provider ID functionality
    this.id,
  ]

  return {
    contractAddress: contracts.CodexTitle.options.address,
    mintTransactionData: contracts.CodexTitle.methods.mint(...mintArguments).encodeABI(),
  }

}

schema.methods.generateModifyMetadataHashesTransactionData = function generateModifyMetadataHashesTransactionData(pendingUpdate) {

  if (!pendingUpdate) {
    throw new Error('generateModifyMetadataHashesTransactionData could not be called because a pendingUpdate was not specified.')
  }

  const modifyMetadataHashesArguments = [
    this.codexTitleTokenId,
    pendingUpdate.nameHash,
    pendingUpdate.descriptionHash || '',
    pendingUpdate.fileHashes,
    '1', // TODO: sort out proper provider ID functionality
    this.id,
  ]

  return {
    contractAddress: contracts.CodexTitle.options.address,
    mintTransactionData: contracts.CodexTitle.methods.modifyMetadataHashes(...modifyMetadataHashesArguments).encodeABI(),
  }

}

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

// always get images, files, and pendingUpdates
function populate(next) {
  this.populate('pendingUpdates mainImage images files')
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

function setTitleHashesBeforeSave(next) {
  return models.CodexTitle
    .updateOne(
      { _id: this.codexTitleTokenId },
      { $set: { nameHash: this.nameHash, descriptionHash: this.descriptionHash } }
    )
    .then(next)
    .catch(next)
}

schema.pre('validate', setHashesBeforeValidation)
schema.pre('save', setTitleHashesBeforeSave)

// unless an ID is specified in the bulk update query, there's no way to
//  update the parent CodexTitle records without first running the query and
//  grabbing all matching IDs... and if an ID is passed, then why not just
//  find & save?
schema.pre('update', (next) => {
  return next(new Error('Bulk updating metadata is not supported as it has some tricky implications with updating hashes on the parent CodexTitle record. Please find & save instead.'))
})

export default mongooseService.codexRegistry.model('CodexTitleMetadata', schema)
