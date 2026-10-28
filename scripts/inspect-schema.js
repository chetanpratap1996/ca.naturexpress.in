const { getDatabaseClient } = require('./db-client');

async function inspect() {
  const client = getDatabaseClient();
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name IN ('firms', 'users', 'client_groups', 'client_entities') 
    ORDER BY table_name, ordinal_position;
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

inspect().catch(console.error);
