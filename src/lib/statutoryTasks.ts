import { ClientEntity, ComplianceTask } from "@/lib/types";

/**
 * Generates official statutory compliance obligations for an Indian business entity
 * based on its legal constitution, turnover, and tax registrations.
 */
export function generateStatutoryTasksForClient(client: ClientEntity): ComplianceTask[] {
  const tasks: ComplianceTask[] = [];
  const entityId = client.id;
  const entityName = client.name;
  const groupId = client.groupId || "GRP-DIRECT";
  const pan = client.pan || "AANCP9915B";
  const gstin = client.gstin || (pan ? `09${pan}1Z4` : undefined);
  const partner = client.partnerInCharge || "CA Gunjan Jain";
  const article = client.assignedArticle || "Kriti Jain (Article)";
  const cleanId = client.id.replace(/[^a-zA-Z0-9]/g, "");

  // 1. GSTR-3B Monthly Return Filing (October 2026 - Cutoff 20 Nov 2026)
  tasks.push({
    id: `TSK-GSTR3B-${cleanId}`,
    entityId,
    entityName,
    groupId,
    category: "GST",
    title: "GSTR-3B Monthly Return Filing",
    period: "October 2026",
    dueDate: "2026-11-20",
    status: "DOCUMENTS_AWAITED",
    assignedTo: article,
    reviewedBy: partner,
    priority: "CRITICAL",
    penaltyRisk: 2500,
    accruingDailyPenalty: 50,
    missingDocumentsCount: 2,
    missingDocumentsList: [
      "Bank Statement (Sep-Oct 2026)",
      "Purchase Register & GSTR-2B ITC Match"
    ],
    chaseCount: 1,
    lastChaseDate: "2026-11-04",
    pan,
    gstin,
    taxPayableAmount: 145000,
    section50Interest: 450,
    clientApprovalStatus: "PENDING",
    penaltyNote: "Sec 47 Late Fee (₹50/day) + Sec 50(1) 18% p.a. Cash Interest"
  });

  // 2. GSTR-1 Outward Supplies Return (October 2026 - Cutoff 11 Nov 2026)
  tasks.push({
    id: `TSK-GSTR1-${cleanId}`,
    entityId,
    entityName,
    groupId,
    category: "GST",
    title: "GSTR-1 Monthly Outward Supplies",
    period: "October 2026",
    dueDate: "2026-11-11",
    status: "DOCUMENTS_AWAITED",
    assignedTo: article,
    reviewedBy: partner,
    priority: "CRITICAL",
    penaltyRisk: 1000,
    accruingDailyPenalty: 50,
    missingDocumentsCount: 1,
    missingDocumentsList: [
      "B2B Sales Invoices & E-way Bill Summary"
    ],
    chaseCount: 1,
    pan,
    gstin,
    clientApprovalStatus: "PENDING",
    penaltyNote: "Sec 47 Late Fee (₹50/day)"
  });

  // 3. Advance Tax Q3 Installment (FY 2026-27 - Cutoff 15 Dec 2026)
  tasks.push({
    id: `TSK-ADVTAX-${cleanId}`,
    entityId,
    entityName,
    groupId,
    category: "INCOME_TAX",
    title: "Advance Tax Q3 Installment (75% Cumulative)",
    period: "FY 2026-27",
    dueDate: "2026-12-15",
    status: "IN_PREPARATION",
    assignedTo: article,
    reviewedBy: partner,
    priority: "HIGH",
    penaltyRisk: 7500,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 1,
    missingDocumentsList: [
      "Estimated Q3 Profit & Loss / Trial Balance"
    ],
    chaseCount: 0,
    pan,
    taxPayableAmount: 85000,
    clientApprovalStatus: "PENDING",
    penaltyNote: "Sec 234C 1% simple interest per month on deferment of advance tax"
  });

  // 4. Monthly TDS Deposit Challan 281 (October Deductions - Cutoff 07 Nov 2026)
  tasks.push({
    id: `TSK-TDS-${cleanId}`,
    entityId,
    entityName,
    groupId,
    category: "TDS",
    title: "TDS Monthly Deposit Challan 281",
    period: "October 2026",
    dueDate: "2026-11-07",
    status: "DOCUMENTS_AWAITED",
    assignedTo: article,
    reviewedBy: partner,
    priority: "HIGH",
    penaltyRisk: 3000,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 1,
    missingDocumentsList: [
      "October Salary & Contractor TDS Deduction Register"
    ],
    chaseCount: 1,
    pan,
    tan: client.tan || undefined,
    taxPayableAmount: 32000,
    clientApprovalStatus: "PENDING",
    penaltyNote: "Sec 201(1A) 1.5% interest per month from date of deduction to deposit"
  });

  // 5. Form 3CD Tax Audit Final Report (if PVT_LTD, PUBLIC_LTD, LLP, or turnover >= 1 Cr)
  if (
    client.type === "PVT_LTD" ||
    client.type === "PUBLIC_LTD" ||
    client.type === "LLP" ||
    (client.turnoverCr && client.turnoverCr >= 1)
  ) {
    tasks.push({
      id: `TSK-3CD-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "TAX_AUDIT",
      title: "Form 3CD Tax Audit Final Certification",
      period: "FY 2025-26 (AY 2026-27)",
      dueDate: "2026-10-31",
      status: "IN_PREPARATION",
      assignedTo: article,
      reviewedBy: partner,
      priority: "CRITICAL",
      penaltyRisk: 150000,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 2,
      missingDocumentsList: [
        "Depreciation Schedule as per IT Act & Companies Act",
        "Form 26AS & AIS Reconciled Ledger"
      ],
      chaseCount: 2,
      pan,
      cin: client.cin,
      clientApprovalStatus: "APPROVED",
      penaltyNote: "Sec 271B: 0.5% of turnover capped at ₹1,50,000 for audit failure"
    });

    if (client.type === "PVT_LTD" || client.type === "PUBLIC_LTD") {
      // ROC MCA AOC-4 Filing
      tasks.push({
        id: `TSK-AOC4-${cleanId}`,
        entityId,
        entityName,
        groupId,
        category: "ROC_MCA",
        title: "ROC Form AOC-4 (Financial Statements Filing)",
        period: "FY 2025-26",
        dueDate: "2026-11-30",
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "MEDIUM",
        penaltyRisk: 10000,
        accruingDailyPenalty: 100,
        missingDocumentsCount: 1,
        missingDocumentsList: [
          "Signed Directors Report & Audited Balance Sheet"
        ],
        chaseCount: 0,
        cin: client.cin,
        pan,
        penaltyNote: "Sec 403 MCA Additional Late Fee: ₹100/day per form"
      });
    }
  }

  return tasks;
}
