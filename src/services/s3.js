import fs from 'fs'
import Bluebird from 'bluebird'
import getFileType from 'file-type'
import RestifyErrors from 'restify-errors'
import probeImageSize from 'probe-image-size'
import { web3 } from '@codex-protocol/ethereum-service'

import { s3 } from './aws'
import logger from './logger'

const readFile = Bluebird.promisify(fs.readFile)
const s3PutObject = Bluebird.promisify(s3.putObject, { context: s3 })
const s3DeleteObjects = Bluebird.promisify(s3.deleteObjects, { context: s3 })

export default {

  uploadFile(file, s3Bucket, s3Path, options) {
    return this.uploadFiles([file], s3Bucket, s3Path, options)
      .then((uploadedFilesData) => {
        return uploadedFilesData[0]
      })
  },

  uploadFiles(files, s3Bucket, s3Path, options = {}) {

    return Bluebird.map(files, (file) => {

      const getFileBufferPromise = Bluebird.resolve(file.buffer || readFile(file.path))

      return getFileBufferPromise
        .catch((error) => {
          logger.warn('could not read tmp file', file.path, error)
          throw new RestifyErrors.InternalServerError(
            'Could not read file.'
          )
        })
        .then((fileBuffer) => {

          file.buffer = fileBuffer

          // try to calculate the real mime type based on the "magic number" of
          //  the binary data instead of relying on the extension (what multer
          //  does)
          const bufferFileType = getFileType(file.buffer)

          if (bufferFileType) {
            file.mimetype = bufferFileType.mime || file.mimetype
          }

          const s3Key = `${s3Path}/${file.filename}`

          const s3Params = {
            Key: s3Key,
            Bucket: s3Bucket,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read', // TODO: change this to only allow api IAM user?
          }

          return s3PutObject(s3Params)
            .then(() => {

              let fileType = null

              // if this is an image, get it's size
              if (/^image\//.test(file.mimetype)) {
                fileType = 'image'
                file.dimensions = file.dimensions || probeImageSize.sync(file.buffer) || { width: null, height: null }
              }

              return {
                s3Key,
                s3Bucket,
                fileType,
                size: file.size,
                name: file.originalname,
                mimeType: file.mimetype,
                width: file.dimensions.width,
                height: file.dimensions.height,
                hash: web3.utils.soliditySha3(file.buffer.toString('binary')),
              }
            })
        })
        .finally(() => {
          fs.unlink(file.path, (error) => {
            if (error) {
              // just ignore unlink errors since files are stored in /tmp anyway
              logger.warn('could not delete tmp file', file.path, error)
            }
          })
        })
    })
  },

  deleteFiles(bucket, s3Key) {

    const s3Keys = (Object.prototype.toString.call(s3Key) === '[object Array]') ? s3Key : [s3Key]

    const Objects = s3Keys.map((Key) => {
      return { Key }
    })

    return s3DeleteObjects({
      Bucket: bucket,
      Delete: {
        Objects,
      },
    })
  },

}
