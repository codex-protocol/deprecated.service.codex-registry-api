import Bluebird from 'bluebird'

import models from '../../models'

export default {

  method: 'get',
  path: '/galler(y|ies)',

  handler(request, response) {

    return models.Gallery.find()
      .then((galleries) => {

        return Bluebird.map(galleries, (gallery) => {

          // @NOTE: for phase 1, we're just going to return all public records
          //  owned by the gallery owner - phase 2 will involve some sort of front
          //  end piece that allows them to group Records into specific galleries
          const conditions = {
            ownerAddress: gallery.ownerAddress,
            isInGallery: true,
            isPrivate: false,
          }

          return models.CodexRecord.find(conditions)
            .then((codexRecords) => {

              codexRecords.forEach((codexRecord) => {
                codexRecord.setLocals({ userAddress: response.locals.userAddress })
              })

              gallery.codexRecords = codexRecords

              return gallery

            })

        })

      })
  },

}
