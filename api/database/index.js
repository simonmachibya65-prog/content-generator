// Automatic database selector - uses mock or real based on environment
const logger = require('../utils/logger');

// Check if we should use mock database
const useMockDb = !process.env.DATABASE_URL || 
                  process.env.DATABASE_URL.includes('your_') ||
                  process.env.DATABASE_URL.startsWith('#') ||
                  process.env.DATABASE_URL === '';

let db;

if (useMockDb) {
  logger.warn('⚠️  Using MOCK DATABASE - data will not persist');
  db = require('./mockDb');
} else {
  logger.info('Using PostgreSQL database');
  db = require('./connection');
}

module.exports = db;
