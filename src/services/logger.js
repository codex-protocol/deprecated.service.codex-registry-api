import winston from 'winston'

import config from '../config'

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      prettyPrint: true,
      level: config.process.logLevel,
      timestamp() { return (new Date()).toISOString() },
    }),
  ],
  exitOnError: process.env.NODE_ENV === 'development',
})

export default logger
