import Bluebird from 'bluebird'
import EthereumTransaction from 'ethereumjs-tx'
import { eth } from '@codex-protocol/ethereum-service'

import config from '../config'
import models from '../models'
import logger from '../services/logger'

export default {

  name: 'send-transactions',
  frequency: `${config.blockchain.averageBlockTime} seconds`,

  setup() {

  },

  getJob() {
    return models.Job.findOne({ name: this.name })
      .then((job) => {

        if (job) {
          return job
        }

        logger.verbose(`[${this.name}] no job found, creating a new one`)

        return eth.getTransactionCount(config.blockchain.signerPublicAddress)
          .then((currentNonce) => {
            return models.Job.create({
              name: this.name,
              data: {
                currentNonce,
              },
            })
          })

      })
  },

  execute() {

    const findTransactionConditions = {
      status: 'created',
    }

    return models.Transaction.find(findTransactionConditions)
      .then((transactions) => {

        if (transactions.length === 0) {
          return null
        }

        logger.verbose(`[${this.name}]`, `found ${transactions.length} transaction(s) to submit`)

        return this.getJob()
          .then((job) => {

            // NOTE: use Bluebird.mapSeries instead of Bluebird.map so that the
            //  transactions are processed one at a time, in order
            return Bluebird.mapSeries(transactions, (transaction) => {

              logger.verbose(`submitting a transaction with nonce ${job.data.currentNonce}`)

              // let's save the current nonce with the transaction, which may be
              //  usefull if we ever want to retry a failed transaction, or
              //  lookup a "pending" transaction to remove it from mongo when we
              //  see the transaction confirmed
              //
              // NOTE: the transaction.save() call is done below in the
              //  sendSignedTransaction() event handlers
              transaction.tx.nonce = job.data.currentNonce

              // NOTE: the sendSignedTransaction() call below does return a
              //  promise (well, a promise/event emitter hybrid), but it's
              //  resolved when the transaction is mined (i.e when the "receipt"
              //  event is fired)
              //
              // since we don't want to block the next agenda job from running
              //  while waiting for previous transactions to be mined, we'll
              //  instead create a new promise to return and resolve that as
              //  soon as we get a transaction hash
              //
              // see: http://web3js.readthedocs.io/en/1.0/web3-eth.html#eth-sendtransaction-return
              return new Bluebird((resolve, reject) => {

                const ethereumTransaction = new EthereumTransaction({
                  to: transaction.tx.to,
                  from: transaction.tx.from,
                  data: transaction.tx.data,
                  value: transaction.tx.value,
                  gasLimit: transaction.tx.gasLimit,
                  gasPrice: transaction.tx.gasPrice,

                  nonce: job.data.currentNonce,
                })

                ethereumTransaction.sign(config.blockchain.signerPrivateKeyBuffer)

                const transactionData = `0x${ethereumTransaction.serialize().toString('hex')}`

                eth.sendSignedTransaction(transactionData)
                  .once('transactionHash', (transactionHash) => {

                    transaction.tx.hash = transactionHash
                    transaction.status = 'pending'

                    transaction.markModified('tx')
                    transaction.save()

                    resolve()

                  })
                  .on('error', (error) => {

                    logger.error(`[${this.name}]`, 'sendTransaction failed:', error)

                    transaction.tx.error = error.toString()
                    transaction.status = 'error'

                    transaction.markModified('tx')
                    transaction.save()

                    // NOTE: don't reject when there's an error, since we don't want
                    //  to prevent any subsequent transactions in this job from
                    //  running - just marking the transaction as failed is good
                    //  enough for now
                    resolve()

                  })

              })
                // increase the nonce after we know this transaction was
                //  submitted to the blockchain
                //
                // NOTE: we use finally here in case the logic above ever
                //  rejects or throws an error because technically that was a
                //  transaction attempt
                .finally(() => {

                  job.data.currentNonce += 1
                  job.markModified('data')

                  return job.save()

                })

            })

          })

      })

  },

}
