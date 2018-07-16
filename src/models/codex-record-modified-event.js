import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const sortByFileHash = (a, b) => {
  return a.hash.localeCompare(b.hash)
}

const nullDescriptionHash = `0x${new Array(64).fill(0).join('')}`

// @NOTE: all of the hashes below are NOT calculated by the API and are the
//  hashes as they exist in the smart contract
const schema = new mongoose.Schema({
  modifierAddress: {
    type: String,
    required: true,
    lowercase: true,
    // @TODO: add validators to make sure only proper addresses can be specified
  },
  provider: {
    default: null,
    ref: 'Provider',
    type: mongoose.Schema.Types.ObjectId,
  },
  providerId: {
    type: 'String',
    required: true,
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
  //  a third-party hosted Record, none of the non-hash values will exist
  //
  // @NOTE: this can't just use the blockchain-provided hases since we wouldn't
  //  be discern between images, files, and mainImage file hashes
  if (!this.provider || this.provider.id !== process.env.METADATA_PROVIDER_ID) {
    return null
  }

  const sortedNewImages = Array.from(this.newImages).sort(sortByFileHash)
  const sortedOldImages = Array.from(this.oldImages).sort(sortByFileHash)
  const sortedNewFiles = Array.from(this.newFiles).sort(sortByFileHash)
  const sortedOldFiles = Array.from(this.oldFiles).sort(sortByFileHash)

  const imagesChanged = this.newImages.length !== this.oldImages.length || sortedOldImages.some((oldImage, index) => {
    return oldImage.hash !== sortedNewImages[index].hash
  })

  const filesChanged = this.newFiles.length !== this.oldFiles.length || sortedOldFiles.some((oldFile, index) => {
    return oldFile.hash !== sortedNewFiles[index].hash
  })

  const mainImageChanged = (this.oldMainImage && this.newMainImage) ? this.oldMainImage.hash !== this.newMainImage.hash : false

  return {
    files: filesChanged,
    images: imagesChanged,
    mainImage: mainImageChanged,
    name: this.oldName !== this.newName,
    description: this.oldDescription !== this.newDescription,
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

// always get images, files, pendingUpdates, etc
function populate(next) {
  this.populate('provider newMainImage newImages newFiles oldMainImage oldImages oldFiles')
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
