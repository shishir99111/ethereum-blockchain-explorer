const { Pool, types } = require('pg');
const Boom = require('boom');

// Fix for parsing of numeric fields
types.setTypeParser(1700, 'text', parseFloat);

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  //   password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  max: process.env.PGMAXCONNECTION,
  idleTimeoutMillis: process.env.PGIDLETIMEOUT,
  connectionTimeoutMillis: process.env.PGCONNECTIONTIMEOUT,
});

pool.on('error', (err) => {
  logger.error(`Postgres connection error on client - ${err.message}`);
  throw err;
});

/**
 * Notice in the example below no releaseCallback was necessary.
 * The pool is doing the acquiring and releasing internally.
 * I find pool.query to be a handy shortcut in a lot of situations.
 * Do not use pool.query if you need transactional integrity:
 * the pool will dispatch every query passed to pool.query on the first available idle client.
 * Transactions within PostgreSQL are scoped to a single client.
 * so dispatching individual queries within a single transaction across
 * multiple, random clients will cause big problems in your app and not work.
 */
/**
 * @param  {string} text
 * @param  {array} params
 */
function query(text, params) {
  if (process.env.NODE_ENV === 'production') {
    logger.info(text);
    logger.info(params);
  }
  return pool.query(text, params);
}

/** Use this for transactional integrity */
function getClient() {
  return pool.connect();
}

/** Cannot name delete since it's a keyword in javascript */
function pgDelete({ client, tableName, whereClause, returnClause }) {
  if (!(whereClause && typeof whereClause === 'object' && Object.keys(whereClause).length > 0)) {
    throw Boom.badRequest('Please provide valid where clause for delete operation');
  }
  let text = `DELETE FROM ${tableName}`;
  text = `${text} ${whereClause.text}`;
  if (returnClause && returnClause.constructor === Array && returnClause.length > 0) {
    text = `${text} RETURNING ${returnClause.join(',')}`;
  }
  /** If client is provided in argument then use client for atomicity */
  if (client) return client.query(text, whereClause.values);
  /** If client is not provide then use client from connection pool */
  return query(text, whereClause.values);
}

function getCommaSeparatedColumns(obj) {
  return Object.keys(obj).join(',');
}

function getObjectValues(obj) {
  return Object.keys(obj).map((key) => obj[key]);
}

function getCommaSeparatedParamSubtitute(obj, counter) {
  let _counter = counter || 1;
  const params = [];
  Object.keys(obj).forEach(() => {
    params.push(`$${_counter}`);
    _counter += 1;
  }, this);
  return params.join(',');
}

function bulkInsert({ tableName, data, returnClause, constraint }) {
  if (data.constructor !== Array && data.length === 0) {
    throw Boom.badRequest('Please provide array of values for bulk insert operation');
  }
  let text = `INSERT INTO ${tableName}(${getCommaSeparatedColumns(data[0])}) VALUES`;
  const values = [];
  const paramsClause = data.map((element, index) => {
    const size = ((Object.keys(element).length) * index) + 1;
    Array.prototype.push.apply(values, getObjectValues(element));
    return `(${getCommaSeparatedParamSubtitute(element, size)})`;
  }).join(', ');
  text = `${text} ${paramsClause}`;

  /** If need to handle cases when the constraint fails for some and other entries should be committed to database */
  if (constraint) {
    text = `${text} ON CONFLICT ON CONSTRAINT ${constraint} DO NOTHING`;
  }

  if (returnClause && returnClause.constructor === Array && returnClause.length > 0) {
    text = `${text} RETURNING ${returnClause.join(',')}`;
  }
  /** If client is not provide then use client from connection pool */
  return query(text, values);
}

module.exports = {
  pool,
  query,
  getClient,
  pgDelete,
  bulkInsert,
};