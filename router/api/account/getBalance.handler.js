const { getBalance } = require('../../../helpers');
const Boom = require('boom');

async function logic(request, response) {
  let balance;
  try {
    balance = await getBalance(request.params['address']);
  } catch (err) {
    throw Boom.badRequest(err);
  }
  response.send({ result: 'success', balance });
}

function handler(req, res, next) {
  logic(req).then((data) => {
    res.json(data);
  }).catch(err => next(err));
}
module.exports = handler;