import Bluebird from 'bluebird'
import RestifyErrors from 'restify-errors'

import s3Service from '../services/s3'

export default (fileOptions) => {

  return (request, response, next) => {

    // this sets "files" to request.files, [request.file], or [] if no file was
    //  sent in the request
    const files = request.files || (request.file ? [request.file] : [])

    if (files.length === 0) {
      if (fileOptions.required === true) {
        throw new RestifyErrors.InvalidArgumentError(
          'A file must be specified for this endpoint.'
        )
      }
      next()
      return
    }

    if (!fileOptions.validationOptions) {
      next()
      return
    }

    Bluebird
      .map(files, (file) => {
        return s3Service.validateFile(file, fileOptions.validationOptions)
      })
      .catch(next)
      .then(() => {
        next()
      })

  }
}
