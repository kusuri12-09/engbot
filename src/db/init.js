const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('./pool');

async function main() {
  const schemaPath = path.join(__dirname, '..', '..', 'sql', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');

  await pool.query(schema);
  console.log('Database schema initialized.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
