import Bluebird from 'bluebird'

import config from '../config'
import models from '../models'
import logger from '../services/logger'
import codexRecordService from '../services/codex-record'

export default {

  name: 'process-blockchain-events',
  frequency: `${config.blockchain.averageBlockTime} seconds`,

  getJob() {
    return models.Job.findOne({ name: this.name })
      .then((job) => {

        if (job) {
          return job
        }

        logger.verbose(`[${this.name}] no job found, creating a new one`)

        return models.Job.create({
          name: this.name,
          data: {
            lastProcessedEventBlockNumber: config.blockchain.startingBlockHeight,
          },
        })

      })
  },

  execute() {

    return this.getJob()
      .then((job) => {

        const conditions = {
          contractName: 'CodexRecord',
          blockNumber: {
            $gt: job.data.lastProcessedEventBlockNumber,
          },
        }

        return models.BlockchainEvent.find(conditions).sort('blockNumber')
          .then((blockchainEvents) => {

            if (blockchainEvents.length === 0) {
              return null
            }

            // save the block number of the last event we processed so we know
            //  where to start looking the next time this job runs
            //
            // @NOTE: since we're sorting the query by blockNumber, we can be
            //  certain that the last event will have the most recent
            //  blockNumber
            job.data.lastProcessedEventBlockNumber = blockchainEvents[blockchainEvents.length - 1].blockNumber
            job.markModified('data')

            // move Minted events to the end of the array so that they are
            //  guaranteed to be processed AFTER their associated Transfer
            //  events
            //
            // "creation" transfers will always have a Minted event emitted in
            //  the same block, but since they have the same blockNumber there's
            //  no guarantee that mongoose will retrieve them in the correct
            //  order (Transfer -> Minted)
            //
            // @NOTE: this MUST come before the lastProcessedEventBlockNumber
            //  update performed above since it relies on blockchainEvents being
            //  sorted by blockNumber
            //
            // @NOTE: the weird conditional moves all Minted events to the end
            //  while preserving their relative order (i.e. blockNumber)
            blockchainEvents.sort((a, b) => {
              return a.eventName === 'Minted' && b.eventName !== 'Minted'
            })

            return Bluebird
              .mapSeries(blockchainEvents, (blockchainEvent) => {

                logger.verbose(`[${this.name}]`, `found blockchain event on block number ${blockchainEvent.blockNumber}:`, blockchainEvent.eventName)

                const returnValues = Object.values(blockchainEvent.returnValues)

                returnValues.push(blockchainEvent.transactionHash)

                let promise = Bluebird.resolve(null)

                switch (blockchainEvent.eventName) {

                  case 'Minted':
                    promise = codexRecordService.confirmMint(...returnValues)
                    break

                  case 'Transfer': {

                    const [fromAddress, toAddress, tokenId, transactionHash] = returnValues

                    // "transfer" events FROM address 0x0 are really "create"
                    //  events
                    if (fromAddress === config.zeroAddress) {
                      promise = codexRecordService.create(toAddress.toLowerCase(), tokenId, transactionHash)

                    // "transfer" events TO address 0x0 are really "destroy"
                    //  events
                    } else if (toAddress === config.zeroAddress) {
                      promise = codexRecordService.destroy(fromAddress.toLowerCase(), tokenId, transactionHash)

                    // otherwise, this was a "real" transfer from one address to
                    //  another
                    } else {
                      promise = codexRecordService.transfer(fromAddress.toLowerCase(), toAddress.toLowerCase(), tokenId, transactionHash)
                    }

                    break

                  }

                  case 'Modified':
                    promise = codexRecordService.modify(...returnValues)
                    break

                  case 'Approval':
                    promise = codexRecordService.approveAddress(...returnValues)
                    break

                  case 'ApprovalForAll':
                    promise = codexRecordService.approveOperator(...returnValues)
                    break

                  case 'OwnershipTransferred':
                    break

                  default:
                    logger.warn(`[${this.name}]`, 'unexpected event found:', blockchainEvent.eventName, blockchainEvent.returnValues)
                    break

                }

                return promise
                  .catch((error) => {
                    logger.error(`[${this.name}]`, `could not process blockchainEvent with id ${blockchainEvent.id} (${blockchainEvent.eventName}):`, error)
                  })

              })
              .then(() => {
                return job.save()
              })

          })

      })

  },

}
