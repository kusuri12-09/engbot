const { Pool } = require('pg');
const { databaseUrl } = require('../config');

function normalizeDatabaseUrl(value) {
  const url = new URL(value);
  const sslMode = url.searchParams.get('sslmode');

  if (['prefer', 'require', 'verify-ca'].includes(sslMode)) {
    url.searchParams.set('sslmode', 'verify-full');
  }

  return url.toString();
}

const pool = new Pool({
  connectionString: normalizeDatabaseUrl(databaseUrl)
});

module.exports = pool;
