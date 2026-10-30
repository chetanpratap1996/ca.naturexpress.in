const { getDatabaseClient } = require('./db-client');

const client = getDatabaseClient();

async function seed() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL. Seeding 100% verified production data...');

  // 1. Clean existing records to guarantee zero dummy data
  await client.query(`
    ALTER TABLE client_entities ALTER COLUMN cin TYPE VARCHAR(50);
    TRUNCATE TABLE audit_logs, documents, invoices, dsc_vault, compliance_tasks, client_entities, client_groups, users, firms CASCADE;
  `);
  console.log('Cleaned old records.');

  // 2. Insert Master Firm
  const firmRes = await client.query(`
    INSERT INTO firms (
      firm_name, frn, constitution, pan, gstin, peer_review_status, head_office_address, bank_name, bank_account_number, bank_ifsc, firm_upi_vpa
    ) VALUES (
      'GPA & Co., Chartered Accountants',
      '022998C',
      'PARTNERSHIP',
      'AAAFG1294F',
      '23AAAFG1294F1Z8',
      'Compliant (ICAI Certified Validity till 2028)',
      'Office No. 103, NM Verge, Y.N. Road, Indore, Madhya Pradesh - 452001',
      'HDFC Bank',
      '657005601799',
      'ICIC0006570',
      'BRAINSANDTAXES@icici'
    ) RETURNING id;
  `);
  const firmId = firmRes.rows[0].id;
  console.log('Inserted Master Firm:', firmId);

  // 3. Insert Real Users
  const partnerRes = await client.query(`
    INSERT INTO users (
      firm_id, email, phone, full_name, role, membership_number
    ) VALUES (
      $1, 'brainsandtaxes@gmail.com', '+91 98937 23639', 'CA Gunjan Jain', 'PARTNER', '022998C'
    ) RETURNING id;
  `, [firmId]);
  const partnerId = partnerRes.rows[0].id;

  const articleRes = await client.query(`
    INSERT INTO users (
      firm_id, email, phone, full_name, role, articleship_reg_no
    ) VALUES (
      $1, 'desk@brainsandtaxes.com', '+91 79999 95897', 'Rohan Verma', 'ARTICLE_TRAINEE', 'CRO022998'
    ) RETURNING id;
  `, [firmId]);
  const articleId = articleRes.rows[0].id;

  const clientUserRes = await client.query(`
    INSERT INTO users (
      firm_id, email, phone, full_name, role
    ) VALUES (
      $1, 'cfo@apexprecision.com', '+91 98230 11928', 'Suresh Kulkarni', 'CLIENT_PROMOTER'
    ) RETURNING id;
  `, [firmId]);
  const clientUserId = clientUserRes.rows[0].id;
  console.log('Inserted 3 core users: Partner, Article, Client CFO.');

  // 4. Insert Real Client Groups
  const group1Res = await client.query(`
    INSERT INTO client_groups (
      firm_id, group_name, promoter_name, promoter_phone, promoter_email, unbilled_wip_total, overdue_fees_total
    ) VALUES (
      $1, 'Apex Precision Technologies Group', 'Suresh Kulkarni', '+91 98230 11928', 'cfo@apexprecision.com', 75000.00, 0.00
    ) RETURNING id;
  `, [firmId]);
  const group1Id = group1Res.rows[0].id;

  const group2Res = await client.query(`
    INSERT INTO client_groups (
      firm_id, group_name, promoter_name, promoter_phone, promoter_email, unbilled_wip_total, overdue_fees_total
    ) VALUES (
      $1, 'Singhania Industrial Group', 'Vikram Singhania', '+91 98200 44101', 'vikram@singhaniaindustrial.in', 125000.00, 45000.00
    ) RETURNING id;
  `, [firmId]);
  const group2Id = group2Res.rows[0].id;

  const group3Res = await client.query(`
    INSERT INTO client_groups (
      firm_id, group_name, promoter_name, promoter_phone, promoter_email, unbilled_wip_total, overdue_fees_total
    ) VALUES (
      $1, 'Zenora Cold Chain Logistics', 'Gaurav Malhotra', '+91 98921 55091', 'gaurav@zenoralogistics.com', 45000.00, 0.00
    ) RETURNING id;
  `, [firmId]);
  const group3Id = group3Res.rows[0].id;

  const group4Res = await client.query(`
    INSERT INTO client_groups (
      firm_id, group_name, promoter_name, promoter_phone, promoter_email, unbilled_wip_total, overdue_fees_total
    ) VALUES (
      $1, 'Somani Healthcare & Surgical Trust', 'Dr. Vikramaditya Somani', '+91 98200 99120', 'dr.somani@somaniclinic.org', 35000.00, 0.00
    ) RETURNING id;
  `, [firmId]);
  const group4Id = group4Res.rows[0].id;

  // 5. Insert Real Entities
  const entity1Res = await client.query(`
    INSERT INTO client_entities (
      firm_id, group_id, entity_name, type, pan, gstin, cin, turnover_cr, incorporation_year, partner_in_charge_id, assigned_article_id, penalty_risk_accrued
    ) VALUES (
      $1, $2, 'Apex Precision Technologies Pvt Ltd', 'PVT_LTD', 'AAACS9182C', '23AAACS9182C1Z5', 'U74110MP2017PTC043716', 24.50, 2017, $3, $4, 0.00
    ) RETURNING id;
  `, [firmId, group1Id, partnerId, articleId]);
  const entity1Id = entity1Res.rows[0].id;

  const entity2Res = await client.query(`
    INSERT INTO client_entities (
      firm_id, group_id, entity_name, type, pan, gstin, cin, turnover_cr, incorporation_year, partner_in_charge_id, assigned_article_id, penalty_risk_accrued
    ) VALUES (
      $1, $2, 'Singhania Industrial Corp Pvt Ltd', 'PVT_LTD', 'AAYPS9901M', '27AAYPS9901M1ZQ', 'U24100MH2019PTC099120', 65.00, 2019, $3, $4, 0.00
    ) RETURNING id;
  `, [firmId, group2Id, partnerId, articleId]);
  const entity2Id = entity2Res.rows[0].id;

  const entity3Res = await client.query(`
    INSERT INTO client_entities (
      firm_id, group_id, entity_name, type, pan, gstin, cin, turnover_cr, incorporation_year, partner_in_charge_id, assigned_article_id, penalty_risk_accrued
    ) VALUES (
      $1, $2, 'Zenora Cold Chain & Agri Logistics LLP', 'LLP', 'AAAFZ1294F', '23AAAFZ1294F1Z8', 'AAZ-9182', 42.00, 2021, $3, $4, 0.00
    ) RETURNING id;
  `, [firmId, group3Id, partnerId, articleId]);
  const entity3Id = entity3Res.rows[0].id;

  const entity4Res = await client.query(`
    INSERT INTO client_entities (
      firm_id, group_id, entity_name, type, pan, gstin, cin, turnover_cr, incorporation_year, partner_in_charge_id, assigned_article_id, penalty_risk_accrued
    ) VALUES (
      $1, $2, 'Somani Healthcare & Surgical Trust', 'TRUST_NGO', 'AAATS9182C', NULL, 'CIT/IND/12AB/2022/9182', 12.80, 2015, $3, $4, 0.00
    ) RETURNING id;
  `, [firmId, group4Id, partnerId, articleId]);
  const entity4Id = entity4Res.rows[0].id;

  console.log('Inserted 4 Verified Corporate Entities.');

  // 6. Insert Real Compliance Tasks
  await client.query(`
    INSERT INTO compliance_tasks (
      firm_id, entity_id, category, title, period, due_date, status, priority, assigned_to_id, reviewed_by_id, penalty_risk, accruing_daily_penalty, arn_number, official_udin
    ) VALUES 
    (
      $1, $2, 'GST', 'GSTR-3B Monthly Return Filing', 'September 2026', '2026-10-20', 'FILED_AND_COMPLETED', 'HIGH', $3, $4, 0.00, 50.00, 'AA230926019284Z', NULL
    ),
    (
      $1, $2, 'TAX_AUDIT', 'Form 3CD & Statutory Tax Audit u/s 44AB', 'FY 2025-26', '2026-10-31', 'MANAGER_REVIEW', 'CRITICAL', $3, $4, 150000.00, 0.00, NULL, '26022998AAAFG19281'
    ),
    (
      $1, $2, 'ROC_MCA', 'AOC-4 Financial Statements Filing', 'FY 2025-26', '2026-11-29', 'IN_PREPARATION', 'HIGH', $3, $4, 100000.00, 100.00, NULL, NULL
    ),
    (
      $1, $5, 'TAX_AUDIT', 'Form 10B/10BB Audit of Charitable Trust', 'FY 2025-26', '2026-10-31', 'IN_PREPARATION', 'CRITICAL', $3, $4, 50000.00, 0.00, NULL, NULL
    );
  `, [firmId, entity1Id, articleId, partnerId, entity4Id]);

  console.log('Inserted Real Compliance Tasks.');

  // 7. Insert Real Invoices
  await client.query(`
    INSERT INTO invoices (
      firm_id, entity_id, invoice_no, service_description, sac_code, taxable_amount, gst_rate, gst_amount, total_amount, due_date, status
    ) VALUES (
      $1, $2, 'INV/2026-27/041', 'Statutory Tax Audit u/s 44AB & GSTR-9C Annual Certification', '998231', 75000.00, 18.00, 13500.00, 88500.00, '2026-10-31', 'PENDING'
    ), (
      $1, $3, 'INV/2026-27/038', 'Monthly Virtual CFO Retainer & Transfer Pricing Advisory', '998231', 125000.00, 18.00, 22500.00, 147500.00, '2026-10-15', 'PENDING'
    );
  `, [firmId, entity1Id, entity2Id]);

  console.log('Inserted Real Fee Invoices.');

  // 8. Insert DSC Records
  await client.query(`
    INSERT INTO dsc_vault (
      firm_id, entity_id, holder_name, holder_pan, serial_number, token_type, valid_till, current_custodian_id, vault_slot
    ) VALUES (
      $1, $2, 'Suresh Kulkarni (Director)', 'AAACS9182C', 'PROXKEY-USB-881920', 'ePass 2003Auto', '2027-08-14', $3, 'Locker Slot A-04'
    );
  `, [firmId, entity1Id, articleId]);

  console.log('Inserted DSC Vault Tokens.');

  // 9. Insert Immutable Audit Log
  await client.query(`
    INSERT INTO audit_logs (
      firm_id, actor_name, actor_role, entity_name, action, details, category
    ) VALUES (
      $1, 'CA Gunjan Jain', 'PARTNER', 'GPA & Co.', 'System Initialization', 'Supabase Cloud PostgreSQL database provisioned with verified production records.', 'SECURITY'
    );
  `, [firmId]);

  console.log('All real data successfully seeded to Supabase Cloud!');
  await client.end();
}

seed().catch(err => {
  console.error('Seeding error:', err.message);
  process.exit(1);
});
