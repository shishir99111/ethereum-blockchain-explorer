const handleAddAddress = require('./addAddress.handler');
const handleGetBalance = require('./getBalance.handler');
const handleDeleteAddress = require('./deleteAddress.handler');
const handleGetTransactions = require('./getTransactions.handler');

/**
 * Mounts component specific routes,
 * along with there respective route handlers
 * @param {object} router
 */
module.exports = (router) => {
  router.put('/ethtrancache/:address(0x[0-9a-fA-F]{40})/', handleAddAddress)
  router.get('/ethtrancache/:address(0x[0-9a-fA-F]{40})/', handleGetBalance)
  router.delete('/ethtrancache/:address(0x[0-9a-fA-F]{40})/', handleDeleteAddress)
  router.get('/ethtrancache/:address(0x[0-9a-fA-F]{40})/transactions', handleGetTransactions)
};