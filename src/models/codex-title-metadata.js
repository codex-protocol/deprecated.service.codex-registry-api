import mongoose from 'mongoose'
// import ethUtil from 'ethereumjs-util'
import { web3, contracts } from '@codex-protocol/ethereum-service'

// import config from '../config'
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
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  files: [{
    ref: 'CodexTitleFile',
    type: mongoose.Schema.Types.ObjectId,
  }],
}, schemaOptions)

schema.set('toJSON', {
  getters: true, // essentially converts _id to just id
  transform(document, transformedDocument) {

    // remove some mongo-specicic keys that aren't necessary to send in
    //  responses
    delete transformedDocument.__v
    delete transformedDocument._id

    // remove any populations if they weren't populated, since they'll just be
    //  ObjectIds otherwise and that might expose too much information to
    //  someone who isn't allowed to view that data
    //
    // NOTE: instead of deleting keys, we'll just pretend they're empty, that
    //  way the front end can always assume the keys will be present
    if (document.files.length > 0 && !document.populated('files')) {
      // delete transformedDocument.files
      transformedDocument.files = []
    }

    return transformedDocument

  },
})

schema.methods.generateMintTransactionData = function generateMintTransactionData() {

  const mintArguments = [
    this.creatorAddress,
    web3.utils.soliditySha3(this.name),
    web3.utils.soliditySha3(this.description || ''),
    web3.utils.soliditySha3('image data here'), // TODO: calculate image hashes
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
  if (query.creatorAddress) query.creatorAddress = query.creatorAddress.toLowerCase()
  next()
}

schema.pre('find', makeQueryAddressesCaseInsensitive)
schema.pre('count', makeQueryAddressesCaseInsensitive)
schema.pre('update', makeQueryAddressesCaseInsensitive)
schema.pre('findOne', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeQueryAddressesCaseInsensitive)

// always get files for metadata
function populateFiles(next) {
  this.populate('files')
  next()
}

schema.pre('find', populateFiles)
schema.pre('findOne', populateFiles)
schema.pre('findOneAndUpdate', populateFiles)

export default mongooseService.titleRegistry.model('CodexTitleMetadata', schema)
