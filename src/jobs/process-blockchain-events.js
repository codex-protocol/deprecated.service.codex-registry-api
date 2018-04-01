import Bluebird from 'bluebird'

import config from '../config'
import models from '../models'
import logger from '../services/logger'
import codexTitleService from '../services/codex-title'

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
          contractName: 'CodexTitle',
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
            job.data.lastProcessedEventBlockNumber = blockchainEvents[blockchainEvents.length - 1].blockNumber
            job.markModified('data')

            return Bluebird
              .mapSeries(blockchainEvents, (blockchainEvent) => {

                logger.info(`[${this.name}]`, `found blockchain event on block number ${blockchainEvent.blockNumber}:`, blockchainEvent.eventName)

                const returnValues = Object.values(blockchainEvent.returnValues)

                let promise = Bluebird.resolve(null)

                switch (blockchainEvent.eventName) {

                  case 'Transfer': {

                    // eslint-disable-next-line prefer-const
                    let [fromAddress, toAddress, tokenId] = returnValues

                    // NOTE: Converting fromAddress and toAddress to lowercase from their checksum counterpart
                    //  This is because MetaMask always returns the lowercase format and not the checksum format
                    fromAddress = fromAddress.toLowerCase()
                    toAddress = toAddress.toLowerCase()

                    // "transfer" events FROM address 0x0 are really "create"
                    //  events
                    if (Number.parseInt(fromAddress, 16) === 0) {
                      promise = codexTitleService.create(toAddress, tokenId)

                    // "transfer" events TO address 0x0 are really "destroy"
                    //  events
                    } else if (Number.parseInt(toAddress, 16) === 0) {
                      promise = codexTitleService.destroy(fromAddress, tokenId)

                    // otherwise, this was a "real" transfer from one address to
                    //  another
                    } else {
                      promise = codexTitleService.transfer(fromAddress, toAddress, tokenId)
                    }

                    break

                  }

                  case 'Approval': {
                    promise = codexTitleService.approveAddress(...returnValues)
                    break
                  }

                  case 'ApprovalForAll': {
                    promise = codexTitleService.approveOperator(...returnValues)
                    break
                  }

                  default:
                    logger.warn(`[${this.name}]`, 'unexpected event found:', blockchainEvent.eventName, blockchainEvent.returnValues)
                    break

                }

                return promise
                  .catch((error) => {
                    logger.warn(`[${this.name}]`, 'could not process blockchainEvent:', { blockchainEvent, error })
                  })

              })
              .then(() => {
                return job.save()
              })

          })

      })

  },

}
