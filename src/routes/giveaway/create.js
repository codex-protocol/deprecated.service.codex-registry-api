import ethUtil from 'ethereumjs-util'

import config from '../../config'
import models from '../../models'

export default {

  method: 'post',
  path: '/giveaways?',

  requireAuthentication: true,

  restrictToEnvironments: [
    'development',
  ],

  handler(request, response) {

    const newGiveawayData = {

      name: 'New User Giveaway!',

      numberOfEditions: 1000,
      numberOfEditionsRemaining: 1000,

      editionDetails: {
        name: 'Full Assembly',
        description: `
          Artist: Sebastian Tory-Pratt
          Medium: Digital Collage

          https://www.instagram.com/sebcreates/

          Created exclusively for early users of Codex Viewer.
        `.replace(/\n +/g, '\n').trim(),

        mainImage: {
          hash: '0x8d0bb7f5b53f4908e8a89c33bf34ac33b9840e8ce1d0e4a2d1ced9c02627e7ef',
          s3Bucket: config.aws.s3.bucket,
          creatorAddress: ethUtil.zeroAddress(),
          s3Key: 'giveaways/full-assembly.jpg',
          name: 'full-assembly.jpg',
          mimeType: 'image/jpeg',
          fileType: 'image',
          size: '1042343',
          height: '1300',
          width: '1300',
        },

      },
    }

    return new models.Giveaway(newGiveawayData).save()

  },

}
