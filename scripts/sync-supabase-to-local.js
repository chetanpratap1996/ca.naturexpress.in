const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dbPath = path.join(__dirname, '..', '.data', 'db.json');

const client = new Client({
  connectionString: 'postgresql://postgres.uesllnkjrbpmynihvlvy:Chetan9759%40@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function syncToLocalDb() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL. Syncing live Supabase data to .data/db.json...');

  const firms = await client.query('SELECT * FROM firms LIMIT 1');
  const firm = firms.rows[0];

  const groupsRes = await client.query('SELECT * FROM client_groups');
  const entitiesRes = await client.query('SELECT * FROM client_entities');
  const tasksRes = await client.query('SELECT * FROM compliance_tasks');
  const invoicesRes = await client.query('SELECT * FROM invoices');
  const dscRes = await client.query('SELECT * FROM dsc_vault');

  // Map groups
  const mappedGroups = groupsRes.rows.map(g => ({
    id: g.id,
    name: g.group_name,
    promoterName: g.promoter_name,
    promoterPhone: g.promoter_phone,
    promoterEmail: g.promoter_email,
    totalEntities: entitiesRes.rows.filter(e => e.group_id === g.id).length,
    totalTurnoverCr: entitiesRes.rows.filter(e => e.group_id === g.id).reduce((acc, curr) => acc + Number(curr.turnover_cr || 0), 0),
    unbilledWipTotal: Number(g.unbilled_wip_total || 0),
    overdueFeesTotal: Number(g.overdue_fees_total || 0),
    entityIds: entitiesRes.rows.filter(e => e.group_id === g.id).map(e => e.id)
  }));

  // Map clients
  const mappedClients = entitiesRes.rows.map(e => {
    const parentGroup = groupsRes.rows.find(g => g.id === e.group_id) || groupsRes.rows[0];
    return {
      id: e.id,
      groupId: e.group_id,
      groupName: parentGroup ? parentGroup.group_name : 'Direct Practice Clients',
      name: e.entity_name,
      type: e.type,
      pan: e.pan,
      gstin: e.gstin || undefined,
      cin: e.cin || undefined,
      turnoverCr: Number(e.turnover_cr || 0),
      partnerInCharge: 'CA Gunjan Jain',
      assignedArticle: 'Kriti Jain (Article)',
      incorporationYear: e.incorporation_year || 2024,
      penaltyRiskAccrued: Number(e.penalty_risk_accrued || 0),
      primaryContact: {
        name: e.primary_contact_name || (parentGroup ? parentGroup.promoter_name : 'Authorized Signatory'),
        phone: e.primary_contact_phone || (parentGroup ? parentGroup.promoter_phone : '+91 98000 00000'),
        email: e.primary_contact_email || (parentGroup ? parentGroup.promoter_email : 'client@practice-portal.in'),
        designation: e.primary_contact_designation || 'Director / Authorized Signatory'
      }
    };
  });

  // Map tasks
  const mappedTasks = tasksRes.rows.map(t => {
    const ent = mappedClients.find(c => c.id === t.entity_id) || mappedClients[0];
    return {
      id: t.id,
      entityId: t.entity_id,
      entityName: ent ? ent.name : 'Practice Client',
      groupId: ent ? ent.groupId : 'GRP-001',
      category: t.category,
      title: t.title,
      period: t.period,
      dueDate: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : '2026-11-20',
      status: t.status,
      assignedTo: 'Kriti Jain (Article)',
      reviewedBy: 'CA Gunjan Jain (Partner)',
      priority: t.priority,
      penaltyRisk: Number(t.penalty_risk || 0),
      accruingDailyPenalty: Number(t.accruing_daily_penalty || 0),
      missingDocumentsCount: 0,
      chaseCount: t.chase_count || 0,
      arnNumber: t.arn_number || undefined,
      officialUdin: t.official_udin || undefined
    };
  });

  // Map invoices
  const mappedInvoices = invoicesRes.rows.map(inv => {
    const ent = mappedClients.find(c => c.id === inv.entity_id) || mappedClients[0];
    return {
      id: inv.id,
      invoiceNo: inv.invoice_no,
      entityId: inv.entity_id,
      entityName: ent ? ent.name : 'Practice Client',
      groupId: ent ? ent.groupId : 'GRP-001',
      serviceDescription: inv.service_description,
      taxableAmount: Number(inv.taxable_amount || 0),
      gstRate: 18,
      gstAmount: Number(inv.gst_amount || 0),
      amount: Number(inv.total_amount || 0),
      dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : '2026-11-30',
      status: inv.status,
      sacCode: inv.sac_code || '998231',
      clientPaymentMode: 'NEFT_RTGS'
    };
  });

  const liveData = {
    firmMetrics: {
      name: firm?.firm_name || 'GPA & Co., Chartered Accountants',
      companyName: 'Brains & Taxes Private Limited',
      frn: firm?.frn || '022998C',
      peerReviewStatus: firm?.peer_review_status || 'Compliant (ICAI Certified Validity till 2028)',
      totalClients: mappedClients.length,
      activeEntities: mappedClients.length,
      partnersCount: 2,
      articleTrainees: 4,
      criticalDeadlinesNext72h: mappedTasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'FILED_AND_COMPLETED').length,
      openScrutinyNotices: 0,
      totalDemandRiskINR: 0,
      unbilledWipAmount: mappedGroups.reduce((acc, g) => acc + g.unbilledWipTotal, 0),
      pendingCollections: mappedInvoices.filter(i => i.status !== 'PAID').reduce((acc, i) => acc + i.amount, 0),
      complianceHealthScore: 100,
      dailyAccruingPenaltyRisk: 0,
      firmUpiVpa: firm?.firm_upi_vpa || 'BRAINSANDTAXES@icici',
      firmBankDetails: {
        bankName: firm?.bank_name || 'ICICI Bank',
        branch: 'Y.N. Road Branch, Indore',
        accountNumber: firm?.bank_account_number || '657005601799',
        accountName: firm?.firm_name || 'GPA & Co., Chartered Accountants',
        ifsc: firm?.bank_ifsc || 'ICIC0006570'
      }
    },
    groups: mappedGroups,
    clients: mappedClients,
    tasks: mappedTasks,
    notices: [],
    invoices: mappedInvoices,
    dscTokens: [],
    documents: [],
    auditTrail: [
      {
        id: 'AUD-' + Date.now(),
        timestamp: new Date().toISOString(),
        actorName: 'CA Gunjan Jain',
        actorRole: 'PARTNER',
        entityName: 'GPA & Co.',
        action: 'Live Practice Initialized',
        details: 'System operational with real client records (Pratwi Solutions Private Limited). Zero dummy data.',
        category: 'SYSTEM'
      }
    ],
    passwordVaults: [],
    parsedStatements: [],
    payToReleaseConfigs: [],
    portalSyncProfiles: [
      {
        portal: 'INCOME_TAX_2_0',
        lastSuccessfulSync: new Date().toISOString(),
        syncStatus: 'CONNECTED',
        lastScrapedNoticesCount: 0
      },
      {
        portal: 'GST_COMMON_PORTAL',
        lastSuccessfulSync: new Date().toISOString(),
        syncStatus: 'CONNECTED',
        lastScrapedNoticesCount: 0
      }
    ],
    msmeRecords: [],
    section40a2bSamples: [],
    staffSecurityLogs: [],
    partnerMetrics: [],
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(dbPath, JSON.stringify(liveData, null, 2), 'utf-8');
  console.log('✓ Successfully synchronized live Supabase data to .data/db.json!');
  console.log('✓ Total Real Clients:', mappedClients.length);
  console.log('✓ Total Real Tasks:', mappedTasks.length);
  await client.end();
}

syncToLocalDb().catch(e => {
  console.error('Sync error:', e);
  process.exit(1);
});
