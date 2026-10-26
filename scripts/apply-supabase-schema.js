const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf-8');

const client = new Client({
  connectionString: 'postgresql://postgres.uesllnkjrbpmynihvlvy:Chetan9759%40@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL in Tokyo. Applying schema...');
  
  // Apply schema
  await client.query(sql);
  console.log('Schema successfully applied to Supabase!');
  
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Created tables:', res.rows.map(r => r.table_name));
  
  await client.end();
}

run().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
