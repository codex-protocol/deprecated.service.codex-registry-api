import mongoose from 'mongoose'
// import ethUtil from 'ethereumjs-util'
import {
  // web3,
  contracts,
} from '@codex-protocol/ethereum-service'

// import config from '../config'
import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
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
    default: null,
    required: true,
    ref: 'CodexTitleFile',
    type: mongoose.Schema.Types.ObjectId,
  },
  images: [{
    ref: 'CodexTitleFile',
    type: mongoose.Schema.Types.ObjectId,
  }],
}, schemaOptions)

schema.set('toJSON', {
  getters: true, // essentially converts _id to just id
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

    return transformedDocument

  },
})

schema.methods.generateMintTransactionData = function generateMintTransactionData() {

  const mintArguments = [
    this.creatorAddress,
    this.nameHash,
    this.descriptionHash || '',
    [this.mainImage.hash],
    '1', // TODO: sort out proper provider ID functionality
    this.id,
  ]

  // const hashedMintArguments = web3.utils.soliditySha3(...mintArguments)
  // const hashedMessage = ethUtil.sha3(`\x19Ethereum Signed Message:\n${hashedMintArguments.length}${hashedMintArguments}`)
  // const signResult = ethUtil.ecsign(hashedMessage, config.blockchain.signerPrivateKeyBuffer)
  //
  // mintArguments.push(signResult.v, signResult.r, signResult.s)

  return {
    contractAddress: contracts.CodexTitle.options.address,
    mintTransactionData: contracts.CodexTitle.methods.mint(...mintArguments).encodeABI(),
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

// always get images for metadata
function populateImages(next) {
  this.populate('mainImage')
  this.populate('images')
  next()
}

schema.pre('find', populateImages)
schema.pre('findOne', populateImages)
schema.pre('findOneAndUpdate', populateImages)

// set hashes when their unhashed counterparts are set
schema.pre('validate', function setHashesBeforeValidation(next) {
  this.nameHash = web3.utils.soliditySha3(this.name)
  this.descriptionHash = this.description ? web3.utils.soliditySha3(this.description) : null
  next()
})

schema.pre('save', function setTitleHashesBeforeSave(next) {
  return models.CodexTitle
    .updateOne(
      { _id: this.codexTitleTokenId },
      { $set: { nameHash: this.nameHash, descriptionHash: this.descriptionHash } }
    )
    .then(next)
    .catch(next)
})

// eslint-disable-next-line prefer-arrow-callback
schema.pre('update', function setHashesBeforeUpdate(next) {

  // unless an ID is specified in the bulk update query, there's no way to
  //  update the parent CodexTitle records without first running the query and
  //  grabbing all matching IDs... and if an ID is passed, then why not just
  //  find & save?
  return next(new Error('Bulk updating metadata is not supported as it has some tricky implications with updating hashes on the parent CodexTitle record. Please find & save instead.'))

  // const update = this.getUpdate()
  //
  // if (!update.$set) return next()
  //
  // // NOTE: this should never be possible since name is required
  // if (update.$set.name === null) {
  //   delete update.$set.nameHash
  //   delete update.$set.name
  // }
  //
  // if (update.$set.description === null) update.$set.descriptionHash = null
  // if (typeof update.$set.name === 'string') update.$set.nameHash = web3.utils.soliditySha3(update.$set.name)
  // if (typeof update.$set.description === 'string') update.$set.descriptionHash = web3.utils.soliditySha3(update.$set.description)
  //
  // return next()

})

export default mongooseService.codexRegistry.model('CodexTitleMetadata', schema)
