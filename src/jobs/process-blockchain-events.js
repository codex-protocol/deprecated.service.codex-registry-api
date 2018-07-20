import Bluebird from 'bluebird'

import config from '../config'
import models from '../models'
import logger from '../services/logger'
import codexCoinService from '../services/codex-coin'
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
          contractName: {
            $in: [
              'CodexCoin',
              'CodexRecord',
            ],
          },
          blockNumber: {
            $gt: job.data.lastProcessedEventBlockNumber,
          },
        }

        return models.BlockchainEvent
          .find(conditions)
          .sort('blockNumber')
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

                logger.verbose(`[${this.name}]`, `found blockchain event on block number ${blockchainEvent.blockNumber}: ${blockchainEvent.contractName}::${blockchainEvent.eventName}`)

                let promise = Bluebird.resolve(null)

                switch (blockchainEvent.contractName) {
                  case 'CodexCoin':
                    promise = this.processCodexCoinEvent(blockchainEvent)
                    break

                  case 'CodexRecord':
                    promise = this.processCodexRecordEvent(blockchainEvent)
                    break

                  default:
                    logger.warn(`[${this.name}]`, `unexpected contract found: ${blockchainEvent.contractName}`, blockchainEvent.returnValues)
                    break
                }

                return promise
                  .catch((error) => {
                    logger.error(`[${this.name}]`, `could not process blockchainEvent with id ${blockchainEvent.id} (${blockchainEvent.contractName}::${blockchainEvent.eventName}):`, error)
                  })

              })
              .finally(() => {
                return job.save()
              })

          })

      })

  },

  processCodexCoinEvent(blockchainEvent) {

    const returnValues = Object.values(blockchainEvent.returnValues)

    returnValues.push(blockchainEvent.transactionHash)

    let result = null

    switch (blockchainEvent.eventName) {

      case 'Approval':
        // const [ownerAddress, spenderAddress, value] = returnValues
        result = codexCoinService.approveSpender(...returnValues)
        break

      case 'Transfer':
        // const [fromAddress, toAddress, value] = returnValues
        result = codexCoinService.transfer(...returnValues)
        break

      case 'Pause':
      case 'Unpause':
      case 'OwnershipTransferred':
        // no need to handle these events on the API side
        break

      default:
        logger.warn(`[${this.name}]`, `unexpected event found: ${blockchainEvent.contractName}::${blockchainEvent.eventName}`, blockchainEvent.returnValues)
        break

    }

    return Bluebird.resolve(result)

  },

  processCodexRecordEvent(blockchainEvent) {

    const returnValues = Object.values(blockchainEvent.returnValues)

    returnValues.push(blockchainEvent.transactionHash)

    let result = null

    switch (blockchainEvent.eventName) {

      case 'Minted':
        result = codexRecordService.confirmMint(...returnValues)
        break

      case 'Transfer': {

        const [fromAddress, toAddress, tokenId, transactionHash] = returnValues

        // "transfer" events FROM address 0x0 are really "create"
        //  events
        if (fromAddress === config.zeroAddress) {
          result = codexRecordService.create(toAddress.toLowerCase(), tokenId, transactionHash)

        // "transfer" events TO address 0x0 are really "destroy"
        //  events
        } else if (toAddress === config.zeroAddress) {
          result = codexRecordService.destroy(fromAddress.toLowerCase(), tokenId, transactionHash)

        // otherwise, this was a "real" transfer from one address to
        //  another
        } else {
          result = codexRecordService.transfer(fromAddress.toLowerCase(), toAddress.toLowerCase(), tokenId, transactionHash)
        }

        break

      }

      case 'Modified':
        result = codexRecordService.modify(...returnValues)
        break

      case 'Approval':
        result = codexRecordService.approveAddress(...returnValues)
        break

      case 'ApprovalForAll':
      case 'OwnershipTransferred':
        // no need to handle these events on the API side
        break

      default:
        logger.warn(`[${this.name}]`, `unexpected event found: ${blockchainEvent.contractName}::${blockchainEvent.eventName}`, blockchainEvent.returnValues)
        break

    }

    return Bluebird.resolve(result)

  },

}
