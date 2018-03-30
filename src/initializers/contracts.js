import Bluebird from 'bluebird'
import filewalker from 'filewalker'

import config from '../config'
import contracts from '../services/contracts'
import ethereumService from '../services/ethereum'

export default (app) => {

  return new Bluebird((resolve, reject) => {

    const filewalkerHandler = filewalker(`${__dirname}/../../static/contracts`, { recursive: true, matchRegExp: /\.json$/i })

    filewalkerHandler.on('error', reject)
    filewalkerHandler.on('done', () => { resolve(app) })

    // dynamically load & register all the contracts
    filewalkerHandler.on('file', (contractFilePath) => {

      // do not consider files & folders that start with an underscore or dot as
      //  valid contracts
      if (contractFilePath[0] === '_' || /\/(_|\.)/g.test(contractFilePath)) {
        return
      }

      /* eslint import/no-dynamic-require: 0 global-require: 0 */
      const contractJSON = require(`${__dirname}/../../static/contracts/${contractFilePath}`)

      const contractAddress = contractJSON.networks[config.blockchain.networkId].address
      const contract = new ethereumService.Contract(contractJSON.abi, contractAddress)

      contract.name = contractJSON.contractName

      contracts[contract.name] = contract

    })

    filewalkerHandler.walk()

  })

}
