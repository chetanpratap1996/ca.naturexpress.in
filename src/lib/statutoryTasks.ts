import { ClientEntity, ComplianceTask } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import {
  buildGstTaskTitle,
  computeGstTaskPriority,
  computeSec47LateFee,
  getExpectedReturnKindsForPeriod,
  getGstr10DueDate,
  getStatutoryGstDueDate,
  resolveActiveGstinsForClient,
  resolveCancelledGstinsForClient,
} from "@/lib/gst/gstComplianceEngine";

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
  const scopeSet =
    Array.isArray(client.serviceScope) && client.serviceScope.length > 0
      ? new Set(client.serviceScope)
      : null;
  const hasScope = (s: "GST" | "INCOME_TAX" | "TAX_AUDIT" | "TDS" | "ROC_MCA" | "VCFO") =>
    !scopeSet || scopeSet.has(s);
  const mode = client.onboardingMode || "EXISTING_CLIENT";
  const isNewIncorp = mode === "NEW_BUSINESS";
  const lastFiled = client.lastFiledPeriods || {};
  const currentYear = referenceDate.getFullYear();
  const isFreshlyIncorporated = isNewIncorp && (client.incorporationYear || currentYear) >= currentYear - 1;

  // 1. GST Compliance Obligations — iterate ALL active GSTINs (respecting per-GSTIN frequency & type)
  const gstAlreadyFiledForCycle =
    Boolean(lastFiled.gst) && lastFiled.gst!.trim().toLowerCase() === cycle.periodLabel.toLowerCase();
  const activeGstins = hasScope("GST") && gstFreq !== "UNREGISTERED" ? resolveActiveGstinsForClient(client) : [];

  for (const g of activeGstins) {
    const gClean = g.gstin.replace(/[^a-zA-Z0-9]/g, "").slice(-6);
    if (!gstAlreadyFiledForCycle) {
      if (g.registrationType === "COMPOSITION") {
        const cmpDue = getStatutoryGstDueDate(cycle.periodLabel, "CMP08", g);
        tasks.push({
          id: `TSK-CMP08-${cycle.periodKey}-${cleanId}-${gClean}`,
          entityId,
          entityName,
          groupId,
          category: "GST",
          title: buildGstTaskTitle("CMP08", g),
          period: `${cycle.fyLabel} Quarter`,
          dueDate: cmpDue,
          status: "DOCUMENTS_AWAITED",
          assignedTo: article,
          reviewedBy: partner,
          priority: computeGstTaskPriority(cmpDue, referenceDate),
          penaltyRisk: 0,
          accruingDailyPenalty: 0,
          missingDocumentsCount: 1,
          missingDocumentsList: ["Quarterly Turnover Summary & Exempt Sales Split"],
          chaseCount: 0,
          pan,
          gstin: g.gstin,
          clientApprovalStatus: "PENDING",
          penaltyNote: "Sec 47 Late Fee for CMP-08 post 18th of quarter-end month",
        });
      } else if (g.filingFrequency === "QRMP") {
        const expectedQrmpKinds = getExpectedReturnKindsForPeriod(g, cycle.periodLabel);
        for (const qKind of expectedQrmpKinds) {
          const qDue = getStatutoryGstDueDate(cycle.periodLabel, qKind, g);
          tasks.push({
            id: `TSK-QRMP-${qKind}-${cycle.periodKey}-${cleanId}-${gClean}`,
            entityId,
            entityName,
            groupId,
            category: "GST",
            title: buildGstTaskTitle(qKind, g),
            period: cycle.periodLabel,
            dueDate: qDue,
            status: "DOCUMENTS_AWAITED",
            assignedTo: article,
            reviewedBy: partner,
            priority: computeGstTaskPriority(qDue, referenceDate),
            penaltyRisk: 0,
            accruingDailyPenalty: 0,
            missingDocumentsCount: qKind === "PMT06" ? 1 : 2,
            missingDocumentsList:
              qKind === "PMT06"
                ? ["35% Fixed-Sum / Self-Assessment Challan Check (Optional IFF by 13th)"]
                : qKind === "GSTR1"
                ? ["Quarterly B2B & B2C Outward Sales Register"]
                : ["Quarterly Purchase Register & GSTR-2B Match"],
            chaseCount: 0,
            pan,
            gstin: g.gstin,
            clientApprovalStatus: "PENDING",
            penaltyNote:
              qKind === "PMT06"
                ? "QRMP M1/M2: IFF optional due 13th; PMT-06 challan due 25th"
                : `QRMP M3 due ${g.qrmpStateGroup === "24TH" ? "24th" : "22nd"} post-quarter`,
          });
        }
      } else {
        const g1Due = getStatutoryGstDueDate(cycle.periodLabel, "GSTR1", g);
        const g3bDue = getStatutoryGstDueDate(cycle.periodLabel, "GSTR3B", g);
        tasks.push({
          id: `TSK-GSTR1-${cycle.periodKey}-${cleanId}-${gClean}`,
          entityId,
          entityName,
          groupId,
          category: "GST",
          title: buildGstTaskTitle("GSTR1", g),
          period: cycle.periodLabel,
          dueDate: g1Due,
          status: "DOCUMENTS_AWAITED",
          assignedTo: article,
          reviewedBy: partner,
          priority: computeGstTaskPriority(g1Due, referenceDate),
          penaltyRisk: 0,
          accruingDailyPenalty: 0,
          missingDocumentsCount: 1,
          missingDocumentsList: ["B2B Sales Invoices & E-way Bill Summary"],
          chaseCount: 0,
          pan,
          gstin: g.gstin,
          clientApprovalStatus: "PENDING",
          penaltyNote: "Sec 47 Late Fee (₹50/day; ₹20/day for Nil) applicable only post due date",
        });

        tasks.push({
          id: `TSK-GSTR3B-${cycle.periodKey}-${cleanId}-${gClean}`,
          entityId,
          entityName,
          groupId,
          category: "GST",
          title: buildGstTaskTitle("GSTR3B", g),
          period: cycle.periodLabel,
          dueDate: g3bDue,
          status: "DOCUMENTS_AWAITED",
          assignedTo: article,
          reviewedBy: partner,
          priority: computeGstTaskPriority(g3bDue, referenceDate),
          penaltyRisk: 0,
          accruingDailyPenalty: 0,
          missingDocumentsCount: 2,
          missingDocumentsList: [
            `Bank Statement (${cycle.periodLabel})`,
            "Purchase Register & GSTR-2B ITC Match",
          ],
          chaseCount: 0,
          pan,
          gstin: g.gstin,
          taxPayableAmount: 0,
          section50Interest: 0,
          clientApprovalStatus: "PENDING",
          penaltyNote: "Sec 47 Late Fee (₹50/day) + Sec 50(1) 18% p.a. Cash Interest only if delayed",
        });
      }
    }

    // Auto-create catch-up tasks for non-fresh entities where GSTN lookup revealed unfiled historical returns
    if (!isNewIncorp) {
      const unfiledHistory = (client.gstHistory || []).filter((h: any) => {
        if (h.arn || (h.delayDays !== undefined && h.delayDays <= 0)) return false;
        const hGstin = (h.gstin || "").trim().toUpperCase();
        if (hGstin) return hGstin === g.gstin.toUpperCase();
        return !gstin || g.gstin.toUpperCase() === gstin.trim().toUpperCase();
      });
      unfiledHistory.slice(0, 6).forEach((h: any, idx: number) => {
        const kind = h.returnType?.includes("1") ? "GSTR1" : "GSTR3B";
        const period = h.period || "Prior Period";
        if (period.toLowerCase() === cycle.periodLabel.toLowerCase()) return;
        const histDue = getStatutoryGstDueDate(period, kind, g);
        const fee = computeSec47LateFee(histDue, referenceDate);
        tasks.push({
          id: `TSK-CATCHUP-${kind}-${cleanId}-${gClean}-${idx}`,
          entityId,
          entityName,
          groupId,
          category: "GST",
          title: buildGstTaskTitle(kind, g, true),
          period,
          dueDate: histDue,
          status: "DOCUMENTS_AWAITED",
          assignedTo: article,
          reviewedBy: partner,
          priority: "CRITICAL",
          penaltyRisk: fee.lateFee || 500,
          accruingDailyPenalty: fee.dailyRate || 50,
          missingDocumentsCount: 1,
          missingDocumentsList: [`Historical ${kind === "GSTR1" ? "GSTR-1" : "GSTR-3B"} data for ${period}`],
          chaseCount: 0,
          pan,
          gstin: g.gstin,
          clientApprovalStatus: "PENDING",
          penaltyNote: `Detected unfiled return during GSTN onboarding lookup (${fee.daysLate} days overdue)`,
        });
      });
    }
  }

  // 1B. Cancelled GSTINs -> GSTR-10 Final Return (Sec 45 CGST Act, due within 3 months)
  const cancelledGstins = hasScope("GST") ? resolveCancelledGstinsForClient(client) : [];
  for (const cg of cancelledGstins) {
    const cgClean = cg.gstin.replace(/[^a-zA-Z0-9]/g, "").slice(-6);
    const g10Due = getGstr10DueDate(cg.cancellationDate, referenceDate);
    tasks.push({
      id: `TSK-GSTR10-${cleanId}-${cgClean}`,
      entityId,
      entityName,
      groupId,
      category: "GST",
      title: buildGstTaskTitle("GSTR10", cg),
      period: cg.cancellationDate ? `Cancelled ${cg.cancellationDate}` : "Final Return",
      dueDate: g10Due,
      status: "DOCUMENTS_AWAITED",
      assignedTo: article,
      reviewedBy: partner,
      priority: computeGstTaskPriority(g10Due, referenceDate),
      penaltyRisk: 0,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 1,
      missingDocumentsList: ["Closing Stock & Capital Goods ITC Reversal Schedule"],
      chaseCount: 0,
      pan,
      gstin: cg.gstin,
      clientApprovalStatus: "PENDING",
      penaltyNote: "Sec 45 GSTR-10 Final Return due within 3 months of cancellation",
    });
  }

  // 2. TDS Deposit Challan 281 & Quarterly Statement 26Q (if TDS in scope AND entity holds TAN or is corporate)
  if (hasScope("TDS") && (tan || isCorporate)) {
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

    const tdsQuarterAlreadyFiled =
      Boolean(lastFiled.tdsQuarter) &&
      lastFiled.tdsQuarter!.trim().toLowerCase() === cycle.nextTdsQuarter.period.toLowerCase();

    if (!tdsQuarterAlreadyFiled) {
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
  }

  // 3. Advance Tax / ITR (only if INCOME_TAX in scope)
  const itrAlreadyFiled =
    Boolean(lastFiled.itrAy) && lastFiled.itrAy!.trim().toLowerCase() === cycle.auditAyLabel.toLowerCase();

  if (hasScope("INCOME_TAX")) {
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
    } else if (!itrAlreadyFiled && !isFreshlyIncorporated) {
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
  }

  // 4. Form 3CD Tax Audit Report (Sec 44AB: turnover >= 10 Cr if >=95% digital else >= 1 Cr; skipped for freshly incorporated entities)
  const digitalPct = client.digitalTxnPct ?? 95;
  const auditThreshold = digitalPct >= 95 ? 10 : 1;
  const taxAuditRequiredByTurnover = (client.turnoverCr || 0) >= auditThreshold;

  if (!isFreshlyIncorporated && !itrAlreadyFiled && (scopeSet?.has("TAX_AUDIT") || (hasScope("TAX_AUDIT") && taxAuditRequiredByTurnover))) {
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

  // 5. ROC / MCA Statutory Filings (only if ROC_MCA in scope)
  const rocAlreadyFiled =
    Boolean(lastFiled.rocFy) && lastFiled.rocFy!.trim().toLowerCase() === cycle.auditFyLabel.toLowerCase();

  if (hasScope("ROC_MCA")) {
    if (isCorporate && isFreshlyIncorporated) {
      const inc20aDue = new Date(referenceDate.getTime() + 180 * 86400000).toISOString().split("T")[0];
      const adt1Due = new Date(referenceDate.getTime() + 30 * 86400000).toISOString().split("T")[0];
      tasks.push({
        id: `TSK-INC20A-${cycle.fyStartYear}-${cleanId}`,
        entityId,
        entityName,
        groupId,
        category: "ROC_MCA",
        title: "Form INC-20A (Declaration of Commencement of Business)",
        period: cycle.fyLabel,
        dueDate: inc20aDue,
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "CRITICAL",
        penaltyRisk: 0,
        accruingDailyPenalty: 0,
        missingDocumentsCount: 2,
        missingDocumentsList: ["Subscription Money Bank Credit Proof", "Current Account Opening Letter"],
        chaseCount: 0,
        cin,
        pan,
        clientApprovalStatus: "PENDING",
        penaltyNote: "Sec 10A: ₹50,000 company penalty + ₹1,000/day per officer after 180 days",
      });
      tasks.push({
        id: `TSK-ADT1-${cycle.fyStartYear}-${cleanId}`,
        entityId,
        entityName,
        groupId,
        category: "ROC_MCA",
        title: "Form ADT-1 (First Statutory Auditor Appointment)",
        period: cycle.fyLabel,
        dueDate: adt1Due,
        status: "DOCUMENTS_AWAITED",
        assignedTo: article,
        reviewedBy: partner,
        priority: "HIGH",
        penaltyRisk: 0,
        accruingDailyPenalty: 0,
        missingDocumentsCount: 1,
        missingDocumentsList: ["Signed Board Resolution & Auditor Consent u/s 139(6)"],
        chaseCount: 0,
        cin,
        pan,
        clientApprovalStatus: "PENDING",
        penaltyNote: "Must appoint first auditor within 30 days of incorporation u/s 139(6)",
      });
    } else if (isCorporate && !rocAlreadyFiled) {
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
    } else if (isLlp && !rocAlreadyFiled && !isFreshlyIncorporated) {
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
  }

  // 6. Charitable Trust / Sec 8 NGO Statutory Filings
  if (hasScope("INCOME_TAX") && isTrust && !itrAlreadyFiled && !isFreshlyIncorporated) {
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
  if (hasScope("INCOME_TAX") && isIndividual && !itrAlreadyFiled && !isFreshlyIncorporated) {
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
