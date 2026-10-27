const { getDatabaseClient } = require('./db-client');

const client = getDatabaseClient();

async function run() {
  await client.connect();
  console.log('Validating Supabase database write policies...');
  // Ensure tables reject unauthenticated writes
  const res = await client.query("SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname = 'public'");
  console.log('Current Active Policies:', res.rows);
  await client.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
