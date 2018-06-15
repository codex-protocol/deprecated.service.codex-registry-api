import mongoose from 'mongoose'

import config from '../config'
import mongooseService from '../services/mongoose'
import { schema as codexRecordFileSchema } from './codex-record-file'

const codexRecordFileSchemaCopy = new mongoose.Schema(codexRecordFileSchema.obj, { _id: false })

codexRecordFileSchemaCopy.set('toJSON', {
  virtuals: true,
})

codexRecordFileSchemaCopy.set('toObject', {
  virtuals: true,
})

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  numberOfEditions: {
    type: Number,
    required: true,
  },
  numberOfEditionsRemaining: {
    type: Number,
    required: true,
  },
  editionDetails: {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    mainImage: codexRecordFileSchemaCopy,
  },
})

codexRecordFileSchemaCopy.virtual('uri').get(function getUri() {
  return `${config.aws.s3.uriPrefix}/${this.s3Bucket}/${this.s3Key}`
})

schema.set('toJSON', {
  getters: true, // essentially converts _id to just id
  versionKey: false,
  transform(document, transformedDocument) {

    // remove some mongo-specific keys that aren't necessary to send in
    //  responses
    delete transformedDocument._id

    return transformedDocument

  },
})

export default mongooseService.codexRegistry.model('Giveaway', schema)
