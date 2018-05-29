const { deleteAddress } = require('../../../helpers');
const Boom = require('boom');

async function logic(req, res) {
  try {
    await deleteAddress(req.params['address']);
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