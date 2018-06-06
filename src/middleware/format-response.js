// This middlware standardizes all API responses so that every request can
//  expect the same structured response

import mongoose from 'mongoose'

const addLocals = (object, locals) => {

  if (!object || typeof object !== 'object') {
    return
  }

  if (
    object instanceof mongoose.Model &&
    typeof object.locals === 'undefined' &&
    typeof object.setLocals === 'function' &&
    object.constructor.modelName === 'CodexRecord'
  ) {
    object.setLocals(locals)
    return
  }

  Object.entries(object).forEach(([key, value]) => {

    const type = Object.prototype.toString.call(value)

    if (type === '[object Object]') {
      addLocals(value, locals)

    } else if (type === '[object Array]') {
      value.forEach((item) => {
        addLocals(item, locals)
      })
    }

  })
}

export default () => {

  return (request, response, next) => {

    if (typeof response.error === 'undefined') {
      response.error = null
    }

    if (typeof response.result === 'undefined') {
      response.result = null
    }

    if (response.error !== null) {
      response.status(response.error.code || 500)
    }

    // loop over everything in the response, and call setLocals() on all
    //  instances of CodexRecord Mongoose models
    //
    // this is probably hella inefficient, so if you know of a better way, holla
    //  at cha boi
    addLocals(response.result, response.locals)

    response.json({
      error: response.error,
      result: response.result,
    })

    next()

  }

}
