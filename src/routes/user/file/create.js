import models from '../../../models'
import config from '../../../config'
import s3Service from '../../../services/s3'

const insertManyOptions = {
  ordered: false, // insert all documents possible and report errors later
}

export default {

  method: 'post',
  path: '/users?/files?',

  requireAuthentication: true,

  fileOptions: {
    as: 'files',
    multiple: true,
  },

  handler(request, response) {

    const s3Bucket = config.aws.s3.buckets.codexRegistry
    const s3Path = `${process.env.NODE_ENV}/files`

    return s3Service.uploadFiles(request.files, s3Bucket, s3Path)
      .then((newCodexRecordFilesData) => {

        newCodexRecordFilesData.forEach((newCodexRecordFileData) => {
          newCodexRecordFileData.creatorAddress = response.locals.userAddress
        })

        return models.CodexRecordFile.insertMany(newCodexRecordFilesData, insertManyOptions)

      })

  },

}
