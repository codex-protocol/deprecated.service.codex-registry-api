import mongoose from 'mongoose'

// import config from '../config'
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
  ownerAddress: {
    index: true,
    type: String,
    required: true,
    lowercase: true,
    // TODO: add validators to make sure only proper addresses can be specified
  },
  approvedAddress: {
    type: String,
    sparse: true,
    default: null,
    lowercase: true,
    // TODO: add validators to make sure only proper addresses can be specified
  },
  nameHash: {
    type: String,
    required: true,
    lowercase: true,
  },
  descriptionHash: {
    type: String,
    default: null,
    lowercase: true,
  },
  providerId: {
    type: String, // TODO: use mongoose.Schema.Types.ObjectId?
    default: null,
    // ref: 'Provider', // TODO: link this to a Provider model?
  },
  providerMetadataId: {
    type: String,
    default: null,
  },
  isPrivate: {
    type: Boolean,
    default: true,
  },
  // this is a list of addresses explicitly allowed to view this title even if
  //  it's private
  //
  // NOTE: this will not include the ownerAddress and approvedAddress addresses
  //  since those are implied as whitelisted
  whitelistedAddresses: {
    type: [{
      type: String,
      lowercase: true,
      // TODO: add validators to make sure only proper addresses can be specified
    }],
  },
  metadata: {
    default: null,
    ref: 'CodexTitleMetadata',
    type: mongoose.Schema.Types.ObjectId,
  },
  provenance: [{
    ref: 'CodexTitleTransferEvent',
    type: mongoose.Schema.Types.ObjectId,
  }],
}, schemaOptions)

schema.methods.applyPrivacyFilters = function applyPrivacyFilters(userAddress) {

  // if this isn't a private title, apply no filters
  if (!this.isPrivate) {
    return false
  }

  const approvedAddresses = [
    this.ownerAddress,
    this.approvedAddress,
    ...this.whitelistedAddresses || [],
  ]

  // if the user is logged in and an approved address, apply no filters
  if (userAddress && approvedAddresses.includes(userAddress)) {
    return false
  }

  this.depopulate('metadata')

  return true

}

schema.set('toJSON', {
  getters: true, // essentially converts _id to just id
  virtuals: true,
  transform(document, transformedDocument) {

    // remove some mongo-specicic keys that aren't necessary to send in
    //  responses
    delete transformedDocument.__v
    delete transformedDocument._id
    delete transformedDocument.id

    // remove any populations if they weren't populated, since they'll just be
    //  ObjectIds otherwise and that might expose too much information to
    //  someone who isn't allowed to view that data
    //
    // NOTE: instead of deleting keys, we'll just pretend they're empty, that
    //  way the front end can always assume the keys will be present
    if (document.provenance && document.provenance.length > 0 && !document.populated('provenance')) {
      // delete transformedDocument.provenance
      transformedDocument.provenance = []
    }

    if (document.metadata && !document.populated('metadata')) {
      // delete transformedDocument.metadata
      transformedDocument.metadata = null
    }

    return transformedDocument

  },
})

schema.set('toObject', {
  virtuals: true,
})

// make all queries for addresses lowercase, since that's how we store them
function makeQueryAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (query.ownerAddress) query.ownerAddress = query.ownerAddress.toLowerCase()
  if (query.approvedAddress) query.approvedAddress = query.ownerAddress.toLowerCase()
  next()
}

schema.pre('find', makeQueryAddressesCaseInsensitive)
schema.pre('count', makeQueryAddressesCaseInsensitive)
schema.pre('update', makeQueryAddressesCaseInsensitive)
schema.pre('findOne', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeQueryAddressesCaseInsensitive)

export default mongooseService.titleRegistry.model('CodexTitle', schema)
