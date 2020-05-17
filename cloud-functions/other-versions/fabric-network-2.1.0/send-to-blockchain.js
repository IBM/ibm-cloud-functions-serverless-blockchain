'use strict'

const Cloudant = require('@cloudant/cloudant')
const { Wallets, Gateway } = require('fabric-network')

async function main(params) {
  // Provide the URL for your Cloudant instance
  const dbUrl = '<add-your-cloudant-url-here>'
  // Database name must match the database created by the store-credentials-cloudant action
  const dbName = 'send-to-blockchain'

  try {
    const cloudant = Cloudant(dbUrl)
    const db = cloudant.use(dbName)
    const { id, fcn } = params
    let { args } = params

    // Allow input of JSON objects in args
    args = stringifyArrayValues(args)

    // Create new wallet
    const wallet = await Wallets.newInMemoryWallet()

    if (!db) {
      console.log('Could not connect to database')
      process.exit(1)
    }

    // Get the credentials
    let cfg = await db.get(id)
    if (!cfg) {
      console.log(`Could not find configuration with id: ${id}`)
      process.exit(1)
    }
    
    // Get the objects that make up the credentials
    const { user, connection } = cfg
  
    // Look up values in the connection profile
    const channel = cfg.channel
    console.log('contract: '+cfg.contract+'\nchannel: '+cfg.channel+'\nuser: '+cfg.username)

    // Add a user to the wallet
    const identity = {
			type: "X.509",
			mspId: cfg.user.mspId,
			credentials: {
				certificate: user.credentials.certificate,
				privateKey: user.credentials.privateKey
			}
		}

    await wallet.put(cfg.username, identity)

    // Check to see if we've already enrolled the user
    const userExists = await wallet.get(cfg.username)
    if (!userExists) {
      console.log(`An identity for the user ${cfg.username} does not exist in the wallet`)
      return
    }

    // Create a new gateway for connecting to our peer node
    const gateway = new Gateway()
    await gateway.connect(connection, { wallet, identity: cfg.username, discovery: { enabled: true } })

    // Get the network (channel) our contract is deployed to
    const network = await gateway.getNetwork(channel)

    // Get the contract from the network
    const contract = network.getContract(cfg.contract)

    // Create the transaction
    const transaction = contract.createTransaction(fcn)

    return new Promise((resolve, reject) => {
      // Submit the specified transaction.
      transaction.submit(...args)
      .then(respbytes => {
        let response = ''
        if(respbytes && respbytes.length > 0) response =  JSON.parse(respbytes.toString())
        let httpResult = {
          body: {payload: `${response}`},
          statusCode: 200,
          headers: { 'Content-Type': 'application/json'}
        }
        //console.log(JSON.stringify(httpResult))
        gateway.disconnect()
        resolve(httpResult)
      })
      .catch(error => {
        let errMsg = ''
        if (error && error.message) errMsg = JSON.stringify(error.message)
        let httpResult = {
          body: {payload: `${errMsg}`},
          statusCode: 400,
          headers: { 'Content-Type': 'application/json'}
        }
        //console.log(JSON.stringify(httpResult))
        gateway.disconnect()
        reject(httpResult)
      })
    })
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`)
    process.exit(1)
  }
}

/**
  * args needs to be an array of strings, but it is easier to work with JSON.
  * Allow JSON payloads by stringifying each element of the array, if necessary.
  */
function stringifyArrayValues (args) {
  let newArray = []
  args.forEach(item => {
    typeof item === 'string' ? newArray.push(item) : newArray.push(JSON.stringify(item))
  })
  return newArray
}

if (require.main !== module) {
    module.exports = main
    module.exports.main = main
}
