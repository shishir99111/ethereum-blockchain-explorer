const { getTransactions } = require('../../../helpers');

async function logic(request, response) {
  let transactions
  try {
    transactions = await getTransactions(postgres, request.params['address'], request.query.other_address)
  } catch (err) {
    response.send({ result: 'failure', msg: 'error getting transactions: ' + err })
    return
  }
  response.send({ result: 'success', transactions })
}

function handler(req, res, next) {
  logic(req).then((data) => {
    res.json(data);
  }).catch(err => next(err));
}
module.exports = handler;