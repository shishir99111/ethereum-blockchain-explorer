const { getTransactions } = require('../../../helpers');
const Boom = require('boom');

async function logic(request, response) {
  let transactions;
  try {
    transactions = await getTransactions(request.params['address'], request.query.other_address)
  } catch (err) {
    throw Boom.badRequest(err);
  }
  response.send({ result: 'success', transactions });
}

function handler(req, res, next) {
  logic(req).then((data) => {
    res.json(data);
  }).catch(err => next(err));
}
module.exports = handler;