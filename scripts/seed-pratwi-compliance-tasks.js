const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  console.log('--- Checking & Seeding Statutory Tasks in PostgreSQL ---');
  
  // 1. Fetch Pratwi Solutions entity
  const { rows: entities } = await pool.query(
    "SELECT id, entity_name, firm_id, pan FROM client_entities WHERE pan = 'AANCP9915B' OR id = 'ddd33056-b6dc-46ca-b145-cd111045aff7' LIMIT 1;"
  );

  if (entities.length === 0) {
    console.warn('Pratwi entity not found in DB!');
    process.exit(1);
  }

  const pratwi = entities[0];
  console.log(`Found entity: ${pratwi.entity_name} (${pratwi.id})`);

  // 2. Check existing tasks for Pratwi
  const { rows: existingTasks } = await pool.query(
    "SELECT count(*) FROM compliance_tasks WHERE entity_id = $1;",
    [pratwi.id]
  );

  const taskCount = parseInt(existingTasks[0].count);
  console.log(`Current tasks for Pratwi: ${taskCount}`);

  if (taskCount === 0) {
    console.log('Seeding standard compliance suite for Pratwi Solutions...');
    const tasks = [
      {
        category: 'GST',
        title: 'GSTR-1 (Monthly Outward Supplies)',
        period: 'October 2026',
        due_date: '2026-11-11',
        status: 'IN_PREPARATION',
        priority: 'HIGH',
        penalty_risk: 2500,
        accruing_daily_penalty: 50
      },
      {
        category: 'GST',
        title: 'GSTR-3B (Monthly Summary & Tax Payment)',
        period: 'October 2026',
        due_date: '2026-11-20',
        status: 'DOCUMENTS_AWAITED',
        priority: 'CRITICAL',
        penalty_risk: 5000,
        accruing_daily_penalty: 50
      },
      {
        category: 'TDS',
        title: 'TDS Payment Deposit (Challan 281)',
        period: 'October 2026',
        due_date: '2026-11-07',
        status: 'DOCUMENTS_AWAITED',
        priority: 'CRITICAL',
        penalty_risk: 10000,
        accruing_daily_penalty: 100
      },
      {
        category: 'INCOME_TAX',
        title: 'Advance Tax Q3 Instalment (Section 208)',
        period: 'Q3 FY 2026-27',
        due_date: '2026-12-15',
        status: 'DOCUMENTS_AWAITED',
        priority: 'HIGH',
        penalty_risk: 15000,
        accruing_daily_penalty: 0
      },
      {
        category: 'TAX_AUDIT',
        title: 'Form 3CD Tax Audit Finalization',
        period: 'AY 2026-27',
        due_date: '2026-11-30',
        status: 'IN_PREPARATION',
        priority: 'HIGH',
        penalty_risk: 150000,
        accruing_daily_penalty: 0
      }
    ];

    for (const t of tasks) {
      await pool.query(
        `INSERT INTO compliance_tasks (firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty, chase_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0)`,
        [pratwi.firm_id, pratwi.id, t.category, t.title, t.period, t.due_date, t.status, t.priority, t.penalty_risk, t.accruing_daily_penalty]
      );
    }
    console.log(`✓ Successfully seeded ${tasks.length} statutory compliance tasks for Pratwi Solutions!`);
  } else {
    console.log(`Pratwi already has ${taskCount} tasks.`);
  }

  // 3. Verify total tasks across the database
  const { rows: allTasks } = await pool.query(
    "SELECT ct.id, ce.entity_name, ct.title, ct.category, ct.due_date, ct.status FROM compliance_tasks ct JOIN client_entities ce ON ct.entity_id = ce.id ORDER BY ct.due_date ASC;"
  );
  console.log(`\nTotal Active Compliance Tasks in DB (${allTasks.length}):`);
  console.table(allTasks);

  await pool.end();
}

seed().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
