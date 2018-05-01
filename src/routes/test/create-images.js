import models from '../../models'

const s3Keys = [
  'development/title-files/1524684721150.acf864c7-e3dc-4acf-8291-9576812aca4b.jpg',
  'development/title-files/1524684721157.16124903-7695-4a49-a633-a3d58579955e.jpg',
  'development/title-files/1524684721162.939eb319-e5a8-4526-978d-2ad653c25768.jpg',
  'development/title-files/1524684721165.226d021c-8919-4fbd-9bd5-5433f2c8419a.jpg',
  'development/title-files/1524684721175.c5e98c7c-336c-4a23-96c4-874e396b8c87.jpg',
  'development/title-files/1524684721179.ff65f3bd-d958-480a-bcb2-72ec00193322.jpg',
  'development/title-files/1524684721181.650df22a-07cc-41ea-9e5d-e0f45024e2ee.jpg',
  'development/title-files/1524684721186.1d48ba26-452c-437b-9938-a6f0110c9a38.jpg',
  'development/title-files/1524684721193.270fe65e-b729-429e-8460-c9ce1cf02067.jpg',
  'development/title-files/1524684721195.cb0986a4-8354-4e55-ac87-d6867d61cace.jpg',
  'development/title-files/1524684721196.65c090a3-0fe5-4ac9-a291-89832561efc4.jpg',
  'development/title-files/1524684721198.955d53d8-5254-4e50-84a4-99ccd4ef272b.jpg',
  'development/title-files/1524684721199.d699a110-9052-425e-8d09-b80b43fa1132.jpg',
  'development/title-files/1524684721200.4c256c08-b4c2-47c3-95ff-fd89a2dbc434.jpg',
  'development/title-files/1524684721205.345776d5-ca17-48c5-b318-c155e0c02eb3.jpg',
  'development/title-files/1524684721207.ac1be226-fe37-4cb2-9925-0ae30eac22fc.jpg',
  'development/title-files/1524684721209.fa544c2e-cfb2-4c3c-b86a-ddcb492add87.jpg',
  'development/title-files/1524684721210.0394e31d-90fe-407c-8498-1d604b019c6a.jpg',
  'development/title-files/1524684721210.93dfbce7-12a5-450d-b066-7040647cf37e.jpg',
  'development/title-files/1524684721212.84ff1dc9-9395-4250-9073-6bec453c0a2e.jpg',
]

const mockImages = s3Keys.map((s3Key, index) => {
  return {
    s3Key,
    size: 0,
    fileType: 'image',
    creatorAddress: '0x0',
    mimeType: 'image/jpeg',
    name: `Image ${index + 1}`,
    s3Bucket: 'codex.title-registry',
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

    return models.CodexTitleFile.insertMany(mockImages.slice(0, request.params.imageCount))

  },

}
