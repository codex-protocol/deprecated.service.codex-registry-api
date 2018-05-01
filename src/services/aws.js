import aws from 'aws-sdk'

import config from '../config'

aws.config.update({
  region: config.aws.region,
})

const s3 = new aws.S3({
  httpOptions: {
    timeout: 20 * 60 * 1000,
  },
})

export {
  aws,
  s3,
}

export default aws
