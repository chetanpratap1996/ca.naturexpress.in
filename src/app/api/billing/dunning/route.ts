import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog } from "@/lib/server/pgHelpers";
import { ensureBillingSchema } from "@/lib/server/billingSchema";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { generateNpciDynamicUpiUri } from "@/lib/billing/invoicingEngine";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json({ success: false, error: "Staff authorization required." }, { status: 403 });
    }
    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    await ensureBillingSchema(pool);

    const { rows } = await pool.query(
      `SELECT d.*, ce.entity_name, i.invoice_no
       FROM public.dunning_logs d
       JOIN public.client_entities ce ON ce.id = d.entity_id
       LEFT JOIN public.invoices i ON i.id = d.invoice_id
       WHERE d.firm_id = $1
       ORDER BY d.sent_at DESC
       LIMIT 100`,
      [firmId]
    );

    return NextResponse.json({ success: true, logs: rows });
  } catch (error: any) {
    console.error("GET /api/billing/dunning error:", error);
    return NextResponse.json({ success: false, error: "Failed to load dunning logs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json({ success: false, error: "Partner authorization required." }, { status: 403 });
    }
    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    await ensureBillingSchema(pool);

    const { rows: openInvoices } = await pool.query(
      `SELECT i.*, ce.entity_name, ce.primary_contact_phone, ce.primary_contact_email
       FROM public.invoices i
       JOIN public.client_entities ce ON ce.id = i.entity_id
       WHERE i.firm_id = $1
         AND i.status IN ('PENDING', 'OVERDUE')
         AND COALESCE(i.dunning_paused, FALSE) = FALSE
         AND (i.promissory_date IS NULL OR i.promissory_date < CURRENT_DATE)`,
      [firmId]
    );

    const dispatches: Array<{
      invoiceNo: string;
      clientName: string;
      stage: string;
      phone: string;
      upiLink: string;
      message: string;
    }> = [];

    const nowMs = Date.now();
    for (const inv of openInvoices) {
      const dueMs = new Date(inv.due_date).getTime();
      const daysDiff = Math.floor((nowMs - dueMs) / 86400000);
      let stage = "";
      if (daysDiff >= 45) stage = "MSME_45_DEMAND";
      else if (daysDiff >= 30) stage = "PAY_GATE_30";
      else if (daysDiff >= 15) stage = "MSME_15_WARN";
      else if (daysDiff >= 1) stage = "T_PLUS_1";
      else if (daysDiff >= -3) stage = "T_MINUS_3";

      if (!stage || inv.last_dunning_stage === stage) continue;

      const balance = Math.max(0, Number(inv.total_amount || 0) - Number(inv.paid_amount || 0) - Number(inv.tds_claimed_amount || 0));
      const upiLink = generateNpciDynamicUpiUri(
        DEFAULT_FIRM_BRANDING.firmUpiVpa,
        DEFAULT_FIRM_BRANDING.firmName,
        balance,
        inv.invoice_no,
        inv.entity_name
      );
      const message = `[${stage}] Reminder for ${inv.entity_name}: Invoice ${inv.invoice_no} (₹${balance.toLocaleString("en-IN")}) due ${inv.due_date}. Pay via UPI: ${upiLink}`;

      await pool.query(
        `INSERT INTO public.dunning_logs (firm_id, entity_id, invoice_id, stage, channel, recipient, status, message_preview)
         VALUES ($1, $2, $3, $4, 'WHATSAPP', $5, 'QUEUED', $6)`,
        [firmId, inv.entity_id, inv.id, stage, inv.primary_contact_phone || inv.primary_contact_email || "Client", message]
      );

      await pool.query(
        `UPDATE public.invoices SET last_dunning_stage = $1, last_dunning_at = now() WHERE id = $2`,
        [stage, inv.id]
      );

      dispatches.push({
        invoiceNo: inv.invoice_no,
        clientName: inv.entity_name,
        stage,
        phone: inv.primary_contact_phone || "",
        upiLink,
        message,
      });
    }

    if (dispatches.length > 0) {
      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Dunning Autopilot",
        actorRole: "PARTNER",
        entityName: `${dispatches.length} Clients`,
        action: "Dunning Escalation Sweep",
        details: `Queued ${dispatches.length} escalation reminder(s) across T-3 to MSME 45d stages.`,
        category: "INVOICE",
      });
    }

    return NextResponse.json({ success: true, dispatchedCount: dispatches.length, dispatches });
  } catch (error: any) {
    console.error("POST /api/billing/dunning error:", error);
    return NextResponse.json({ success: false, error: "Failed to run dunning sweep." }, { status: 500 });
  }
}
