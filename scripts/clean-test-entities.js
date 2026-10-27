const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: true
});

async function run() {
  await client.connect();
  await client.query("DELETE FROM client_entities WHERE entity_name = 'Test Live Connection Pvt Ltd'");
  const res = await client.query('SELECT id, entity_name, pan FROM client_entities');
  console.log('Current Supabase clients:', res.rows);
  await client.end();
}

run().catch(console.error);
