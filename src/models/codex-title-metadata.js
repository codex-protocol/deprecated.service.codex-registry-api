import mongoose from 'mongoose'
// import ethUtil from 'ethereumjs-util'
import { web3, contracts } from '@codex-protocol/ethereum-service'

// import config from '../config'
import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
}

const schema = new mongoose.Schema({
  codexTitleTokenId: {
    type: Number,
    default: null,
    ref: 'CodexTitle',
  },
  contractAddress: {
    type: String,
    required: true,
    lowercase: true,
  },
  creatorAddress: {
    type: String,
    required: true,
    lowercase: true,
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
  mintTransactionData: {
    type: String,
    required: true,
  },
}, schemaOptions)

schema.set('toJSON', {
  getters: true, // essentially converts _id to just id
  transform(document, transformedDocument) {

    // remove some mongo-specicic keys that aren't necessary to send in
    //  responses
    delete transformedDocument.__v
    delete transformedDocument._id

    return transformedDocument

  },
})

schema.pre('validate', function generateMintTransactionData(next) {

  if (!this.isNew || this.mintTransactionData) {
    next()
    return
  }

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

  this.contractAddress = contracts.CodexTitle.options.address
  this.mintTransactionData = contracts.CodexTitle.methods.mint(...mintArguments).encodeABI()

  next()

})

// make all queries for addresses lowercase, since that's how we store them
function makeQueryAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (query.creatorAddress) query.creatorAddress = query.creatorAddress.toLowerCase()
  if (query.contractAddress) query.contractAddress = query.contractAddress.toLowerCase()
  next()
}

schema.pre('find', makeQueryAddressesCaseInsensitive)
schema.pre('count', makeQueryAddressesCaseInsensitive)
schema.pre('update', makeQueryAddressesCaseInsensitive)
schema.pre('findOne', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeQueryAddressesCaseInsensitive)

export default mongooseService.titleRegistry.model('CodexTitleMetadata', schema)
