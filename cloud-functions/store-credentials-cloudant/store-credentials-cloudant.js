'use strict'

const Cloudant = require('@cloudant/cloudant')

async function main(params) {
  // Provide the URL for your Cloudant instance
  const dbUrl = '<add-your-cloudant-url-here>'
  // Database name must match the database name used in the send-to-blockchain action
  // This database will be created if it does not exist
  const dbName = 'send-to-blockchain'

  try {
    const cloudant = Cloudant(dbUrl)
    const db = cloudant.use(dbName)

    // Load the connection profile, user cert and private key
    const cprofile = params.connection
    const cert = params.cert
    const key = params.key
    const username = params.username
    const contract = params.contract
    const _id = params.id

    // Create the database if it does not exist
    cloudant.db.list(function(err, allDbs) {
      // If err listing dbs or we don't find a db with a matching name, create it
      if (err || !allDbs.some(db => db == dbName)) {
        console.log('Creating new db ' + dbName)
        cloudant.db.create(dbName, function(err, res) {
          if (err) {
            console.log('Could not create new db ' + dbName +': ' + err)
          }
        })
      }
    })

    // Create doc to store
    let doc = { _id, contract, username, key, cert, cprofile }

    // Try to get the doc first to see if we are doing an update
    console.log(`getting doc with id: ${doc._id}`)
    try {
      let result1 = await db.get(doc._id)
      !(result1 || result1._rev) ? console.log(`could not find doc with id: ${doc._id}`) : doc._rev = result1._rev
    } catch (err) {
      console.log(`error getting doc: ${err}`)  // log and continue
    }
    
    // If doc now has an _rev attr, it will be an update, otherwise it's a create
    console.log('performing insert')
    let result2 = await db.insert(doc)
    console.log('insert result: ' + JSON.stringify(result2))
    !(result2 || result2.rev) ? console.log(`error inserting doc with id: ${doc._id}`) : console.log(`Successfully stored credentials with key: ${result2.id} and rev: ${result2.rev}`)
    
    // Get the doc so we can return the result
    console.log(`Stored doc.  Now getting doc with id: ${doc._id}`)
    let result3 = await db.get(doc._id)

    return { statusCode: 200, body: { key: result2.id, revision: result2.rev, doc: result3 }}
  } catch (error) {
    console.error(`Failed to store credentials: ${error}`)
  }
}

if (require.main !== module) {
    module.exports = main
    module.exports.main = main
}
