import Bluebird from 'bluebird'

import startJobs from './jobs'
import addParams from './params'
import addRoutes from './routes'
import connectToMongoDb from './mongo'
import loadContracts from './contracts'
import addPreRouteMiddleware from './pre-route-middleware'
import addPostRouteMiddleware from './post-route-middleware'

export default (app) => {

  // the Bluebird.resolve() below is a bit redundant but it makes the next few
  //  lines cleaner & chainable since addPreRouteMiddleware and
  //  addPostRouteMiddleware are not really asynchronous
  //
  // NOTE: just make sure each initializer resolve it's promise(s) with `app`
  return Bluebird.resolve(app)
    .then(connectToMongoDb)
    .then(loadContracts)
    .then(addPreRouteMiddleware)
    .then(addParams)
    .then(addRoutes)
    .then(addPostRouteMiddleware)
    .then(startJobs)

}
