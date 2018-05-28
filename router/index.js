// const { requestLogger, sanitizeRequestObj } = require('../middleware');
const router = require('express').Router();

// requestLogger(router);

// sanitizeRequestObj(router);

/** Open routes */
// require('./api/public')(router);

/** Secured routes */
require('./api/account')(router);

/**
 * Mounting respective paths.
 * @param {object} app Express instance
 */
module.exports = (app) => {
  app.use('/api/v1', router);
};