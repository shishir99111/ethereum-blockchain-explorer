async function addAddress(postgres, etherscan, address) {
  /*
  "Accept an Ethereum address as input, and then:
  1. query https://etherscan.io/apis and collects all transactions
  associated with that address.
      1. store the transactions in the DB.
      2. store the address balance in the DB."
  */

  // clear out existing balance and transactions
  try {
    await deleteAddress(postgres, address)
  } catch (err) { throw new Error('error deleting existing address: ' + err) }

  /* scrape and store eth balance */

  var balance

  try {
    balance = await etherscan.account.balance(address)
  } catch (err) { throw new Error('err getting eth balance: ' + err) }

  try {
    await postgres.query(
      'INSERT INTO eth_balances(address, balance) VALUES(LOWER($1), $2)', [address, balance['result']])
  } catch (err) { throw new Error('error storing eth balance: ' + err) }

  /* scrape and store transactions */

  var txlist

  try {
    txlist = await etherscan.account.txlist(address)
  } catch (err) { throw new Error('error getting transactions: ' + err) }

  try {
    for (var i = 0; i < txlist.result.length; i++) {
      await postgres.query(
        'INSERT INTO transactions(to_address, txn_id, from_address, value)' +
        ' VALUES(LOWER($1), LOWER($2), LOWER($3), $4)', [txlist.result[i].to,
          txlist.result[i].hash,
          txlist.result[i].from,
          txlist.result[i].value
        ])
    }
  } catch (err) { throw new Error('error storing transactions: ' + err) }
}

async function deleteAddress(postgres, address) {
  try {
    await postgres.query(
      'DELETE FROM eth_balances WHERE address = LOWER($1)', [address])
    await postgres.query(
      'DELETE FROM transactions WHERE from_address = LOWER($1) OR to_address = LOWER($1)', [address])
  } catch (err) { throw new Error('PostgreSQL error: ' + err) }
}

async function getBalance(postgres, address) {
  /*
  Return stored address balance by ETH address
  */
  try {
    var result = await postgres.query(
      'SELECT balance FROM eth_balances WHERE address = LOWER($1)', [address])

    if (result.rows.length === 0) { throw new Error('no such address') }

    return result.rows[0].balance
  } catch (err) { throw new Error('error getting eth_balance: ' + err) }
}

async function getTransactions(postgres, address, otherAddress) {
  /*
  Return transactions of stored ETH address, and accept some form of search
  params (which params are up to you).
  */

  var query =
    'SELECT * FROM transactions WHERE ' +
    'from_address = LOWER($1) OR to_address = LOWER($1)'

  var values = [address]

  if (otherAddress !== undefined) {
    query += ' AND ( from_address = LOWER($2) OR to_address = LOWER($2) )'
    values.push(otherAddress)
  }

  query += ';'

  try {
    var result = await postgres.query(query, values)
  } catch (err) { throw new Error('error getting transactions: ' + err) }

  return result.rows
}

module.exports = {
  addAddress,
  deleteAddress,
  getBalance,
  getTransactions
}