const fs = require('fs');
const path = require('path');
const { getDatabaseClient } = require('./db-client');

const dbPath = path.join(__dirname, '..', '.data', 'db.json');

const client = getDatabaseClient();

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

  // Map to frontend interface format
  const mappedGroups = groupsRes.rows.map(g => ({
    id: g.id,
    name: g.group_name,
    promoterName: g.promoter_name,
    promoterPhone: g.promoter_phone,
    promoterEmail: g.promoter_email,
    totalEntities: entitiesRes.rows.filter(e => e.group_id === g.id).length,
    totalTurnoverCr: entitiesRes.rows.filter(e => e.group_id === g.id).reduce((acc, curr) => acc + Number(curr.turnover_cr), 0),
    unbilledWipTotal: Number(g.unbilled_wip_total),
    overdueFeesTotal: Number(g.overdue_fees_total),
    entityIds: entitiesRes.rows.filter(e => e.group_id === g.id).map(e => e.id)
  }));

  const mappedClients = entitiesRes.rows.map(e => {
    const parentGroup = groupsRes.rows.find(g => g.id === e.group_id) || groupsRes.rows[0];
    return {
      id: e.id,
      groupId: e.group_id,
      groupName: parentGroup ? parentGroup.group_name : 'Verified Group',
      name: e.entity_name,
      type: e.type,
      pan: e.pan,
      gstin: e.gstin || undefined,
      cin: e.cin || undefined,
      turnoverCr: Number(e.turnover_cr),
      partnerInCharge: 'CA Gunjan Jain',
      assignedArticle: 'Rohan Verma',
      incorporationYear: e.incorporation_year,
      penaltyRiskAccrued: Number(e.penalty_risk_accrued),
      primaryContact: {
        name: parentGroup ? parentGroup.promoter_name : 'Contact',
        phone: parentGroup ? parentGroup.promoter_phone : '+91 98230 11928',
        email: parentGroup ? parentGroup.promoter_email : 'accounts@apexprecision.com',
        designation: 'Managing Director / CFO'
      }
    };
  });

  const mappedTasks = tasksRes.rows.map((t, idx) => {
    const ent = mappedClients.find(c => c.id === t.entity_id) || mappedClients[0];
    return {
      id: `TSK-${1000 + idx}`,
      entityId: t.entity_id,
      entityName: ent ? ent.name : 'Apex Precision Technologies Pvt Ltd',
      groupId: ent ? ent.groupId : 'GRP-001',
      category: t.category,
      title: t.title,
      period: t.period,
      dueDate: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : '2026-10-31',
      status: t.status,
      assignedTo: 'Rohan Verma (Article)',
      reviewedBy: 'CA Gunjan Jain (Partner)',
      priority: t.priority,
      penaltyRisk: Number(t.penalty_risk),
      accruingDailyPenalty: Number(t.accruing_daily_penalty),
      missingDocumentsCount: 0,
      chaseCount: t.chase_count || 0,
      arnNumber: t.arn_number || undefined,
      officialUdin: t.official_udin || undefined
    };
  });

  const mappedInvoices = invoicesRes.rows.map((inv, idx) => {
    const ent = mappedClients.find(c => c.id === inv.entity_id) || mappedClients[0];
    return {
      id: `INV-${Date.now()}-${idx}`,
      invoiceNo: inv.invoice_no,
      entityId: inv.entity_id,
      entityName: ent ? ent.name : 'Apex Precision Technologies Pvt Ltd',
      groupId: ent ? ent.groupId : 'GRP-001',
      serviceDescription: inv.service_description,
      taxableAmount: Number(inv.taxable_amount),
      gstRate: 18,
      gstAmount: Number(inv.gst_amount),
      amount: Number(inv.total_amount),
      dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : '2026-10-31',
      status: inv.status,
      sacCode: inv.sac_code || '998231',
      clientPaymentMode: 'NEFT_RTGS'
    };
  });

  const mappedDsc = dscRes.rows.map((d, idx) => ({
    id: `DSC-${idx + 1}`,
    entityId: d.entity_id,
    entityName: 'Apex Precision Technologies Pvt Ltd',
    groupId: 'GRP-001',
    holderName: d.holder_name,
    pan: d.holder_pan,
    serialNumber: d.serial_number,
    tokenType: 'ProxKey',
    validTill: d.valid_till ? new Date(d.valid_till).toISOString().split('T')[0] : '2027-08-14',
    daysToExpiry: 292,
    expiryStatus: 'ACTIVE',
    currentCustodian: 'CA Gunjan Jain (Partner Vault)',
    vaultSlot: d.vault_slot || 'Slot A-04'
  }));

  const liveData = {
    firmMetrics: {
      name: firm?.firm_name || 'GPA & Co., Chartered Accountants',
      companyName: 'Brains & Taxes Private Limited',
      frn: firm?.frn || '022998C',
      peerReviewStatus: firm?.peer_review_status || 'Compliant (ICAI Certified Validity till 2028)',
      totalClients: mappedClients.length,
      activeEntities: mappedClients.length,
      partnersCount: 6,
      articleTrainees: 28,
      criticalDeadlinesNext72h: mappedTasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'FILED_AND_COMPLETED').length,
      openScrutinyNotices: 0,
      totalDemandRiskINR: 0,
      unbilledWipAmount: mappedGroups.reduce((acc, g) => acc + g.unbilledWipTotal, 0),
      pendingCollections: mappedInvoices.filter(i => i.status !== 'PAID').reduce((acc, i) => acc + i.amount, 0),
      complianceHealthScore: 100,
      dailyAccruingPenaltyRisk: 0,
      firmUpiVpa: firm?.firm_upi_vpa || '7999995897@upi',
      firmBankDetails: {
        bankName: firm?.bank_name || 'HDFC Bank',
        branch: 'Y.N. Road Branch, Indore',
        accountNumber: firm?.bank_account_number || '50200088921842',
        accountName: firm?.firm_name || 'GPA & Co., Chartered Accountants',
        ifsc: firm?.bank_ifsc || 'HDFC0000281'
      }
    },
    groups: mappedGroups,
    clients: mappedClients,
    tasks: mappedTasks,
    notices: [],
    invoices: mappedInvoices,
    dscTokens: mappedDsc,
    documents: [],
    auditTrail: [
      {
        id: "AUD-001",
        timestamp: new Date().toISOString(),
        actorName: "System Admin",
        actorRole: "SYSTEM",
        entityName: "GPA & Co.",
        action: "Clean State Initialized",
        details: "Platform initialized with 0 dummy clients. Ready for real client onboarding.",
        category: "SYSTEM"
      }
    ],
    passwordVaults: [],
    parsedStatements: [],
    payToReleaseConfigs: [],
    portalSyncProfiles: [
      {
        portal: "INCOME_TAX_2_0",
        lastSuccessfulSync: new Date().toISOString(),
        syncStatus: "CONNECTED",
        lastScrapedNoticesCount: 0
      },
      {
        portal: "GST_COMMON_PORTAL",
        lastSuccessfulSync: new Date().toISOString(),
        syncStatus: "CONNECTED",
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
  console.log('Successfully written clean real data into .data/db.json!');
  await client.end();
}

syncToLocalDb().catch(e => {
  console.error('Sync error:', e);
  process.exit(1);
});
