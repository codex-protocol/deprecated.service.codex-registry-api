import Agenda from 'agenda'
import Bluebird from 'bluebird'
import filewalker from 'filewalker'

import config from '../config'
import logger from '../services/logger'

export default (app) => {

  const agenda = new Agenda({ db: { address: config.mongodb.dbUris.titleRegistry } })

  const gracefulShutdown = () => {
    agenda.stop(() => {
      process.exit(0)
    })
  }

  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)

  return Bluebird.resolve()

    // first, loop over the jobs directory and load all the modules...
    .then(() => {

      return new Bluebird((resolve, reject) => {

        agenda.on('ready', () => {

          const jobs = []
          const filewalkerHandler = filewalker(`${__dirname}/../jobs`, { recursive: true })

          filewalkerHandler.on('error', reject)
          filewalkerHandler.on('done', () => { resolve(jobs) })

          // dynamically load & register all the jobs
          filewalkerHandler.on('file', (jobFilePath) => {

            // do not consider files & folders that start with an underscore or dot as
            //  valid jobs (also ignore sourcemap files)
            if (jobFilePath[0] === '_' || /\/(_|\.)/g.test(jobFilePath) || /\.js\.map$/.test(jobFilePath)) {
              return
            }

            /* eslint import/no-dynamic-require: 0 global-require: 0 */
            const job = require(`${__dirname}/../jobs/${jobFilePath}`).default

            if (!job || typeof job.execute !== 'function') {
              logger.warn(`job ${jobFilePath} has no execute method defined`)
              return
            }

            jobs.push(job)

          })

          filewalkerHandler.walk()

        })
      })
    })

    // then register all the jobs with agenda...
    .then((jobs) => {

      const cancelAgendaJob = Bluebird.promisify(agenda.cancel, { context: agenda })

      return Bluebird.map(jobs, (job) => {

        // cancel any old jobs of the same name first
        return cancelAgendaJob({ name: job.name })
          .then((numJobsCancelled) => {

            logger.verbose(`cancelled ${numJobsCancelled} existing ${job.name} job(s)`)

            // run the job's setup() method if it exists
            return Bluebird.resolve(job.setup ? job.setup() : null)
              .then(() => {

                agenda.define(job.name, (agendaJob, done) => {
                  job.execute()
                    .then(done)
                    .catch((error) => {
                      logger.error(`[${job.name}]`, 'could not execute job:', error)
                      done(error)
                    })

                })

                agenda.every(job.frequency || `${config.blockchain.averageBlockTime} seconds`, job.name)

              })

          })
      })
    })

    // finally, start agenda
    .then(() => {
      agenda.start()
      return app
    })

}
