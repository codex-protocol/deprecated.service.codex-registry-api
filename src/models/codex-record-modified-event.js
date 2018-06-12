import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const sortByFileHash = (a, b) => {
  return a.hash.localeCompare(b.hash)
}

const nullDescriptionHash = `0x${new Array(64).fill(0).join('')}`

// NOTE: all of the hashes below are NOT calculated by the API and are the
//  hashes as they exist in the smart contract
const schema = new mongoose.Schema({
  modifierAddress: {
    type: String,
    required: true,
    lowercase: true,
    // TODO: add validators to make sure only proper addresses can be specified
  },
  providerId: {
    type: String, // TODO: use mongoose.Schema.Types.ObjectId?
    required: true,
    // ref: 'Provider', // TODO: link this to a Provider model?
  },
  providerMetadataId: {
    type: String,
    required: true,
  },

  newNameHash: {
    type: String,
    required: true,
  },
  newDescriptionHash: {
    type: String,
    default: null,
  },
  newFileHashes: [{
    type: String,
  }],

  oldNameHash: {
    type: String,
    required: true,
  },
  oldDescriptionHash: {
    type: String,
    default: null,
  },
  oldFileHashes: [{
    type: String,
  }],

  newName: {
    type: String,
    default: null,
    permissions: ['approved'],
  },
  newDescription: {
    type: String,
    default: null,
    permissions: ['approved'],
  },
  newMainImage: {
    default: null,
    ref: 'CodexRecordFile',
    permissions: ['approved'],
    type: mongoose.Schema.Types.ObjectId,
  },
  newImages: [{
    ref: 'CodexRecordFile',
    permissions: ['approved'],
    type: mongoose.Schema.Types.ObjectId,
  }],
  newFiles: [{
    ref: 'CodexRecordFile',
    permissions: ['approved'],
    type: mongoose.Schema.Types.ObjectId,
  }],

  oldName: {
    type: String,
    default: null,
    permissions: ['approved'],
  },
  oldDescription: {
    type: String,
    default: null,
    permissions: ['approved'],
  },
  oldMainImage: {
    default: null,
    ref: 'CodexRecordFile',
    permissions: ['approved'],
    type: mongoose.Schema.Types.ObjectId,
  },
  oldImages: [{
    ref: 'CodexRecordFile',
    permissions: ['approved'],
    type: mongoose.Schema.Types.ObjectId,
  }],
  oldFiles: [{
    ref: 'CodexRecordFile',
    permissions: ['approved'],
    type: mongoose.Schema.Types.ObjectId,
  }],

  createdAt: {
    type: Date,
    default: () => {
      return Date.now()
    },
  },
})

schema.virtual('changedData').get(function getChangedData() {

  // if this instance was created as a result of processing a Modified event for
  //  a third-party hosted Record, none of the non-hash value will exist
  //
  // TODO: sort out proper provider ID functionality
  if (this.providerId !== '1') {
    return null
  }

  const sortedNewImages = Array.from(this.oldImages).sort(sortByFileHash)
  const sortedOldImages = Array.from(this.oldImages).sort(sortByFileHash)
  const sortedNewFiles = Array.from(this.oldImages).sort(sortByFileHash)
  const sortedOldFiles = Array.from(this.oldImages).sort(sortByFileHash)

  return {
    name: this.oldName !== this.newName,
    description: this.oldDescription !== this.newDescription,
    mainImage: this.oldMainImage.hash !== this.newMainImage.hash,

    images: !sortedOldImages.every((oldImage, index) => {
      return oldImage.hash === sortedNewImages[index].hash
    }),

    files: !sortedOldFiles.every((oldFile, index) => {
      return oldFile.hash === sortedNewFiles[index].hash
    }),
  }
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
    delete transformedDocument.id

    return transformedDocument

  },
})

// make all queries for addresses lowercase, since that's how we store them
function makeQueryAddressesCaseInsensitive(next) {
  const query = this.getQuery()
  if (typeof query.modifierAddress === 'string') query.modifierAddress = query.modifierAddress.toLowerCase()
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
  this.populate('newMainImage newImages newFiles oldMainImage oldImages oldFiles')
  next()
}

schema.pre('find', populate)
schema.pre('findOne', populate)
schema.pre('findOneAndUpdate', populate)

schema.pre('validate', function changeEmptyDescriptionHashesToNull(next) {
  this.oldDescriptionHash = (this.oldDescriptionHash === nullDescriptionHash) ? null : this.oldDescriptionHash
  this.newDescriptionHash = (this.newDescriptionHash === nullDescriptionHash) ? null : this.newDescriptionHash
  next()
})

export default mongooseService.codexRegistry.model('CodexRecordModifiedEvent', schema)
