import RestifyErrors from 'restify-errors'

import config from '../../config'
import models from '../../models'

export default {

  method: 'get',
  paths: [
    '/token-metadata/:tokenId',
    '/etc/token-metadata/:tokenId',
  ],

  handler(request, response) {

    return models.CodexRecord.findById(request.params.tokenId)
      .populate('metadata')
      .then((codexRecord) => {

        if (!codexRecord) {
          throw new RestifyErrors.NotFoundError(`CodexRecord with tokenId ${request.params.tokenId} does not exist.`)
        }

        const tokenMetadata = {
          name: `Codex Record #${codexRecord.tokenId}`,
          description: 'A Private Record in the Codex Registry',
          image: `https://s3.amazonaws.com/${config.aws.s3.buckets.codexRegistry}/assets/generic-record-image.png`,
        }

        if (!codexRecord.isPrivate && codexRecord.populated('metadata')) {
          tokenMetadata.name = codexRecord.metadata.name
          tokenMetadata.image = codexRecord.metadata.mainImage.uri
          tokenMetadata.description = codexRecord.metadata.description
        }

        return tokenMetadata

      })

  },

}
