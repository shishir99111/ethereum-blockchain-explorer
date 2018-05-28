const { getBalance } = require('../../../helpers');

async function logic(request, response) {
  let balance
  try {
    balance = await getBalance(postgres, request.params['address'])
  } catch (err) {
    response.send({ result: 'failure', msg: 'error getting balance: ' + err })
    return
  }
  response.send({ result: 'success', balance })
}

function handler(req, res, next) {
  logic(req).then((data) => {
    res.json(data);
  }).catch(err => next(err));
}
module.exports = handler;