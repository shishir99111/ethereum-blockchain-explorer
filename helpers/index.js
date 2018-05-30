let etherscan;
const etherscanLib = require('etherscan-api');
const Boom = require('boom');

function transactionObjFormat(t) {
  return {
    to_address: t.to,
    txn_id: t.hash,
    from_address: t.from,
    value: (t.value / 10000000000000000).toFixed(4),
    gas_price: +t.gasPrice,
    gas_used: +t.gasUsed,
    cumulative_gas_used: +t.cumulativeGasUsed,
    block_hash: t.blockHash,
    block_number: +t.blockNumber,
    confirmations: +t.confirmations,
    is_error: t.isError === '0' ? false : true,
    nonce: t.nonce,
    created_at: t.timeStamp,
    txreceipt_status: t.txreceipt_status,
  };
}

function getEtherscanClient() {
  if (etherscan) return etherscan;
  etherscan = etherscanLib.init(process.env.API_KEY);
  return etherscan;
}

async function deleteAddress(address) {
  try {
    const { pg } = require('../db');

    await pg.query('DELETE FROM eth_balances WHERE address = LOWER($1)', [address]);
    await pg.query('DELETE FROM transactions WHERE from_address = LOWER($1) OR to_address = LOWER($1)', [address]);
  } catch (err) { throw new Error(`PostgreSQL error: ${err}`); }
}

async function addAddress(address) {
  /*
  "Accept an Ethereum address as input, and then:
  1. query https://etherscan.io/apis and collects all transactions
  associated with that address.
      1. store the transactions in the DB.
      2. store the address balance in the DB."
  */
  const etherscan = await getEtherscanClient();
  const { pg } = require('../db');

  // clear out existing balance and transactions
  try {
    await deleteAddress(address);
  } catch (err) { throw new Error(`error deleting existing address: ${err}`); }

  /* scrape and store eth balance */

  let balance;

  try {
    const balanceResponse = await etherscan.account.balance(address);
    if (balanceResponse.result) {
      balance = (balanceResponse.result / 10000000000000000).toFixed(4);
    }
  } catch (err) { throw new Error(`err getting eth balance: ${err}`); }

  try {
    await pg.query(
      'INSERT INTO eth_balances(address, balance) VALUES(LOWER($1), $2)', [address, balance]);
  } catch (err) { throw new Error(`error storing eth balance: ${err}`); }

  /* scrape and store transactions */

  let txlist;

  try {
    txlist = await etherscan.account.txlist(address);
  } catch (err) { throw new Error(`error getting transactions: ${err}`); }

  try {
    const finalArr = txlist.result.map(transactionObjFormat);

    await pg.bulkInsert({ tableName: 'transactions', data: finalArr, returnClause: ['*'] });
  } catch (err) { throw Boom.badRequest(err); }
}

async function getBalance(address) {
  /*
  Return stored address balance by ETH address
  */
  const { pg } = require('../db');

  try {
    const result = await pg.query(
      'SELECT balance FROM eth_balances WHERE address = LOWER($1)', [address]);

    if (result.rows.length === 0) { throw new Error('no such address'); }

    return result.rows[0].balance;
  } catch (err) { throw new Error(`error getting eth_balance: ${err}`); }
}

async function getTransactions(address, otherAddress) {
  /*
  Return transactions of stored ETH address, and accept some form of search
  params (which params are up to you).
  */
  const { pg } = require('../db');

  let query =
    `SELECT * FROM transactions WHERE
    from_address = LOWER($1) OR to_address = LOWER($1)`;

  const values = [address];

  if (otherAddress !== undefined) {
    query += ' AND ( from_address = LOWER($2) OR to_address = LOWER($2) )';
    values.push(otherAddress);
  }

  query += ';';

  let result;
  try {
    result = await pg.query(query, values);
  } catch (err) { throw new Error(`error getting transactions: ${err}`); }

  return result.rows;
}

module.exports = {
  addAddress,
  deleteAddress,
  getBalance,
  getTransactions,
  getEtherscanClient,
};