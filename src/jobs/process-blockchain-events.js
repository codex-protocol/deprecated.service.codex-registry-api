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

                switch (blockchainEvent.eventName) {

                  case 'Transfer':
                    if (blockchainEvent.returnValues._from === '0') {
                      return codexTitleService.create(...returnValues.slice(1))
                    }
                    return codexTitleService.transfer(...returnValues)

                  case 'Approval':
                    return codexTitleService.approve(...returnValues)

                  case 'ApprovalForAll':
                    return codexTitleService.approveAll(...returnValues)

                  default:
                    logger.warn(`[${this.name}]`, 'unexpected event found:', blockchainEvent.eventName)
                    return null

                }

              })
              .then(() => {
                return job.save()
              })

          })

      })

  },

}
