import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const { Schema } = mongoose

const CodexTitleSchema = new Schema({
  description: '',
  imageUri: '',
  name: '',
})

const CodexTitle = mongooseService.titleRegistry.model('CodexTitle', CodexTitleSchema)

export default CodexTitle
