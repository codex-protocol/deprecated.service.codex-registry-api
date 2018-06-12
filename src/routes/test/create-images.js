import config from '../../config'
import models from '../../models'

const s3Keys = [
  'development/test-images/01.jpg',
  'development/test-images/02.jpg',
  'development/test-images/03.jpg',
  'development/test-images/04.jpg',
  'development/test-images/05.jpg',
  'development/test-images/06.jpg',
  'development/test-images/07.jpg',
  'development/test-images/08.jpg',
  'development/test-images/09.jpg',
  'development/test-images/10.jpg',
  'development/test-images/11.jpg',
  'development/test-images/12.jpg',
  'development/test-images/13.jpg',
  'development/test-images/14.jpg',
  'development/test-images/15.jpg',
  'development/test-images/16.jpg',
  'development/test-images/17.jpg',
  'development/test-images/18.jpg',
  'development/test-images/19.jpg',
  'development/test-images/20.jpg',
]

const mockImages = s3Keys.map((s3Key, index) => {
  return {
    s3Key,
    size: 0,
    fileType: 'image',
    creatorAddress: '0x0',
    mimeType: 'image/jpeg',
    name: `Image ${index + 1}`,
    s3Bucket: config.aws.s3.buckets.codexRegistry,
    hash: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
  }
})

export default {

  method: 'post',
  paths: [
    '/test/create-images',
    '/test/create-images/:imageCount',
  ],

  restrictToEnvironments: [
    'development',
  ],

  handler(request, response) {

    request.params.imageCount = request.params.imageCount || 1

    if (request.params.imageCount > mockImages.length) {
      request.params.imageCount = mockImages.length
    }

    return models.CodexRecordFile.insertMany(mockImages.slice(0, request.params.imageCount))

  },

}
