import { ClientEntity, ComplianceTask, WorkflowStatus } from "@/lib/types";
import { STATUTORY_DEADLINES_MASTER } from "./master";
import { StatutoryPenaltyEngine } from "./penaltyEngine";

/**
 * Generates an institutional-grade statutory compliance task schedule
 * dynamically customized to an assessee's Entity DNA.
 */
export function generateAnnualComplianceSchedule(
  client: ClientEntity,
  targetYear: number = 2026
): ComplianceTask[] {
  const tasks: ComplianceTask[] = [];
  const entityId = client.id;
  const entityName = client.name;
  const groupId = client.groupId || "GRP-DIRECT";
  const partner = client.partnerInCharge || "CA Gunjan Jain";
  const article = client.assignedArticle || "Kriti Jain (Article)";
  const pan = client.pan;
  const turnover = client.turnoverCr || 5.0;
  const cleanId = client.id.replace(/[^a-zA-Z0-9]/g, "");

  // 1. Multi-State GST Returns (GSTR-1 & GSTR-3B)
  const gstinList = (client.gstinRecords && client.gstinRecords.length > 0)
    ? client.gstinRecords
    : client.gstin
      ? [{ gstin: client.gstin, stateCode: client.gstin.slice(0, 2), stateName: "Primary State", filingFrequency: "MONTHLY" as const, status: "ACTIVE" as const }]
      : [];

  // Active Monthly GSTINs (Current Period: October 2026 / November 2026)
  gstinList.forEach((g) => {
    if (g.status === "ACTIVE") {
      const stateSuffix = g.stateCode ? `-${g.stateCode}` : "";

      // GSTR-1 Monthly (Due 11th Nov 2026 for Oct 2026)
      tasks.push({
        id: `TSK-GSTR1-${cleanId}${stateSuffix}-OCT26`,
        entityId,
        entityName: `${entityName} (${g.stateName || g.stateCode})`,
        groupId,
        category: "GST",
        title: `GSTR-1 Outward Supplies (${g.stateName || g.stateCode})`,
        period: "October 2026",
        dueDate: `${targetYear}-11-11`,
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "CRITICAL",
        penaltyRisk: turnover > 5 ? 10000 : 5000,
        accruingDailyPenalty: 50,
        missingDocumentsCount: 2,
        missingDocumentsList: ["B2B Tax Invoices", "Sales Register & E-Way Bill Summary"],
        chaseCount: 1,
        lastChaseDate: `${targetYear}-11-05`,
        pan,
        gstin: g.gstin,
        clientApprovalStatus: "PENDING",
        penaltyNote: "Sec 47 Late Fee (₹50/day) capped by turnover slab"
      });

      // GSTR-3B Monthly (Due 20th Nov 2026 for Oct 2026)
      tasks.push({
        id: `TSK-GSTR3B-${cleanId}${stateSuffix}-OCT26`,
        entityId,
        entityName: `${entityName} (${g.stateName || g.stateCode})`,
        groupId,
        category: "GST",
        title: `GSTR-3B Tax Summary Return (${g.stateName || g.stateCode})`,
        period: "October 2026",
        dueDate: `${targetYear}-11-20`,
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "CRITICAL",
        penaltyRisk: turnover > 5 ? 10000 : 5000,
        accruingDailyPenalty: 50,
        missingDocumentsCount: 2,
        missingDocumentsList: [
          "Bank Statement (Oct 2026)",
          "Purchase Register & GSTR-2B ITC Match"
        ],
        chaseCount: 1,
        lastChaseDate: `${targetYear}-11-06`,
        pan,
        gstin: g.gstin,
        taxPayableAmount: Math.round(turnover * 15000),
        section50Interest: 450,
        clientApprovalStatus: "PENDING",
        penaltyNote: "Sec 47 Late Fee (₹50/day) + Sec 50(1) 18% p.a. Cash Interest"
      });
    }
  });

  // 2. Direct Tax: Advance Tax Q3 (Due 15th Dec 2026)
  tasks.push({
    id: `TSK-ADVTAX-Q3-${cleanId}`,
    entityId,
    entityName,
    groupId,
    category: "INCOME_TAX",
    title: "Advance Tax Q3 Installment (75% Cumulative)",
    period: `FY ${targetYear}-${(targetYear + 1).toString().slice(-2)}`,
    dueDate: `${targetYear}-12-15`,
    status: "IN_PREPARATION",
    assignedTo: article,
    reviewedBy: partner,
    priority: "HIGH",
    penaltyRisk: Math.round(turnover * 20000),
    accruingDailyPenalty: 0,
    missingDocumentsCount: 1,
    missingDocumentsList: ["Estimated 9-Month P&L / Trial Balance", "Prior Advance Tax Challan Q1 & Q2"],
    chaseCount: 0,
    pan,
    taxPayableAmount: Math.round(turnover * 45000),
    clientApprovalStatus: "PENDING",
    penaltyNote: "Sec 234C 1% simple interest per month on deferment of advance tax"
  });

  // 3. TDS: Monthly Challan 281 & Quarterly Return Form 26Q
  if (client.tan || client.type === "PVT_LTD" || client.type === "PUBLIC_LTD" || client.type === "LLP" || turnover >= 1) {
    tasks.push({
      id: `TSK-TDS-CHALLAN-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "TDS",
      title: "TDS Monthly Deposit Challan 281",
      period: "October 2026",
      dueDate: `${targetYear}-11-07`,
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "CRITICAL",
      penaltyRisk: 5000,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Contractor & Salary TDS Deduction Register"],
      chaseCount: 1,
      pan,
      tan: client.tan,
      taxPayableAmount: Math.round(turnover * 8000),
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 201(1A) 1.5% interest per month from date of deduction to deposit"
    });

    tasks.push({
      id: `TSK-TDS-26Q-Q2-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "TDS",
      title: "Quarterly TDS Return Form 26Q (Q2)",
      period: "Q2 (Jul–Sep 2026)",
      dueDate: `${targetYear}-10-31`,
      status: "MANAGER_REVIEW",
      assignedTo: article,
      reviewedBy: partner,
      priority: "HIGH",
      penaltyRisk: 10000,
      accruingDailyPenalty: 200,
      missingDocumentsCount: 0,
      missingDocumentsList: [],
      chaseCount: 0,
      pan,
      tan: client.tan,
      clientApprovalStatus: "APPROVED",
      penaltyNote: "Sec 234E ₹200/day late fee capped at total TDS amount"
    });
  }

  // 4. Tax Audit u/s 44AB (Form 3CD) - if applicable
  const isTaxAuditMandatory = (turnover > 1.0 && (client.digitalTxnPct || 96) < 95) || turnover > 10.0 || client.type === "PVT_LTD" || client.type === "PUBLIC_LTD";
  if (isTaxAuditMandatory) {
    tasks.push({
      id: `TSK-TAXAUDIT-3CD-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "TAX_AUDIT",
      title: "Tax Audit Form 3CD Final Certification u/s 44AB",
      period: `FY ${targetYear - 1}-${targetYear.toString().slice(-2)}`,
      dueDate: `${targetYear}-09-30`,
      status: "FILED_AND_COMPLETED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "CRITICAL",
      penaltyRisk: Math.min(Math.round(turnover * 10000000 * 0.005), 150000),
      accruingDailyPenalty: 0,
      missingDocumentsCount: 0,
      missingDocumentsList: [],
      chaseCount: 0,
      officialUdin: "26022998C" + Math.floor(10000000 + Math.random() * 90000000),
      filingDate: `${targetYear}-09-28`,
      pan,
      clientApprovalStatus: "APPROVED",
      penaltyNote: "Sec 271B 0.5% turnover or ₹1,50,000 penalty for default"
    });
  }

  // 5. Annual Income Tax Return (ITR-6 / ITR-5 / ITR-3)
  const isCorporate = client.type === "PVT_LTD" || client.type === "PUBLIC_LTD";
  tasks.push({
    id: `TSK-ITR-ANNUAL-${cleanId}`,
    entityId,
    entityName,
    groupId,
    category: "INCOME_TAX",
    title: isCorporate ? "ITR-6 Corporate Income Tax Return" : client.type === "LLP" ? "ITR-5 LLP Tax Return" : "ITR-3 Business Tax Return",
    period: `AY ${targetYear}-${(targetYear + 1).toString().slice(-2)}`,
    dueDate: isTaxAuditMandatory ? `${targetYear}-10-31` : `${targetYear}-07-31`,
    status: "FILED_AND_COMPLETED",
    assignedTo: article,
    reviewedBy: partner,
    priority: "HIGH",
    penaltyRisk: 5000,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 0,
    missingDocumentsList: [],
    chaseCount: 0,
    arnNumber: "ACK" + Math.floor(100000000000 + Math.random() * 900000000000),
    officialUdin: "26022998C" + Math.floor(10000000 + Math.random() * 90000000),
    filingDate: `${targetYear}-10-28`,
    pan,
    clientApprovalStatus: "APPROVED",
    penaltyNote: "Sec 234F ₹5,000 late fee + Sec 234A 1%/month interest"
  });

  // 6. Corporate Secretarial (MCA/ROC): AOC-4, MGT-7, DIR-3 KYC
  if (isCorporate) {
    tasks.push({
      id: `TSK-ROC-AOC4-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "ROC_MCA",
      title: "AOC-4 Financial Statements & Board Report",
      period: `FY ${targetYear - 1}-${targetYear.toString().slice(-2)}`,
      dueDate: `${targetYear}-10-30`,
      status: "PARTNER_SIGN_OFF",
      assignedTo: article,
      reviewedBy: partner,
      priority: "CRITICAL",
      penaltyRisk: 15000,
      accruingDailyPenalty: 100,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Signed Board Report & AGM Minutes"],
      chaseCount: 1,
      lastChaseDate: `${targetYear}-11-04`,
      pan,
      cin: client.cin,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Companies Act Sec 403: ₹100/day continuing default without ceiling"
    });

    tasks.push({
      id: `TSK-ROC-MGT7-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "ROC_MCA",
      title: "MGT-7 Annual Secretarial Return",
      period: `FY ${targetYear - 1}-${targetYear.toString().slice(-2)}`,
      dueDate: `${targetYear}-11-29`,
      status: "IN_PREPARATION",
      assignedTo: article,
      reviewedBy: partner,
      priority: "HIGH",
      penaltyRisk: 10000,
      accruingDailyPenalty: 100,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Shareholding Pattern as on March 31"],
      chaseCount: 0,
      pan,
      cin: client.cin,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Companies Act Sec 92: ₹100/day continuing default"
    });

    tasks.push({
      id: `TSK-ROC-DIR3KYC-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "ROC_MCA",
      title: "DIR-3 KYC Annual Director Verification",
      period: `${targetYear}`,
      dueDate: `${targetYear}-09-30`,
      status: "FILED_AND_COMPLETED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "HIGH",
      penaltyRisk: 5000,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 0,
      missingDocumentsList: [],
      chaseCount: 0,
      filingDate: `${targetYear}-09-25`,
      pan,
      clientApprovalStatus: "APPROVED",
      penaltyNote: "DIN deactivation + ₹5,000 late fee per director"
    });
  }

  // 7. LLP Secretarial: Form 11 & Form 8
  if (client.type === "LLP") {
    tasks.push({
      id: `TSK-LLP-FORM11-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "ROC_MCA",
      title: "LLP Form 11 Annual Return",
      period: `FY ${targetYear - 1}-${targetYear.toString().slice(-2)}`,
      dueDate: `${targetYear}-05-30`,
      status: "FILED_AND_COMPLETED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "MEDIUM",
      penaltyRisk: 5000,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 0,
      missingDocumentsList: [],
      chaseCount: 0,
      filingDate: `${targetYear}-05-24`,
      pan,
      clientApprovalStatus: "APPROVED",
      penaltyNote: "LLP Act Sec 69: ₹100/day continuing default"
    });

    tasks.push({
      id: `TSK-LLP-FORM8-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "ROC_MCA",
      title: "LLP Form 8 Statement of Account & Solvency",
      period: `FY ${targetYear - 1}-${targetYear.toString().slice(-2)}`,
      dueDate: `${targetYear}-10-30`,
      status: "PARTNER_SIGN_OFF",
      assignedTo: article,
      reviewedBy: partner,
      priority: "CRITICAL",
      penaltyRisk: 6000,
      accruingDailyPenalty: 100,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Signed Solvency Declaration by Designated Partners"],
      chaseCount: 1,
      lastChaseDate: `${targetYear}-11-04`,
      pan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "LLP Act Sec 69: ₹100/day continuing default"
    });
  }

  return tasks;
}
