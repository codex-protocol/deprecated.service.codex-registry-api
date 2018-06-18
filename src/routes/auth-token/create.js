import Joi from 'joi'
import jwt from 'jsonwebtoken'
import ethUtil from 'ethereumjs-util'
import RestifyErrors from 'restify-errors'

import models from '../../models'
import config from '../../config'
import logger from '../../services/logger'

const hashedPersonalMessage = ethUtil.hashPersonalMessage(ethUtil.toBuffer(config.personalMessageToSign))

export default {

  method: 'post',
  path: '/auth-tokens?',

  parameters: Joi.object().keys({

    // NOTE: the length of the signedData may change if the ethereumjs-util
    //  package is ever updated and the fromRpcSignature method changes it's
    //  length validation, as indicated by a comment in the source
    //
    // see: https://github.com/ethereumjs/ethereumjs-util/blob/fde15dd/index.js
    //
    // NOTE: signedData should not have the 0x prefix as Joi will validate it as
    //  a raw Buffer
    signedData: Joi.binary().encoding('hex').length(65).required(),

    userAddress: Joi.string().regex(/^0x[0-9a-f]{40}$/i, 'ethereum address').lowercase().required(),

    // this regex validates a 4+ character string in the form "30 minutes",
    //  and also allows for zeit/ms shorthad durations:
    //  see: https://github.com/zeit/ms
    expiresIn: Joi.string().regex(/^(?=.{4,}$)\d+ (y|w|d|h|m|s|ms|years?|weeks?|days?|hours?|minutes?|seconds?|milliseconds?)$/).default('1 day'),
  }),

  handler(request, response) {

    // see: https://hackernoon.com/never-use-passwords-again-with-ethereum-and-metamask-b61c7e409f0d

    try {

      const { v, r, s } = ethUtil.fromRpcSig(ethUtil.toBuffer(request.parameters.signedData))
      const publicKey = ethUtil.ecrecover(hashedPersonalMessage, v, r, s)

      const userAddressBuffer = ethUtil.toBuffer(request.parameters.userAddress)
      const senderAddressBuffer = ethUtil.publicToAddress(publicKey)

      if (!senderAddressBuffer.equals(userAddressBuffer)) {
        // throw a blank error here since it'll just get picked up by the catch
        //  below anyway
        throw new Error()
      }

    } catch (error) {

      logger.warn(`failed login attempt for userAddress ${request.parameters.userAddress}:`, {
        signedData: request.parameters.signedData,
        error,
      })

      throw new RestifyErrors.ForbiddenError(
        `Signature for user address ${request.parameters.userAddress} did not match.`
      )
    }

    const newUserOptions = {
      setDefaultsOnInsert: true, // applies the defaults specified in the schema if a new document is created
      runSettersOnQuery: true, // runs all setters defined on the schema
      upsert: true, // creates the object if it doesn't exist
      new: true, // returns the modified document rather than the original
    }

    return models.User.findByIdAndUpdate(request.parameters.userAddress, {}, newUserOptions)
      .then((user) => {

        const jwtData = {
          userAddress: user.address,
        }

        const jwtOptions = {
          expiresIn: request.parameters.expiresIn,
        }

        const token = jwt.sign(jwtData, process.env.JWT_SECRET, jwtOptions)

        return {
          token,
          user,
        }

      })

  },

}
