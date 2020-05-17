'use strict'

const Cloudant = require('@cloudant/cloudant')
const { InMemoryWallet, X509WalletMixin, Gateway } = require('fabric-network')

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

    const wallet = new InMemoryWallet()

    if (!db) {
      console.log('Could not connect to database')
      process.exit(1)
    }

    // Get the credentials
    let result = await db.get(id)
    if (!result) {
      console.log(`Could not find credentials with id: ${id}`)
      process.exit(1)
    }
    
    // Get the objects that make up the credentials
    const { cprofile, username } = result
    const cert = Buffer.from(result.cert, 'base64').toString()
    const key = Buffer.from(result.key, 'base64').toString()
    const contractName = result.contract
  
    // Look up values in the connection profile
    const channel = cprofile.name
    const org = cprofile.client.organization
    console.log('contract: '+contractName+'\nchannel: '+channel+'\norg: '+org+'\nuser: '+username)

    // Create and import the identity
    const identity = X509WalletMixin.createIdentity(org, cert, key)
    await wallet.import(username, identity)

    // Check to see if we've already enrolled the user
    const userExists = await wallet.exists(username)
    if (!userExists) {
      console.log(`An identity for the user ${{username}} does not exist in the wallet`)
      return
    }

    // Create a new gateway for connecting to our peer node
    const gateway = new Gateway()
    await gateway.connect(cprofile, { wallet, identity: username, discovery: { enabled: true } })

    // Get the network (channel) our contract is deployed to
    const network = await gateway.getNetwork(channel)

    // Get the contract from the network
    const contract = network.getContract(contractName)

    // Create the transaction
    const transaction = contract.createTransaction(fcn)

    const p1 = new Promise((resolve, reject) => {
      console.log('Adding transaction commit listener')
       transaction.addCommitListener((err, transactionId, status, blockNumber) => {  
        if (err) {
          console.error(err)
          reject(err)
        }
        const result = `Transaction ID: ${transactionId} Status: ${status} Block number: ${blockNumber}`
        // Could notify via Event Streams or REST here
        console.log(result)
        resolve(result)
      })
    })
    
    const p2 = new Promise((resolve, reject) => {
      console.log('Adding contract event listener')
      contract.addContractListener('contractListener', 'SRCreatedEvent', (err, event, blockNumber, transactionId, status) => {
        if (err) {
            console.error(err)
            reject(err)
        }
        const result = `Event: ${event} Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`
        // Could notify via Event Streams or REST here
        console.log(result)
        resolve(result)
      })
    })

    const p3 = new Promise((resolve, reject) => {
      // Submit the specified transaction.
      transaction.submit(...args)
      .then(response => resolve(response))
      .catch(error => reject(error))
    })

    return new Promise((resolve,reject) => {
      Promise.all([
        p1.catch(error => { reject(error) }),
        p2.catch(error => { reject(error) }),
        p3.catch(error => { reject(error) })
      ]).then(values => {
        console.log(values[0])
        console.log(values[1])
        console.log(values[2])
        gateway.disconnect()
        resolve({ statusCode: 200, body: { response: JSON.stringify(values[2]) }})
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
