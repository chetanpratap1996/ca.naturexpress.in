const { getDatabaseClient } = require('./db-client');

const client = getDatabaseClient();

async function run() {
  await client.connect();
  const res = await client.query("DELETE FROM client_entities WHERE entity_name ILIKE '%test%' OR pan = 'AAAAA0000A'");
  console.log(`Cleaned up test entities: ${res.rowCount} removed.`);
  await client.end();
}

run().catch(console.error);
