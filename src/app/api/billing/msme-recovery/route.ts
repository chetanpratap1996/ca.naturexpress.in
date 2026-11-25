import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import {
  evaluateInvoiceUnderMsme,
  formatMsmeWhatsAppEscalationMessage,
  generateMsmeLegalDemandNoticeText,
  MsmeInvoiceEvaluation,
  MsmeEscalationStage,
} from "@/lib/billing/msmeRecoveryEngine";
import { generateNpciDynamicUpiUri } from "@/lib/billing/npciUpiEngine";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog } from "@/lib/server/pgHelpers";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const searchParams = request.nextUrl.searchParams;
    const stageFilter = searchParams.get("stage") as MsmeEscalationStage | null;
    const entityId = searchParams.get("entityId");

    const [{ rows: entRows }, { rows: invRows }] = await Promise.all([
      pool.query("SELECT * FROM public.client_entities WHERE firm_id = $1", [firmId]),
      pool.query("SELECT * FROM public.invoices WHERE firm_id = $1 AND status <> 'PAID'", [firmId]),
    ]);

    const entMap = new Map(entRows.map((e: any) => [e.id, e]));
    let evaluations: MsmeInvoiceEvaluation[] = invRows.map((inv: any) => {
      const e: any = entMap.get(inv.entity_id);
      const clientObj = e ? { id: e.id, name: e.entity_name, type: e.type, pan: e.pan } : undefined;
      const invObj = {
        id: inv.id,
        invoiceNo: inv.invoice_no,
        entityId: inv.entity_id,
        entityName: e?.entity_name || "Client Entity",
        amount: Number(inv.total_amount || 0),
        dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        status: inv.status,
      };
      return evaluateInvoiceUnderMsme(invObj as any, clientObj as any);
    });

    if (entityId) evaluations = evaluations.filter((e) => e.entityId === entityId);
    if (stageFilter) evaluations = evaluations.filter((e) => e.stage === stageFilter);

    return NextResponse.json({
      success: true,
      evaluations,
      summary: {
        totalOverdueAmountInr: evaluations.reduce((sum, e) => sum + e.amount, 0),
        totalAccruedInterestInr: evaluations.reduce((sum, e) => sum + e.accruedCompoundedInterestInr, 0),
        totalClientTaxDisallowanceRiskInr: evaluations.reduce((sum, e) => sum + e.potentialTaxDisallowanceLossInr, 0),
        invoicesCountByStage: {
          stage1: evaluations.filter((e) => e.stage === "STAGE_1_COURTESY").length,
          stage2: evaluations.filter((e) => e.stage === "STAGE_2_COUNTDOWN").length,
          stage3: evaluations.filter((e) => e.stage === "STAGE_3_INTEREST_RISK").length,
          stage4: evaluations.filter((e) => e.stage === "STAGE_4_STATUTORY_DEMAND").length,
        },
        totalEvaluatedInvoices: evaluations.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/billing/msme-recovery error:", error);
    return NextResponse.json({ success: false, error: "Failed to load MSME recovery data." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Partner authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const body = await request.json();
    const { action, invoiceNo, promissoryDate, disputeReason } = body;

    if (!invoiceNo) {
      return NextResponse.json({ success: false, error: "invoiceNo is required." }, { status: 400 });
    }

    const invRes = await pool.query(
      `SELECT i.*, ce.entity_name, ce.type, ce.pan
       FROM public.invoices i
       JOIN public.client_entities ce ON ce.id = i.entity_id
       WHERE i.firm_id = $1 AND i.invoice_no = $2
       LIMIT 1`,
      [firmId, invoiceNo]
    );
    if (invRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });
    }
    const row = invRes.rows[0];
    const evaluation = evaluateInvoiceUnderMsme(
      {
        id: row.id,
        invoiceNo: row.invoice_no,
        entityId: row.entity_id,
        entityName: row.entity_name,
        amount: Number(row.total_amount || 0),
        dueDate: new Date(row.due_date).toISOString().split("T")[0],
        status: row.status,
      } as any,
      { id: row.entity_id, name: row.entity_name, type: row.type, pan: row.pan } as any
    );

    const partnerName = auth.userName || DEFAULT_FIRM_BRANDING.managingPartner;
    const upiLink = generateNpciDynamicUpiUri({
      vpa: DEFAULT_FIRM_BRANDING.firmUpiVpa,
      payeeName: DEFAULT_FIRM_BRANDING.firmName,
      amount: evaluation.amount,
      invoiceNo: evaluation.invoiceNo,
      note: `MSME Settlement ${evaluation.invoiceNo}`,
    });

    if (action === "GENERATE_LEGAL_DEMAND_NOTICE") {
      const noticeText = generateMsmeLegalDemandNoticeText({ evaluation, partnerName });
      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: partnerName,
        actorRole: "PARTNER",
        entityId: row.entity_id,
        entityName: evaluation.clientName,
        action: "MSME Legal Demand Notice Drafted",
        details: `Generated draft Section 18 demand notice for ${evaluation.invoiceNo}.`,
        category: "INVOICE",
      });
      return NextResponse.json({ success: true, noticeText, upiLink, evaluation });
    }

    if (action === "DISPATCH_ESCALATION_WHATSAPP") {
      const whatsappText = formatMsmeWhatsAppEscalationMessage({ evaluation, upiPaymentLink: upiLink, partnerName });
      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: partnerName,
        actorRole: "PARTNER",
        entityId: row.entity_id,
        entityName: evaluation.clientName,
        action: "MSME Escalation Prepared",
        details: `Prepared ${evaluation.stage} WhatsApp reminder for invoice ${evaluation.invoiceNo}.`,
        category: "INVOICE",
      });
      return NextResponse.json({ success: true, whatsappText, upiLink, stage: evaluation.stage });
    }

    if (action === "RECORD_PROMISSORY") {
      const note = promissoryDate
        ? `Promised to settle on ${promissoryDate}`
        : `Dispute noted: ${disputeReason || "Rate reconciliation in progress"}`;
      await pool.query("UPDATE public.invoices SET client_payer_note = $1 WHERE id = $2 AND firm_id = $3", [
        note,
        row.id,
        firmId,
      ]);
      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: partnerName,
        actorRole: "PARTNER",
        entityId: row.entity_id,
        entityName: evaluation.clientName,
        action: "Promissory Settlement Date Recorded",
        details: note,
        category: "INVOICE",
      });
      return NextResponse.json({ success: true, message: "Settlement note updated successfully." });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/billing/msme-recovery error:", error);
    return NextResponse.json({ success: false, error: "Failed to process MSME action." }, { status: 500 });
  }
}
