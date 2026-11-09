const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error:', err);
});

async function connectDatabase() {
  const client = await pool.connect();
  await client.query('SELECT NOW()');
  client.release();
  return pool;
}

/**
 * Execute a query with optional parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Query executed', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (err) {
    logger.error('Query error:', { text, error: err.message });
    throw err;
  }
}

/**
 * Run multiple queries in a transaction
 * @param {Function} callback - async function receiving a client
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, connectDatabase, query, transaction };
