import mongoose from 'mongoose'

// import config from '../config'
import mongooseService from '../services/mongoose'

const schemaOptions = {
  timestamps: true, // let mongoose handle the createdAt and updatedAt fields
  usePushEach: true, // see https://github.com/Automattic/mongoose/issues/5574
}

const schema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
  },
  ownerAddress: {
    type: String,
    required: true,
    lowercase: true,
  },
  approvedAddress: {
    type: String,
    default: null,
    lowercase: true,
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
