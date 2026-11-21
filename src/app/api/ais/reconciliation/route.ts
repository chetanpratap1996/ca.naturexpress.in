import { NextRequest, NextResponse } from "next/server";
import { SftEngine } from "@/lib/ais/sftEngine";
import { AisCrossReconciler, AisRecordInput, BooksIncomeSourceItem } from "@/lib/ais/aisCrossReconciler";
import { InsightNoticeForecaster } from "@/lib/ais/insightNoticeForecaster";
import { ensureDatabase, saveDatabase, ClientAisDataItem } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pan = searchParams.get("pan") || "ABFPS1234E";
    const ay = searchParams.get("ay") || "AY 2026-27";
    const fy = searchParams.get("fy") || "FY 2025-26";
    const isSenior = searchParams.get("isSenior") === "true";

    const sampleAis: AisRecordInput[] = [
      {
        id: "ais-1",
        informationCode: "SFT-004",
        reportingEntity: "HDFC Bank Limited (Palasia Branch)",
        description: "Cash deposits in current/savings account aggregating to ₹10 Lakh or more (SFT-004)",
        pan,
        reportedAmount: 1450000,
        taxDeducted: 0,
        sourceType: "SFT_HIGH_VALUE"
      },
      {
        id: "ais-2",
        informationCode: "SEC_194J",
        reportingEntity: "Tata Consultancy Services Ltd",
        description: "TDS on Professional/Technical Fees under Section 194J @ 10%",
        pan,
        reportedAmount: 850000,
        taxDeducted: 85000,
        sourceType: "TDS_26AS"
      },
      {
        id: "ais-3",
        informationCode: "SEC_194",
        reportingEntity: "ITC Limited (Registrar & Transfer Agent)",
        description: "Dividend distributed by domestic company under Section 194",
        pan,
        reportedAmount: 48500,
        taxDeducted: 4850,
        sourceType: "DIVIDEND"
      },
      {
        id: "ais-4",
        informationCode: "SFT-017",
        reportingEntity: "Zerodha Broking Limited",
        description: "Sale of listed equity shares / units of equity-oriented mutual funds (SFT-017)",
        pan,
        reportedAmount: 2240000,
        taxDeducted: 0,
        sourceType: "SECURITIES_TRADING"
      },
      {
        id: "ais-5",
        informationCode: "SEC_194A",
        reportingEntity: "State Bank of India (Indore Main Branch)",
        description: "Interest from Term Deposits (FD) & Savings Bank Account u/s 194A",
        pan,
        reportedAmount: 76200,
        taxDeducted: 7620,
        sourceType: "INTEREST_SAVINGS_FD"
      },
      {
        id: "ais-6",
        informationCode: "TCS_206C_1G",
        reportingEntity: "ICICI Bank Forex Services",
        description: "Outward remittance under Liberalised Remittance Scheme (LRS) / TCS u/s 206C(1G)",
        pan,
        reportedAmount: 620000,
        taxDeducted: 31000,
        sourceType: "FOREIGN_REMITTANCE"
      }
    ];

    const sampleBooks: BooksIncomeSourceItem[] = [
      {
        id: "bk-1",
        category: "BUSINESS_PROFESSION",
        ledgerName: "Tata Consultancy Services Ltd",
        financialYear: fy,
        grossAmountInr: 850000,
        tdsOrTcsInr: 85000,
        sectionCode: "194J"
      },
      {
        id: "bk-2",
        category: "OTHER_SOURCES",
        ledgerName: "State Bank of India Interest",
        financialYear: fy,
        grossAmountInr: 76200,
        tdsOrTcsInr: 7620,
        sectionCode: "194A"
      },
      {
        id: "bk-3",
        category: "TDS_TCS_CREDIT",
        ledgerName: "ICICI Bank Foreign Outward TCS",
        financialYear: fy,
        grossAmountInr: 620000,
        tdsOrTcsInr: 31000,
        sectionCode: "206C(1G)"
      }
    ];

    const report = AisCrossReconciler.reconcile({
      pan,
      assessmentYear: ay,
      financialYear: fy,
      isSeniorCitizen: isSenior,
      aisRecords: sampleAis,
      booksItems: sampleBooks,
      clientAnnualTurnoverInr: 12500000
    });

    const forecast = InsightNoticeForecaster.forecastNoticeExposure({
      pan,
      taxpayerName: "Rajesh Sharma",
      financialYear: fy,
      assessmentYear: ay,
      totalUnreportedIncomeInr: report.summary.totalUnreportedIncomeExposureInr,
      totalDiscrepancyAmountInr: report.summary.potentialAdditionRiskSec143_1_Inr,
      hasUnexplainedCashSft: true,
      unexplainedCashAmountInr: 1450000,
      unclaimedTdsInr: report.summary.unclaimedTdsCreditInr,
      discrepantItems: report.reconciledItems
        .filter(i => i.recoStatus !== "MATCHED_IN_ITR")
        .map(i => ({
          code: i.informationCode,
          entity: i.reportingEntity,
          reportedAmount: i.aisReportedAmount,
          description: i.sourceDescription
        }))
    });

    return NextResponse.json({
      success: true,
      report,
      forecast
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process AIS cross-reconciliation"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pan, assessmentYear, financialYear, isSeniorCitizen, aisRecords, booksItems, clientAnnualTurnoverInr } = body;

    if (!pan || !Array.isArray(aisRecords) || !Array.isArray(booksItems)) {
      return NextResponse.json({
        success: false,
        error: "Missing mandatory fields: pan, aisRecords, booksItems"
      }, { status: 400 });
    }

    const report = AisCrossReconciler.reconcile({
      pan,
      assessmentYear: assessmentYear || "AY 2026-27",
      financialYear: financialYear || "FY 2025-26",
      isSeniorCitizen: !!isSeniorCitizen,
      aisRecords,
      booksItems,
      clientAnnualTurnoverInr: clientAnnualTurnoverInr || 0
    });

    // Persist real AIS state into Database
    try {
      const db = ensureDatabase();
      if (!db.clientAisData) db.clientAisData = [];

      const client = db.clients.find(c => c.pan?.toUpperCase() === pan.toUpperCase());
      const clientId = client?.id || `CLI-${pan}`;

      const totalSft = aisRecords.filter((r: any) => r.sourceType === "SFT_HIGH_VALUE").reduce((acc: number, r: any) => acc + (r.reportedAmount || 0), 0);
      const totalTds = aisRecords.filter((r: any) => r.sourceType === "TDS_26AS").reduce((acc: number, r: any) => acc + (r.taxDeducted || 0), 0);

      const item: ClientAisDataItem = {
        id: `ais-${pan}-${Date.now()}`,
        clientId,
        pan,
        assessmentYear: assessmentYear || "AY 2026-27",
        updatedAt: new Date().toISOString(),
        totalSftAmount: totalSft,
        sftItemCount: aisRecords.filter((r: any) => r.sourceType === "SFT_HIGH_VALUE").length,
        totalTdsAmount: totalTds,
        discrepancyRiskCount: report.reconciledItems.filter(i => i.recoStatus !== "MATCHED_IN_ITR").length,
        records: aisRecords
      };

      const existingIdx = db.clientAisData.findIndex(a => a.pan.toUpperCase() === pan.toUpperCase() && a.assessmentYear === item.assessmentYear);
      if (existingIdx !== -1) {
        db.clientAisData[existingIdx] = item;
      } else {
        db.clientAisData.push(item);
      }
      await saveDatabase(db);
    } catch (saveErr) {
      console.warn("Could not persist AIS data to DB:", saveErr);
    }

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process custom AIS reconciliation"
    }, { status: 500 });
  }
}
