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

    let s3Path = 'files'
    const s3Bucket = config.aws.s3.bucket

    // production has it's own dedicated bucket, so there's no need to prefix
    //  the path with the environment
    if (process.env.NODE_ENV !== 'production') {
      s3Path = `${process.env.NODE_ENV}/${s3Path}`
    }

    return s3Service.uploadFiles(request.files, s3Bucket, s3Path)
      .then((newCodexRecordFilesData) => {

        newCodexRecordFilesData.forEach((newCodexRecordFileData) => {
          newCodexRecordFileData.creatorAddress = response.locals.userAddress
        })

        return models.CodexRecordFile.insertMany(newCodexRecordFilesData, insertManyOptions)

      })

  },

}
