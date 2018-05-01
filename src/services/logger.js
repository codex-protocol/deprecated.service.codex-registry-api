import winston from 'winston'
import Sentry from 'winston-raven-sentry'

import config from '../config'

const transports = [
  new winston.transports.Console({
    colorize: true,
    prettyPrint: true,
    level: config.process.logLevel,
    timestamp() { return (new Date()).toISOString() },
  }),
]

if (config.useSentry) {
  transports.push(
    new Sentry({
      dsn: process.env.SENTRY_DSN,
      install: true,
      level: 'info',
      config: {
        captureUnhandledRejections: true,
        name: 'biddable-api',
      },
    }),
  )
}

const logger = new winston.Logger({
  exitOnError: process.env.NODE_ENV === 'development',
  transports,
})

export default logger
