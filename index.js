const express = require('express')
const app = express()

const etherscan = require('etherscan-api').init('(my api key redacted)')

const { Client } = require('pg')
const postgres = new Client()
postgres.connect().catch((error) => { console.log('connecting to postgres: ' + error) })

const functions = require('./functions.js')

app.put('/ethtrancache/:address(0x[0-9a-fA-F]{40})/', handleAddAddress)
app.get('/ethtrancache/:address(0x[0-9a-fA-F]{40})/', handleGetBalance)
app.delete('/ethtrancache/:address(0x[0-9a-fA-F]{40})/', handleDeleteAddress)
app.get('/ethtrancache/:address(0x[0-9a-fA-F]{40})/transactions', handleGetTransactions)

async function handleDeleteAddress(request, response) {
  try {
    await functions.deleteAddress(postgres, request.params['address'])
  } catch (err) {
    response.send({ result: 'failure', msg: 'error deleting existing address: ' + err })
    return
  }
  response.send({ result: 'success' })
}

async function handleAddAddress(request, response) {
  try {
    await functions.addAddress(postgres, etherscan, request.params['address'])
  } catch (err) {
    response.send({ result: 'failure', msg: 'error adding address: ' + err })
    return
  }
  response.send({ result: 'success' })
}

async function handleGetBalance(request, response) {
  var balance
  try {
    balance = await functions.getBalance(postgres, request.params['address'])
  } catch (err) {
    response.send({ result: 'failure', msg: 'error getting balance: ' + err })
    return
  }
  response.send({ result: 'success', balance: balance })
}

async function handleGetTransactions(request, response) {
  var transactions
  try {
    transactions = await functions.getTransactions(postgres, request.params['address'], request.query.other_address)
  } catch (err) {
    response.send({ result: 'failure', msg: 'error getting transactions: ' + err })
    return
  }
  response.send({ result: 'success', transactions: transactions })
}

app.listen(3000, () => console.log('listening on port 3000'))