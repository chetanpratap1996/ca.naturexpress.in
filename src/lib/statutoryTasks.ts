import { ClientEntity, ComplianceTask } from "@/lib/types";

/**
 * Generates official statutory compliance obligations for an Indian business entity
 * strictly based on its legal constitution, tax registrations (GSTIN, TAN, PAN),
 * and audited turnover thresholds under Indian Tax and Corporate Laws.
 */
export function generateStatutoryTasksForClient(client: ClientEntity): ComplianceTask[] {
  const tasks: ComplianceTask[] = [];
  const entityId = client.id;
  const entityName = client.name;
  const groupId = client.groupId || "GRP-DIRECT";
  const pan = client.pan || "";
  const gstin = client.gstin || undefined;
  const tan = client.tan || undefined;
  const cin = client.cin || undefined;
  const partner = client.partnerInCharge || "CA Gunjan Jain";
  const article = client.assignedArticle || "Kriti Jain (Article)";
  const cleanId = client.id.replace(/[^a-zA-Z0-9]/g, "");

  const isCorporate =
    client.type === "PVT_LTD" ||
    client.type === "PUBLIC_LTD";

  const isLlp = client.type === "LLP";

  // 1. GST Compliance Obligations (ONLY if entity holds an active GSTIN registration)
  if (gstin && gstin.trim().length === 15) {
    // GSTR-1: Monthly Outward Supplies (Cutoff 11th of subsequent month)
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
      accruingDailyPenalty: 0, // 0 until statutory cutoff is breached
      missingDocumentsCount: 1,
      missingDocumentsList: [
        "B2B Sales Invoices & E-way Bill Summary"
      ],
      chaseCount: 0,
      pan,
      gstin,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 47 Late Fee (₹50/day; ₹20/day for Nil) applicable only post due date"
    });

    // GSTR-3B: Monthly Summary Return & Cash Ledger Payment (Cutoff 20th of subsequent month)
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
      accruingDailyPenalty: 0, // 0 until statutory cutoff is breached
      missingDocumentsCount: 2,
      missingDocumentsList: [
        "Bank Statement (Sep-Oct 2026)",
        "Purchase Register & GSTR-2B ITC Match"
      ],
      chaseCount: 0,
      pan,
      gstin,
      taxPayableAmount: 0,
      section50Interest: 0,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 47 Late Fee (₹50/day) + Sec 50(1) 18% p.a. Cash Interest only if delayed"
    });
  }

  // 2. TDS Deposit Challan 281 (ONLY if entity holds a TAN or is corporate with payroll/vendor deductions)
  if (tan || isCorporate) {
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
      penaltyRisk: 1000,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: [
        "October Salary & Contractor TDS Deduction Register"
      ],
      chaseCount: 0,
      pan,
      tan,
      taxPayableAmount: 0,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 201(1A) 1.5% interest per month from date of deduction to deposit"
    });
  }

  // 3. Advance Tax Q3 Installment (Mandatory for Corporates & high-liability assessees u/s 208-211)
  if (isCorporate || (client.turnoverCr && client.turnoverCr >= 1)) {
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
      penaltyRisk: 5000,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: [
        "Estimated Q3 Profit & Loss / Trial Balance"
      ],
      chaseCount: 0,
      pan,
      taxPayableAmount: 0,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 234C 1% simple interest per month on deferment of advance tax"
    });
  }

  // 4. Form 3CD Tax Audit Final Report (Section 44AB threshold: turnover >= 10 Cr or >= 1 Cr cash-heavy)
  if (client.turnoverCr && client.turnoverCr >= 10) {
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
      chaseCount: 0,
      pan,
      cin,
      clientApprovalStatus: "APPROVED",
      penaltyNote: "Sec 271B: 0.5% of turnover capped at ₹1,50,000 for audit delay"
    });
  }

  // 5. ROC / MCA Statutory Filings (ONLY for Incorporated Companies under Companies Act, 2013)
  if (isCorporate) {
    // Form AOC-4: Financial Statements & Auditor's Report (30 days from AGM)
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
      penaltyRisk: 5000,
      accruingDailyPenalty: 0, // 0 until statutory cutoff is breached
      missingDocumentsCount: 1,
      missingDocumentsList: [
        "Signed Directors Report & Audited Balance Sheet"
      ],
      chaseCount: 0,
      cin,
      pan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 403 MCA Additional Late Fee: ₹100/day applies only post deadline"
    });
  } else if (isLlp) {
    // LLP Form 8: Statement of Account & Solvency (Due 30th October)
    tasks.push({
      id: `TSK-LLP8-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "ROC_MCA",
      title: "LLP Form 8 (Statement of Account & Solvency)",
      period: "FY 2025-26",
      dueDate: "2026-10-30",
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "MEDIUM",
      penaltyRisk: 5000,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: [
        "Designated Partners Statement of Solvency"
      ],
      chaseCount: 0,
      pan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "LLP Act Section 34 late fees apply only post statutory cutoff"
    });
  }

  return tasks;
}
