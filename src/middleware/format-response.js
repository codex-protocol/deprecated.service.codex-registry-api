// This middlware standardizes all API responses so that every request can
//  expect the same structured response

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

    response.json({
      error: response.error,
      result: response.result,
    })

    next()

  }

}
