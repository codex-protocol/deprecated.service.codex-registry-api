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

    const s3Bucket = config.aws.s3.buckets.titleRegistry
    const s3Path = `${process.env.NODE_ENV}/title-files`

    return s3Service.uploadFiles(request.files, s3Bucket, s3Path)
      .then((newCodexTitleFilesData) => {

        newCodexTitleFilesData.forEach((newCodexTitleFileData) => {
          newCodexTitleFileData.creatorAddress = response.locals.userAddress
        })

        return models.CodexTitleFile.insertMany(newCodexTitleFilesData, insertManyOptions)

      })

  },

}
