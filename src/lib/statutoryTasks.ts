import { ClientEntity, ComplianceTask } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatIsoDate(year: number, monthIndex0: number, day: number): string {
  return `${year}-${pad2(monthIndex0 + 1)}-${pad2(day)}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Resolves the active statutory return period dynamically from referenceDate.
 * Before the 21st of a month, the active GST/TDS return period is the prior month;
 * from the 21st onward, obligations roll forward to the current month's cycle.
 */
function resolveActiveMonthlyCycle(referenceDate: Date) {
  const day = referenceDate.getDate();
  const baseMonth = referenceDate.getMonth();
  const baseYear = referenceDate.getFullYear();

  // Period being filed: if <= 20th, prior month is actively due this month; if > 20th, roll to current month (due next month)
  const periodDate = day <= 20 ? new Date(baseYear, baseMonth - 1, 1) : new Date(baseYear, baseMonth, 1);
  const dueMonthDate = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 1);

  const periodMonthIdx = periodDate.getMonth();
  const periodYear = periodDate.getFullYear();
  const dueMonthIdx = dueMonthDate.getMonth();
  const dueYear = dueMonthDate.getFullYear();

  const periodLabel = `${MONTH_NAMES[periodMonthIdx]} ${periodYear}`;
  const periodKey = `${periodYear}${pad2(periodMonthIdx + 1)}`;

  // Indian Financial Year runs Apr (3) -> Mar (2)
  const fyStartYear = periodMonthIdx >= 3 ? periodYear : periodYear - 1;
  const fyLabel = `FY ${fyStartYear}-${String((fyStartYear + 1) % 100).padStart(2, "0")}`;
  const ayLabel = `AY ${fyStartYear + 1}-${String((fyStartYear + 2) % 100).padStart(2, "0")}`;

  // Next Advance Tax installment strictly on/after referenceDate
  const advCandidates = [
    { label: `Advance Tax Q1 (15% Cumulative)`, due: formatIsoDate(fyStartYear, 5, 15), code: "ADV1" },
    { label: `Advance Tax Q2 (45% Cumulative)`, due: formatIsoDate(fyStartYear, 8, 15), code: "ADV2" },
    { label: `Advance Tax Q3 (75% Cumulative)`, due: formatIsoDate(fyStartYear, 11, 15), code: "ADV3" },
    { label: `Advance Tax Q4 (100% Final)`, due: formatIsoDate(fyStartYear + 1, 2, 15), code: "ADV4" },
  ];
  const refIso = formatIsoDate(baseYear, baseMonth, day);
  const nextAdv = advCandidates.find((c) => c.due >= refIso) || {
    label: `Advance Tax Q1 (15% Cumulative)`,
    due: formatIsoDate(fyStartYear + 1, 5, 15),
    code: "ADV1NEXT",
  };

  // Quarterly TDS 24Q/26Q next cutoff
  const tdsQuarterlyCandidates = [
    { period: `${fyLabel} Q1 (Apr-Jun)`, due: formatIsoDate(fyStartYear, 6, 31), code: "TDSQ1" },
    { period: `${fyLabel} Q2 (Jul-Sep)`, due: formatIsoDate(fyStartYear, 9, 31), code: "TDSQ2" },
    { period: `${fyLabel} Q3 (Oct-Dec)`, due: formatIsoDate(fyStartYear + 1, 0, 31), code: "TDSQ3" },
    { period: `${fyLabel} Q4 (Jan-Mar)`, due: formatIsoDate(fyStartYear + 1, 4, 31), code: "TDSQ4" },
  ];
  const nextTdsQuarter = tdsQuarterlyCandidates.find((c) => c.due >= refIso) || tdsQuarterlyCandidates[3];

  // Prior Assessment/Audit FY ends March 31 of fyStartYear (audited around Sep-Nov of fyStartYear)
  const auditFyLabel = `FY ${fyStartYear - 1}-${String(fyStartYear % 100).padStart(2, "0")}`;
  const auditAyLabel = `AY ${fyStartYear}-${String((fyStartYear + 1) % 100).padStart(2, "0")}`;

  return {
    periodLabel,
    periodKey,
    fyLabel,
    ayLabel,
    fyStartYear,
    auditFyLabel,
    auditAyLabel,
    gstr1Due: formatIsoDate(dueYear, dueMonthIdx, 11),
    gstr3bDue: formatIsoDate(dueYear, dueMonthIdx, 20),
    tdsChallanDue: formatIsoDate(dueYear, dueMonthIdx, 7),
    nextAdv,
    nextTdsQuarter,
    taxAuditDue: formatIsoDate(fyStartYear, 8, 30),
    rocAoc4Due: formatIsoDate(fyStartYear, 9, 30),
    rocMgt7Due: formatIsoDate(fyStartYear, 10, 29),
    llpForm8Due: formatIsoDate(fyStartYear, 9, 30),
    itrNonAuditDue: formatIsoDate(fyStartYear, 6, 31),
  };
}

/**
 * Generates official statutory compliance obligations for an Indian business entity
 * strictly based on its legal constitution, tax registrations (GSTIN, TAN, PAN),
 * audited turnover thresholds, and live reference date under Indian Tax and Corporate Laws.
 */
export function generateStatutoryTasksForClient(
  client: ClientEntity,
  referenceDate: Date = new Date()
): ComplianceTask[] {
  const tasks: ComplianceTask[] = [];
  const entityId = client.id;
  const entityName = client.name;
  const groupId = client.groupId || "GRP-DIRECT";
  const pan = client.pan || "";
  const gstin = client.gstin || undefined;
  const tan = client.tan || undefined;
  const cin = client.cin || undefined;
  const partner = client.partnerInCharge || DEFAULT_FIRM_BRANDING.managingPartner;
  const article = client.assignedArticle || "Unassigned";
  const cleanId = client.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  const cycle = resolveActiveMonthlyCycle(referenceDate);

  const isCorporate =
    client.type === "PVT_LTD" ||
    client.type === "PUBLIC_LTD";

  const isLlp = client.type === "LLP";
  const isTrust = client.type === "TRUST_NGO";
  const isIndividual = client.type === "INDIVIDUAL_HNI";
  const gstFreq = client.gstFilingFrequency || "MONTHLY";

  // 1. GST Compliance Obligations (ONLY if entity holds an active GSTIN registration & not marked UNREGISTERED)
  if (gstin && gstin.trim().length === 15 && gstFreq !== "UNREGISTERED") {
    if (gstFreq === "COMPOSITION") {
      tasks.push({
        id: `TSK-CMP08-${cycle.periodKey}-${cleanId}`,
        entityId,
        entityName,
        groupId,
        category: "GST",
        title: "CMP-08 Quarterly Composition Statement & Tax Payment",
        period: `${cycle.fyLabel} Quarter`,
        dueDate: formatIsoDate(cycle.fyStartYear + 1, 0, 18),
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "HIGH",
        penaltyRisk: 0,
        accruingDailyPenalty: 0,
        missingDocumentsCount: 1,
        missingDocumentsList: ["Quarterly Turnover Summary & Exempt Sales Split"],
        chaseCount: 0,
        pan,
        gstin,
        clientApprovalStatus: "PENDING",
        penaltyNote: "Sec 47 Late Fee for CMP-08 post 18th of quarter-end month"
      });
    } else if (gstFreq === "QRMP") {
      tasks.push({
        id: `TSK-QRMP-IFF-${cycle.periodKey}-${cleanId}`,
        entityId,
        entityName,
        groupId,
        category: "GST",
        title: "QRMP IFF / PMT-06 Monthly Tax Challan (Month 1/2)",
        period: cycle.periodLabel,
        dueDate: formatIsoDate(Number(cycle.periodKey.slice(0, 4)), Number(cycle.periodKey.slice(4, 6)) - 1, 25),
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "HIGH",
        penaltyRisk: 0,
        accruingDailyPenalty: 0,
        missingDocumentsCount: 1,
        missingDocumentsList: ["B2B Sales Invoices for IFF & 35% Fixed Sum Challan Check"],
        chaseCount: 0,
        pan,
        gstin,
        clientApprovalStatus: "PENDING",
        penaltyNote: "IFF due 13th; PMT-06 self-assessment/fixed-sum challan due 25th"
      });
      tasks.push({
        id: `TSK-QRMP-3B-${cycle.periodKey}-${cleanId}`,
        entityId,
        entityName,
        groupId,
        category: "GST",
        title: "QRMP Quarterly GSTR-1 & GSTR-3B Return",
        period: `${cycle.fyLabel} Quarter`,
        dueDate: formatIsoDate(cycle.fyStartYear + 1, 0, 22),
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "CRITICAL",
        penaltyRisk: 0,
        accruingDailyPenalty: 0,
        missingDocumentsCount: 2,
        missingDocumentsList: ["Quarterly Sales Register", "Purchase Register & GSTR-2B Match"],
        chaseCount: 0,
        pan,
        gstin,
        clientApprovalStatus: "PENDING",
        penaltyNote: "QRMP due 22nd/24th post-quarter based on state group"
      });
    } else {
      tasks.push({
        id: `TSK-GSTR1-${cycle.periodKey}-${cleanId}`,
        entityId,
        entityName,
        groupId,
        category: "GST",
        title: "GSTR-1 Monthly Outward Supplies",
        period: cycle.periodLabel,
        dueDate: cycle.gstr1Due,
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "CRITICAL",
        penaltyRisk: 0,
        accruingDailyPenalty: 0,
        missingDocumentsCount: 1,
        missingDocumentsList: ["B2B Sales Invoices & E-way Bill Summary"],
        chaseCount: 0,
        pan,
        gstin,
        clientApprovalStatus: "PENDING",
        penaltyNote: "Sec 47 Late Fee (₹50/day; ₹20/day for Nil) applicable only post due date",
      });

      tasks.push({
        id: `TSK-GSTR3B-${cycle.periodKey}-${cleanId}`,
        entityId,
        entityName,
        groupId,
        category: "GST",
        title: "GSTR-3B Monthly Return Filing",
        period: cycle.periodLabel,
        dueDate: cycle.gstr3bDue,
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "CRITICAL",
        penaltyRisk: 0,
        accruingDailyPenalty: 0,
        missingDocumentsCount: 2,
        missingDocumentsList: [
          `Bank Statement (${cycle.periodLabel})`,
          "Purchase Register & GSTR-2B ITC Match",
        ],
        chaseCount: 0,
        pan,
        gstin,
        taxPayableAmount: 0,
        section50Interest: 0,
        clientApprovalStatus: "PENDING",
        penaltyNote: "Sec 47 Late Fee (₹50/day) + Sec 50(1) 18% p.a. Cash Interest only if delayed",
      });
    }

    // Auto-create catch-up tasks if live GSTN lookup revealed unfiled historical returns
    const unfiledHistory = (client.gstHistory || []).filter((h) => !h.arn || h.delayDays > 0);
    unfiledHistory.slice(0, 3).forEach((h, idx) => {
      tasks.push({
        id: `TSK-CATCHUP-${h.returnType}-${cleanId}-${idx}`,
        entityId,
        entityName,
        groupId,
        category: "GST",
        title: `Overdue Catch-Up: ${h.returnType.replace("_", "-")} (${h.period || "Prior Period"})`,
        period: h.period || "Prior Period",
        dueDate: new Date().toISOString().split("T")[0],
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "CRITICAL",
        penaltyRisk: 5000,
        accruingDailyPenalty: 50,
        missingDocumentsCount: 1,
        missingDocumentsList: [`Historical ${h.returnType.replace("_", "-")} data for ${h.period}`],
        chaseCount: 0,
        pan,
        gstin,
        clientApprovalStatus: "PENDING",
        penaltyNote: "Detected unfiled return during GSTN onboarding lookup",
      });
    });
  }

  // 2. TDS Deposit Challan 281 & Quarterly Statement 26Q (if entity holds TAN or is corporate)
  if (tan || isCorporate) {
    tasks.push({
      id: `TSK-TDS-${cycle.periodKey}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "TDS",
      title: "TDS Monthly Deposit Challan 281",
      period: cycle.periodLabel,
      dueDate: cycle.tdsChallanDue,
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "HIGH",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: [`${cycle.periodLabel} Salary & Contractor TDS Deduction Register`],
      chaseCount: 0,
      pan,
      tan,
      taxPayableAmount: 0,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 201(1A) 1.5% interest per month from date of deduction to deposit",
    });

    tasks.push({
      id: `TSK-${cycle.nextTdsQuarter.code}-${cycle.fyStartYear}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "TDS",
      title: "TDS Quarterly Return (Form 26Q / 24Q)",
      period: cycle.nextTdsQuarter.period,
      dueDate: cycle.nextTdsQuarter.due,
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "HIGH",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: ["TRACES Consolidated CSI File & Deductee PAN Ledger"],
      chaseCount: 0,
      pan,
      tan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 234E ₹200/day mandatory late fee until return filing",
    });
  }

  // 3. Advance Tax Next Installment (Corporates & entities u/s 208)
  if (isCorporate || (client.turnoverCr && client.turnoverCr >= 1)) {
    tasks.push({
      id: `TSK-${cycle.nextAdv.code}-${cycle.fyStartYear}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "INCOME_TAX",
      title: cycle.nextAdv.label,
      period: cycle.fyLabel,
      dueDate: cycle.nextAdv.due,
      status: "IN_PREPARATION",
      assignedTo: article,
      reviewedBy: partner,
      priority: "HIGH",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Provisional Profit & Loss / Trial Balance"],
      chaseCount: 0,
      pan,
      taxPayableAmount: 0,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 234C 1% simple interest per month on deferment of advance tax",
    });
  } else {
    tasks.push({
      id: `TSK-ITR-${cycle.fyStartYear}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "INCOME_TAX",
      title: "Income Tax Return Computation & Filing",
      period: `${cycle.auditFyLabel} (${cycle.auditAyLabel})`,
      dueDate: cycle.itrNonAuditDue,
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "MEDIUM",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 2,
      missingDocumentsList: ["AIS / Form 26AS Export", "Bank Interest & Capital Gains Statement"],
      chaseCount: 0,
      pan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 234F ₹1,000 / ₹5,000 fee applies only after statutory due date",
    });
  }

  // 4. Form 3CD Tax Audit Report (Sec 44AB: turnover >= 10 Cr digital or audit threshold)
  if (client.turnoverCr && client.turnoverCr >= 10) {
    tasks.push({
      id: `TSK-3CD-${cycle.fyStartYear}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "TAX_AUDIT",
      title: "Form 3CD Tax Audit Final Certification",
      period: `${cycle.auditFyLabel} (${cycle.auditAyLabel})`,
      dueDate: cycle.taxAuditDue,
      status: "IN_PREPARATION",
      assignedTo: article,
      reviewedBy: partner,
      priority: "CRITICAL",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 2,
      missingDocumentsList: [
        "Depreciation Schedule as per IT Act & Companies Act",
        "Form 26AS & AIS Reconciled Ledger",
      ],
      chaseCount: 0,
      pan,
      cin,
      clientApprovalStatus: "APPROVED",
      penaltyNote: "Sec 271B: 0.5% of turnover capped at ₹1,50,000 for audit delay",
    });
  }

  // 5. ROC / MCA Statutory Filings
  if (isCorporate) {
    tasks.push({
      id: `TSK-AOC4-${cycle.fyStartYear}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "ROC_MCA",
      title: "ROC Form AOC-4 (Financial Statements Filing)",
      period: cycle.auditFyLabel,
      dueDate: cycle.rocAoc4Due,
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "MEDIUM",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Signed Directors Report & Audited Balance Sheet"],
      chaseCount: 0,
      cin,
      pan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 403 MCA Additional Late Fee: ₹100/day applies only post deadline",
    });

    tasks.push({
      id: `TSK-MGT7-${cycle.fyStartYear}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "ROC_MCA",
      title: "ROC Form MGT-7 (Annual Return)",
      period: cycle.auditFyLabel,
      dueDate: cycle.rocMgt7Due,
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "MEDIUM",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Shareholding Pattern & Board Meeting Register"],
      chaseCount: 0,
      cin,
      pan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 403 MCA Additional Late Fee: ₹100/day applies only post deadline",
    });
  } else if (isLlp) {
    tasks.push({
      id: `TSK-LLP8-${cycle.fyStartYear}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "ROC_MCA",
      title: "LLP Form 8 (Statement of Account & Solvency)",
      period: cycle.auditFyLabel,
      dueDate: cycle.llpForm8Due,
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "MEDIUM",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Designated Partners Statement of Solvency"],
      chaseCount: 0,
      cin,
      pan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "LLP Act Section 34 late fees apply only post statutory cutoff",
    });
  }

  // 6. Charitable Trust / Sec 8 NGO Statutory Filings
  if (isTrust) {
    tasks.push({
      id: `TSK-10BD-${cycle.fyStartYear}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "INCOME_TAX",
      title: "Form 10BD (80G Statement of Donations)",
      period: cycle.auditFyLabel,
      dueDate: formatIsoDate(cycle.fyStartYear, 4, 31),
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "HIGH",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Donor Register CSV with PAN & Address"],
      chaseCount: 0,
      pan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 234G ₹200/day late fee + Sec 271K penalty post May 31 cutoff",
    });
    tasks.push({
      id: `TSK-ITR7-${cycle.fyStartYear}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "INCOME_TAX",
      title: "Form 10B/10BB Audit & ITR-7 Filing",
      period: `${cycle.auditFyLabel} (${cycle.auditAyLabel})`,
      dueDate: formatIsoDate(cycle.fyStartYear, 9, 31),
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "CRITICAL",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 2,
      missingDocumentsList: ["12AB/80G Registration Orders (10AC/10AD)", "Project Utilization Summary"],
      chaseCount: 0,
      pan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 11/12 exemption risk if 10B/10BB delayed",
    });
  }

  // 7. Individual / HNI Direct Tax & AIS Reconciliation
  if (isIndividual) {
    tasks.push({
      id: `TSK-ITR-AIS-${cycle.fyStartYear}-${cleanId}`,
      entityId,
      entityName,
      groupId,
      category: "INCOME_TAX",
      title: "AIS/TIS Reconciliation & ITR-2/3 Computation",
      period: `${cycle.auditFyLabel} (${cycle.auditAyLabel})`,
      dueDate: cycle.itrNonAuditDue,
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: "HIGH",
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 2,
      missingDocumentsList: ["AIS/TIS JSON & Form 16", "Broker Capital Gains P&L / Bank Statements"],
      chaseCount: 0,
      pan,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 234F late fee up to ₹5,000 post July 31",
    });
  }

  return tasks;
}
