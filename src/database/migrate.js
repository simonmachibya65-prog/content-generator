require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDatabase, query } = require('./connection');
const logger = require('../utils/logger');

async function migrate() {
  try {
    await connectDatabase();
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await query(schema);
    logger.info('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
