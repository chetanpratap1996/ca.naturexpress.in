const { getDatabaseClient } = require('./db-client');

const client = getDatabaseClient();

async function applyPolicies() {
  await client.connect();
  // Ensure tables have RLS enabled
  const sql = `
    ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE client_groups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE client_entities ENABLE ROW LEVEL SECURITY;
    ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
    ALTER TABLE dsc_vault ENABLE ROW LEVEL SECURITY;
    ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
  `;
  await client.query(sql);
  console.log('Successfully enforced RLS baseline on Supabase tables!');
  await client.end();
}

applyPolicies().catch(err => {
  console.error('Error applying policies:', err);
  process.exit(1);
});
