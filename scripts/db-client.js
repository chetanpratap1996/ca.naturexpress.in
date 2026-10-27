const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

function getDatabaseClient() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  }

  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL environment variable is required. Ensure .env.local exists.');
  }

  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

module.exports = { getDatabaseClient };
