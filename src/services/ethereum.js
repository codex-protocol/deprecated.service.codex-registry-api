import Web3 from 'web3'

import config from '../config'

const provider = new Web3(config.blockchain.providerRpcUrl)
const client = new Web3(provider).eth

export default client
