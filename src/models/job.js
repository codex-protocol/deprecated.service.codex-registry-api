import mongoose from 'mongoose'

import mongooseService from '../services/mongoose'

const { Schema } = mongoose

const JobSchema = new Schema({
  name: String,
  data: Schema.Types.Mixed,
})

const Job = mongooseService.titleRegistry.model('Job', JobSchema)

export default Job
