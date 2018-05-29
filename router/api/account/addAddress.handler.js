const { addAddress } = require('../../../helpers');
const Boom = require('boom');

async function logic(req, res) {
  try {
    await addAddress(req.params['address']);
  } catch (err) {
    throw Boom.badRequest(err);
  }
  res.send({ result: 'success' });
}

function handler(req, res, next) {
  logic(req, res).then((data) => {
    res.json(data);
  }).catch(err => next(err));
}
module.exports = handler;