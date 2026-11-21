/**
 * Brains & Taxes — Enterprise AIS / 26AS JSON Parser
 * Ingests official Income Tax Department Annual Information Statement (AIS/TIS) JSON.
 * Converts raw ITD information into structured AisRecord and SftEngine inputs.
 */

import { AisRecord } from "@/components/firm/Ais26asAnalyzer";

export interface AisParseResult {
  success: boolean;
  pan: string;
  taxpayerName: string;
  financialYear: string;
  assessmentYear: string;
  totalRecords: number;
  totalReportedAmount: number;
  totalTaxDeducted: number;
  sftCount: number;
  tdsCount: number;
  records: AisRecord[];
  errors: string[];
}

function cleanNumber(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse Official Income Tax Portal AIS/TIS JSON
 */
export function parseOfficialAisJson(jsonContent: string | object): AisParseResult {
  const errors: string[] = [];
  const records: AisRecord[] = [];

  let data: any;
  try {
    data = typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;
  } catch (e: any) {
    return {
      success: false,
      pan: "",
      taxpayerName: "",
      financialYear: "",
      assessmentYear: "",
      totalRecords: 0,
      totalReportedAmount: 0,
      totalTaxDeducted: 0,
      sftCount: 0,
      tdsCount: 0,
      records: [],
      errors: [`Invalid AIS JSON format: ${e.message}`]
    };
  }

  // Extract Metadata
  const pan = (data.pan || data.taxpayerDetails?.pan || data.aisDetails?.pan || "").toUpperCase();
  const taxpayerName = data.taxpayerName || data.taxpayerDetails?.name || data.aisDetails?.name || pan;
  const financialYear = data.financialYear || data.fy || data.aisDetails?.fy || "FY 2025-26";
  const assessmentYear = data.assessmentYear || data.ay || data.aisDetails?.ay || "AY 2026-27";

  let idx = 1;

  // 1. Parse Part B1: TDS / TCS
  const tdsList = data.partB1Tds || data.aisDetails?.partB1Tds || data.tdsTcsDetails || [];
  if (Array.isArray(tdsList)) {
    for (const item of tdsList) {
      const reportingEntity = item.deductorName || item.tanName || item.reportingEntity || "Tax Deductor";
      const section = item.section || item.sectionCode || "194";
      const reportedAmount = cleanNumber(item.grossAmount || item.amount || item.paymentAmount);
      const taxDeducted = cleanNumber(item.tdsAmount || item.taxDeducted || item.totalTds);
      const desc = item.description || `TDS under Section ${section} by ${reportingEntity}`;

      records.push({
        id: `ais-rec-${idx++}`,
        sourceType: "TDS_26AS",
        partCategory: "PART_B1_TDS",
        reportingEntity,
        description: desc,
        pan,
        financialYear,
        assessmentYear,
        reportedAmount,
        taxDeducted,
        informationCode: section,
        itrStatus: taxDeducted > 0 ? "MATCHED_IN_ITR" : "RESOLVED_IN_ITR",
        targetItrSchedule: "Schedule TDS-2",
        recommendation: `Claim ₹${taxDeducted.toLocaleString("en-IN")} tax credit in Schedule TDS of ITR.`
      });
    }
  }

  // 2. Parse Part B2: SFT (Statement of Financial Transactions - Rule 114E)
  const sftList = data.partB2Sft || data.aisDetails?.partB2Sft || data.sftInformation || data.sftDetails || [];
  if (Array.isArray(sftList)) {
    for (const item of sftList) {
      const sftCode = (item.sftCode || item.code || item.informationCode || "SFT-004").toUpperCase();
      const reportingEntity = item.reportingEntity || item.bankName || item.entityName || "Reporting Institution";
      const reportedAmount = cleanNumber(item.amount || item.aggregateAmount || item.reportedAmount);
      const desc = item.description || `SFT reporting under code ${sftCode} by ${reportingEntity}`;

      let recommendation = `Reconcile against Cash Book & Ledger balances.`;
      let status: AisRecord["itrStatus"] = "MATCHED_IN_ITR";

      if (sftCode === "SFT-001" || sftCode === "SFT-002" || sftCode === "SFT-004") {
        if (reportedAmount >= 1000000) {
          status = "DISCREPANCY_FLAG";
          recommendation = `High value cash transaction (${sftCode}). Substantiate source of funds to prevent Sec 68 / 69A unexplained credit scrutiny.`;
        }
      }

      records.push({
        id: `ais-rec-${idx++}`,
        sourceType: "SFT_HIGH_VALUE",
        partCategory: "PART_B2_SFT",
        reportingEntity,
        description: desc,
        pan,
        financialYear,
        assessmentYear,
        reportedAmount,
        taxDeducted: 0,
        informationCode: sftCode,
        itrStatus: status,
        targetItrSchedule: sftCode === "SFT-017" ? "Schedule CG" : "Schedule BP",
        recommendation
      });
    }
  }

  // 3. Fallback generic info array
  const genericList = data.information || data.informationDetails || [];
  if (Array.isArray(genericList) && records.length === 0) {
    for (const item of genericList) {
      records.push({
        id: `ais-rec-${idx++}`,
        sourceType: (item.sourceType as any) || "SFT_HIGH_VALUE",
        partCategory: (item.partCategory as any) || "PART_B2_SFT",
        reportingEntity: item.reportingEntity || "Reporting Entity",
        description: item.description || "Reported Financial Activity",
        pan,
        financialYear,
        assessmentYear,
        reportedAmount: cleanNumber(item.reportedAmount || item.amount),
        taxDeducted: cleanNumber(item.taxDeducted),
        informationCode: item.informationCode || "SFT-004",
        itrStatus: item.itrStatus || "MATCHED_IN_ITR",
        targetItrSchedule: item.targetItrSchedule || "Schedule BP",
        recommendation: item.recommendation || "Verify against books of accounts."
      });
    }
  }

  const totalAmount = records.reduce((acc, r) => acc + r.reportedAmount, 0);
  const totalTax = records.reduce((acc, r) => acc + r.taxDeducted, 0);
  const sftCount = records.filter(r => r.partCategory === "PART_B2_SFT").length;
  const tdsCount = records.filter(r => r.partCategory === "PART_B1_TDS").length;

  return {
    success: records.length > 0,
    pan,
    taxpayerName,
    financialYear,
    assessmentYear,
    totalRecords: records.length,
    totalReportedAmount: Math.round(totalAmount * 100) / 100,
    totalTaxDeducted: Math.round(totalTax * 100) / 100,
    sftCount,
    tdsCount,
    records,
    errors
  };
}
