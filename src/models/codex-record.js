import mongoose from 'mongoose'

import logger from '../services/logger'
import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
  usePushEach: true, // see https://github.com/Automattic/mongoose/issues/5574
}

// @NOTE: all of the hashes below are NOT calculated by the API and are the
//  hashes as they exist in the smart contract
const schema = new mongoose.Schema({
  // instead of using an auto-generated ObjectId, let's just use the tokenId
  //  stored in the smart contract since it's already a unique identifier for
  //  this Record (and also makes mapping DB records to smart contract records
  //  easier)
  _id: {
    type: String,
    required: true,
    alias: 'tokenId',
  },
  ownerAddress: {
    index: true,
    type: String,
    required: true,
    lowercase: true,
    // @TODO: add validators to make sure only proper addresses can be specified
  },
  approvedAddress: {
    type: String,
    sparse: true,
    default: null,
    lowercase: true,
    // @TODO: add validators to make sure only proper addresses can be specified
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
  fileHashes: [{
    type: String,
  }],
  providerId: {
    type: String, // @TODO: use mongoose.Schema.Types.ObjectId?
    default: null,
    // ref: 'Provider', // @TODO: link this to a Provider model?
  },
  providerMetadataId: {
    type: String,
    default: null,
  },
  isPrivate: {
    type: Boolean,
    default: true,
  },
  isHistoricalProvenancePrivate: {
    type: Boolean,
    default: true,
  },
  // has this Record been ignored by the approvedAddress? this essentially just
  //  hides it from the frontend "incoming transfer" view and has no real
  //  correlation to anything in the smart contract
  isIgnored: {
    type: Boolean,
    default: false,
  },
  // this is a list of addresses explicitly allowed to view this Record even if
  //  it's private
  //
  // @NOTE: this will not include the ownerAddress and approvedAddress addresses
  //  since those are implied as whitelisted
  whitelistedAddresses: [{
    type: String,
    lowercase: true,
    permissions: ['owner'],
    // @TODO: add validators to make sure only proper addresses can be specified
  }],
  metadata: {
    default: null,
    permissions: ['approved'],
    ref: 'CodexRecordMetadata',
    type: mongoose.Schema.Types.ObjectId,
  },
  provenance: [{
    permissions: ['logged-in'],
    ref: 'CodexRecordProvenanceEvent',
    type: mongoose.Schema.Types.ObjectId,
  }],
}, schemaOptions)

schema.set('toJSON', {
  getters: true, // essentially converts _id to just id
  virtuals: true,
  versionKey: false,
  transform(document, transformedDocument) {

    if (!document.locals) logger.warn(`CodexRecord::toJSON() is being called with no locals (instance id: ${document.id})`)

    const { userAddress } = (document.locals || {})

    if (userAddress !== document.ownerAddress) {

      // this will hold a list of "permissions" to REMOVE from this CodexRecord
      //  instance (and it's nested CodexRecord* children), as specified by the
      //  "permissions" arrays set in the schema of each model
      //
      // @NOTE: at the moment these permissions are kind of "mutually
      //  exclusive", in that only one will really be applicable for any given
      //  user
      const permissionsToApply = []

      const approvedAddresses = [
        document.ownerAddress,
        document.approvedAddress,
        ...document.whitelistedAddresses,
      ]

      // @NOTE: userAddress could be null, and document.approvedAddress could be
      //  null, so we must explicity check if userAddress is null first to avoid
      //  false positives
      if (!userAddress || !approvedAddresses.includes(userAddress)) {
        if (document.isPrivate) permissionsToApply.push('approved')
        if (document.isHistoricalProvenancePrivate) permissionsToApply.push('approved-unless-historical-provenance-is-public')
      }

      if (userAddress !== document.ownerAddress) {
        permissionsToApply.push('owner')
      }

      if (!userAddress) {
        permissionsToApply.push('logged-in')
      }

      document.applyPermissions.call(transformedDocument, permissionsToApply)

      if (document.populated('metadata') && transformedDocument.metadata) {
        document.metadata.applyPermissions.call(transformedDocument.metadata, permissionsToApply)
      }

      if (document.populated('provenance') && transformedDocument.provenance) {
        transformedDocument.provenance.forEach((provenanceEntry, index) => {
          document.provenance[index].applyPermissions.call(provenanceEntry, permissionsToApply)
          if (provenanceEntry.codexRecordModifiedEvent) {
            document.provenance[index].codexRecordModifiedEvent.applyPermissions.call(provenanceEntry.codexRecordModifiedEvent, permissionsToApply)
          }
        })
      }

    }

    // remove some mongo-specific keys that aren't necessary to send in
    //  responses
    delete transformedDocument._id
    delete transformedDocument.id

    return transformedDocument

  },
})

schema.set('toObject', {
  virtuals: true,
})

// make all queries for addresses lowercase, since that's how we store them
function makeQueryAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (typeof query.ownerAddress === 'string') query.ownerAddress = query.ownerAddress.toLowerCase()
  if (typeof query.approvedAddress === 'string') query.approvedAddress = query.approvedAddress.toLowerCase()
  next()
}

schema.pre('find', makeQueryAddressesCaseInsensitive)
schema.pre('count', makeQueryAddressesCaseInsensitive)
schema.pre('update', makeQueryAddressesCaseInsensitive)
schema.pre('findOne', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndRemove', makeQueryAddressesCaseInsensitive)
schema.pre('findOneAndUpdate', makeQueryAddressesCaseInsensitive)

// always get provenance & metadata
function populate(next) {
  this.populate('metadata')
  this.populate({
    path: 'provenance',
    options: {
      sort: '-createdAt',
    },
  })
  next()
}

schema.pre('find', populate)
schema.pre('findOne', populate)
schema.pre('findOneAndUpdate', populate)

export default mongooseService.codexRegistry.model('CodexRecord', schema)
