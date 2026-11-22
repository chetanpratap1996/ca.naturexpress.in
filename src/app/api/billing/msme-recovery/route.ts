import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification } from "@/lib/server/db";
import {
  evaluateInvoiceUnderMsme,
  formatMsmeWhatsAppEscalationMessage,
  generateMsmeLegalDemandNoticeText,
  SAMPLE_MSME_OVERDUE_INVOICES,
  MsmeInvoiceEvaluation,
  MsmePortfolioRiskSummary,
  MsmeEscalationStage
} from "@/lib/billing/msmeRecoveryEngine";
import { generateNpciDynamicUpiUri } from "@/lib/billing/npciUpiEngine";

export async function GET(request: NextRequest) {
  try {
    const db = ensureDatabase();
    const searchParams = request.nextUrl.searchParams;
    const stageFilter = searchParams.get("stage") as MsmeEscalationStage | null;
    const entityId = searchParams.get("entityId");

    // Evaluate live db invoices and merge with portfolio suite
    const dbEvaluations: MsmeInvoiceEvaluation[] = (db.invoices || []).map((inv) => {
      const client = db.clients?.find((c) => c.id === inv.entityId);
      return evaluateInvoiceUnderMsme(inv, client);
    });

    const evaluationsMap = new Map<string, MsmeInvoiceEvaluation>();
    for (const item of dbEvaluations) {
      evaluationsMap.set(item.invoiceNo, item);
    }
    for (const sample of SAMPLE_MSME_OVERDUE_INVOICES) {
      if (!evaluationsMap.has(sample.invoiceNo)) {
        evaluationsMap.set(sample.invoiceNo, sample);
      }
    }

    let evaluations = Array.from(evaluationsMap.values());

    // Filter by entity if requested
    if (entityId) {
      evaluations = evaluations.filter((e) => e.entityId === entityId);
    }

    // Filter by stage if requested
    if (stageFilter) {
      evaluations = evaluations.filter((e) => e.stage === stageFilter);
    }

    // Portfolio Risk Calculations
    const totalOverdueAmountInr = evaluations.reduce((sum, e) => sum + e.amount, 0);
    const totalAccruedInterestInr = evaluations.reduce((sum, e) => sum + e.accruedCompoundedInterestInr, 0);
    const totalClientTaxDisallowanceRiskInr = evaluations.reduce((sum, e) => sum + e.potentialTaxDisallowanceLossInr, 0);

    const summary: MsmePortfolioRiskSummary = {
      totalOverdueAmountInr,
      totalAccruedInterestInr,
      totalClientTaxDisallowanceRiskInr,
      invoicesCountByStage: {
        stage1: evaluations.filter((e) => e.stage === "STAGE_1_COURTESY").length,
        stage2: evaluations.filter((e) => e.stage === "STAGE_2_COUNTDOWN").length,
        stage3: evaluations.filter((e) => e.stage === "STAGE_3_INTEREST_RISK").length,
        stage4: evaluations.filter((e) => e.stage === "STAGE_4_STATUTORY_DEMAND").length
      },
      totalEvaluatedInvoices: evaluations.length
    };

    return NextResponse.json({
      success: true,
      evaluations,
      summary
    });
  } catch (error: any) {
    console.error("GET /api/billing/msme-recovery error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = ensureDatabase();
    const body = await request.json();
    const { action, invoiceNo, partnerName, promissoryDate, disputeReason } = body;

    let targetInvoice = db.invoices?.find((i) => i.invoiceNo === invoiceNo);
    const sampleMatch = SAMPLE_MSME_OVERDUE_INVOICES.find((i) => i.invoiceNo === invoiceNo);
    const client = db.clients?.find((c) => c.id === targetInvoice?.entityId || c.id === sampleMatch?.entityId);

    const evaluation: MsmeInvoiceEvaluation = targetInvoice 
      ? evaluateInvoiceUnderMsme(targetInvoice, client)
      : sampleMatch || SAMPLE_MSME_OVERDUE_INVOICES[0];

    const firmVpa = db.firmMetrics?.firmUpiVpa || "BRAINSANDTAXES@icici";
    const upiLink = generateNpciDynamicUpiUri({
      vpa: firmVpa,
      payeeName: "GPA & Co., Chartered Accountants",
      amount: evaluation.amount,
      invoiceNo: evaluation.invoiceNo,
      note: `MSME Settlement ${evaluation.invoiceNo}`
    });

    // ACTION 1: GENERATE FORMAL STATUTORY LEGAL DEMAND NOTICE DRAFT
    if (action === "GENERATE_LEGAL_DEMAND_NOTICE") {
      const noticeText = generateMsmeLegalDemandNoticeText({
        evaluation,
        partnerName: partnerName || "CA Gunjan Jain, FCA, DISA"
      });

      await logAuditEvent(
        partnerName || "CA Gunjan Jain",
        "PARTNER",
        evaluation.clientName,
        "MSME Legal Demand Notice Generated",
        `Generated statutory Section 18 demand notice for ${evaluation.invoiceNo} (₹${evaluation.amount.toLocaleString("en-IN")}) citing Section 43B(h) disallowance and ${evaluation.msmeStatutoryInterestRatePct}% interest.`,
        "INVOICE"
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        noticeText,
        evaluation
      });
    }

    // ACTION 2: DISPATCH ESCALATION WHATSAPP
    if (action === "DISPATCH_ESCALATION_WHATSAPP") {
      const whatsappText = formatMsmeWhatsAppEscalationMessage({
        evaluation,
        upiPaymentLink: upiLink,
        partnerName: partnerName || "CA Gunjan Jain"
      });

      await logAuditEvent(
        partnerName || "CA Gunjan Jain",
        "PARTNER",
        evaluation.clientName,
        "MSME Escalation Notice Dispatched",
        `Dispatched ${evaluation.stage} WhatsApp advisory for invoice ${evaluation.invoiceNo}.`,
        "INVOICE"
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        whatsappText,
        upiLink,
        stage: evaluation.stage
      });
    }

    // ACTION 3: RECORD PROMISSORY DATE OR DISPUTE
    if (action === "RECORD_PROMISSORY") {
      if (targetInvoice) {
        targetInvoice.clientPayerNote = promissoryDate 
          ? `Promised to settle on ${promissoryDate}` 
          : `Dispute noted: ${disputeReason || "Rate reconciliation in progress"}`;
      }

      await logAuditEvent(
        partnerName || "CA Gunjan Jain",
        "PARTNER",
        evaluation.clientName,
        "Promissory Settlement Date Recorded",
        `Client committed settlement by ${promissoryDate || "dispute log"}.`,
        "INVOICE"
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: "Settlement note updated successfully."
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/billing/msme-recovery error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
