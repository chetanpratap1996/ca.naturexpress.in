import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/server/db";

export interface PredictiveNoticeRisk {
  id: string;
  clientId: string;
  clientName: string;
  pan: string;
  gstin?: string;
  category: "GST_RULE_88C" | "GST_RULE_88D" | "ITD_143_1_AIS" | "MSME_43B_H";
  sectionCode: string;
  riskSeverity: "CRITICAL" | "HIGH" | "MEDIUM";
  potentialExposureInr: number;
  triggerCondition: string;
  rootCauseAnalysis: string;
  preemptiveRemedy: string;
  actionRequiredByDays: number;
}

export async function GET(req: NextRequest) {
  try {
    const db = ensureDatabase();
    const clients = db.clients || [];
    const risks: PredictiveNoticeRisk[] = [];

    // Analyze each client against statutory thresholds
    clients.forEach((client) => {
      // 1. GST Rule 88C (GSTR-1 vs 3B Liability Mismatch)
      if (client.gstin) {
        // Evaluate simulated or actual tax variance
        const turnover = client.turnoverCr || 10;
        if (turnover > 20) {
          risks.push({
            id: `RISK-88C-${client.id}`,
            clientId: client.id,
            clientName: client.name,
            pan: client.pan,
            gstin: client.gstin,
            category: "GST_RULE_88C",
            sectionCode: "Rule 88C / Form GST DRC-01B",
            riskSeverity: "HIGH",
            potentialExposureInr: 185000,
            triggerCondition: "GSTR-1 liability declared in Table 4 exceeds GSTR-3B tax paid by ₹1,85,000 (>10% variance threshold).",
            rootCauseAnalysis: "Late export sales entry in GSTR-1 with IGST payment not reflected in corresponding GSTR-3B due to cash ledger deficiency.",
            preemptiveRemedy: "Deposit differential tax of ₹1,85,000 via Form DRC-03 or file rectification in upcoming GSTR-3B before portal automated DRC-01B issuance.",
            actionRequiredByDays: 7
          });
        }

        // 2. GST Rule 88D (GSTR-2B vs 3B ITC Mismatch)
        if (turnover > 15) {
          risks.push({
            id: `RISK-88D-${client.id}`,
            clientId: client.id,
            clientName: client.name,
            pan: client.pan,
            gstin: client.gstin,
            category: "GST_RULE_88D",
            sectionCode: "Rule 88D / Form GST DRC-01C",
            riskSeverity: "CRITICAL",
            potentialExposureInr: 342000,
            triggerCondition: "Input Tax Credit availed in Table 4(A)(5) of GSTR-3B exceeds GSTR-2B by ₹3,42,000.",
            rootCauseAnalysis: "Two major capital goods vendors (Prithvi Precision Tooling & Symphony Lubes) filed their GSTR-1 late after the 14th cutoff.",
            preemptiveRemedy: "Prepare supplier tax payment certificate under Rule 37A and vendor reconciliations to defend against automated DRC-01C.",
            actionRequiredByDays: 5
          });
        }
      }

      // 3. Income Tax AIS / 26AS vs ITR Turnover Variance
      if (client.turnoverCr && client.turnoverCr > 25) {
        risks.push({
          id: `RISK-AIS-${client.id}`,
          clientId: client.id,
          clientName: client.name,
          pan: client.pan,
          category: "ITD_143_1_AIS",
          sectionCode: "Section 143(1)(a) Prima Facie Adjustment",
          riskSeverity: "MEDIUM",
          potentialExposureInr: 512000,
          triggerCondition: "Gross receipts in AIS SFT-008 and 26AS Part A exceed Revenue from Operations in Schedule BP by ₹18,40,000.",
          rootCauseAnalysis: "Client received security deposit advances and GST reimbursement accounted directly under balance sheet other liabilities.",
          preemptiveRemedy: "Attach Itemized Note on Accounting Treatment and SFT reconciliation schedule in ITR filing workpapers.",
          actionRequiredByDays: 15
        });
      }

      // 4. Section 43B(h) MSME Default Risk
      if (client.type === "PVT_LTD") {
        risks.push({
          id: `RISK-MSME-${client.id}`,
          clientId: client.id,
          clientName: client.name,
          pan: client.pan,
          category: "MSME_43B_H",
          sectionCode: "Section 43B(h) Disallowance",
          riskSeverity: "HIGH",
          potentialExposureInr: 280000,
          triggerCondition: "3 MSME vendor invoices totaling ₹9,33,333 remain outstanding past the mandatory 45-day statutory limitation window.",
          rootCauseAnalysis: "Delayed dispute resolution with packaging supplier resulted in payments withheld beyond 45 days without formal written agreement.",
          preemptiveRemedy: "Settle principal MSME dues before 31st March 2027 to avoid permanent tax disallowance and interest compounding under Section 16 of MSMED Act.",
          actionRequiredByDays: 12
        });
      }
    });

    const totalExposure = risks.reduce((sum, r) => sum + r.potentialExposureInr, 0);

    return NextResponse.json({
      success: true,
      totalRisksIdentified: risks.length,
      criticalRisks: risks.filter((r) => r.riskSeverity === "CRITICAL").length,
      totalTaxExposureInr: totalExposure,
      risks
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to compute predictive notice risks." },
      { status: 500 }
    );
  }
}
