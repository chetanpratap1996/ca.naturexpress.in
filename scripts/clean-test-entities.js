const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.uesllnkjrbpmynihvlvy:Chetan9759%40@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query("DELETE FROM client_entities WHERE entity_name = 'Test Live Connection Pvt Ltd'");
  const res = await client.query('SELECT id, entity_name, pan FROM client_entities');
  console.log('Current Supabase clients:', res.rows);
  await client.end();
}

run().catch(console.error);
