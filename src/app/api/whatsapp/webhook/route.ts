/**
 * Brains & Taxes — Production Meta WhatsApp Cloud API v21.0 Webhook Endpoint
 * Secured with HMAC-SHA256 verification and PostgreSQL persistence.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyWhatsAppWebhookSignature } from "@/lib/whatsapp/cloudApi";
import { sanitizeIndianPhoneNumber } from "@/lib/whatsapp/templates";
import { getPostgresPool } from "@/lib/server/postgres";
import { appendPgAuditLog, upsertWorkspaceRecord } from "@/lib/server/pgHelpers";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: "WHATSAPP_VERIFY_TOKEN is not configured." }, { status: 503 });
  }

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge || "", { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden: Invalid verify token" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-hub-signature-256");

    const isValidSignature = verifyWhatsAppWebhookSignature(
      rawBody,
      signatureHeader,
      process.env.WHATSAPP_APP_SECRET
    );
    if (!isValidSignature) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
    }

    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0] || payload.message;
    if (!message) {
      return NextResponse.json({ success: true, note: "No message payload" });
    }

    const fromPhone = sanitizeIndianPhoneNumber(message.from || payload.from || "");
    const phone10 = fromPhone.slice(-10);
    if (phone10.length !== 10) {
      return NextResponse.json({ success: false, error: "Valid sender phone required." }, { status: 400 });
    }

    const pool = getPostgresPool();
    // Strict lookup by sender phone — NEVER fall back to clients[0]
    const clientRes = await pool.query(
      `SELECT ce.*, f.firm_name
       FROM public.client_entities ce
       LEFT JOIN public.firms f ON f.id = ce.firm_id
       WHERE RIGHT(REGEXP_REPLACE(COALESCE(ce.primary_contact_phone, ''), '\\D', '', 'g'), 10) = $1
       LIMIT 1`,
      [phone10]
    );

    if (clientRes.rows.length === 0) {
      return NextResponse.json({
        success: true,
        matched: false,
        sender: fromPhone,
        replyMessage: `Hello from ${DEFAULT_FIRM_BRANDING.firmName}. Your mobile number is not registered in our client directory. Please contact our firm desk.`,
      });
    }

    const client = clientRes.rows[0];
    const firmId = client.firm_id;
    const clientId = client.id;
    const clientName = client.entity_name;
    const messageType = message.type || payload.type || "text";
    const textBody = String(message.text?.body || message.body || "");

    let replyText = "";
    let advancedTasksCount = 0;
    let savedDocName: string | undefined;

    if (messageType === "document" || messageType === "image") {
      const docName = String(message.document?.filename || payload.fileName || `WhatsApp_Intake_${Date.now()}.pdf`).slice(0, 255);
      const isBankStatement =
        docName.toLowerCase().includes("stmt") ||
        docName.toLowerCase().includes("bank") ||
        docName.toLowerCase().includes("statement");
      const category = isBankStatement ? "BANK_STATEMENT" : "GST_INVOICES";

      await pool.query(
        `INSERT INTO public.documents (
          firm_id, entity_id, category, file_name, file_size_bytes, financial_year, review_status
        ) VALUES ($1, $2, $3::document_category, $4, 1433600, 'FY 2026-27', 'PENDING_REVIEW')`,
        [firmId, clientId, category, docName]
      );
      savedDocName = docName;

      const advRes = await pool.query(
        `UPDATE public.compliance_tasks
         SET status = 'IN_PREPARATION'::workflow_status, updated_at = now()
         WHERE firm_id = $1 AND entity_id = $2 AND status = 'DOCUMENTS_AWAITED'
         RETURNING id`,
        [firmId, clientId]
      );
      advancedTasksCount = advRes.rows.length;

      await appendPgAuditLog({
        firmId,
        actorName: "WhatsApp Automation Desk",
        actorRole: "CLIENT",
        entityId: clientId,
        entityName: clientName,
        action: "DOCUMENT_UPLOAD",
        details: `Inbound WhatsApp document '${docName}' received from +${fromPhone}. Tasks advanced: ${advancedTasksCount}`,
        category: "WHATSAPP",
      });

      await upsertWorkspaceRecord({
        firmId,
        entityId: clientId,
        recordType: "NOTIFICATION",
        payload: {
          id: `NOTIF-WA-${Date.now()}`,
          title: `Vault Ingestion: ${docName} Received`,
          message: `Document uploaded via WhatsApp for ${clientName} and queued for review.`,
          category: "DOCUMENT",
          priority: "NORMAL",
          recipientRole: "CLIENT",
          recipientEntityId: clientId,
          targetTab: "vault",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      });

      replyText = `Document *${docName}* received for *${clientName}* and routed to your Compliance Vault.`;
    } else {
      const upper = textBody.toUpperCase();
      if (upper.includes("PAID") || upper.includes("UTR") || upper.includes("UPI")) {
        const match = textBody.match(/(?:UTR|UPI|REF|NO)?[:\s-]*([A-Za-z0-9]{6,30})/i);
        const extractedUtr = match && match[1] ? match[1] : null;

        if (extractedUtr) {
          // NEVER mark PAID or unlock Pay-to-Release from WhatsApp text — always UTR_SUBMITTED for partner verification
          const upd = await pool.query(
            `UPDATE public.invoices
             SET status = 'UTR_SUBMITTED',
                 client_utr_number = $1,
                 client_payment_mode = 'UPI',
                 client_payment_date = CURRENT_DATE,
                 client_payer_note = 'Submitted via WhatsApp; awaiting partner bank verification.'
             WHERE firm_id = $2 AND entity_id = $3 AND status IN ('PENDING', 'OVERDUE')
             RETURNING invoice_no, total_amount`,
            [extractedUtr, firmId, clientId]
          );

          await appendPgAuditLog({
            firmId,
            actorName: client.primary_contact_name || clientName,
            actorRole: "CLIENT",
            entityId: clientId,
            entityName: clientName,
            action: "Payment Reference Submitted",
            details: `WhatsApp UTR '${extractedUtr}' recorded for ${upd.rows.length} invoice(s). Pending partner bank verification.`,
            category: "INVOICE",
          });

          if (upd.rows.length > 0) {
            await upsertWorkspaceRecord({
              firmId,
              entityId: clientId,
              recordType: "NOTIFICATION",
              payload: {
                id: `NOTIF-WA-UTR-${Date.now()}`,
                title: `WhatsApp UTR Pending Verification: ${clientName}`,
                message: `Client reported UTR ${extractedUtr} via WhatsApp for Invoice #${upd.rows[0].invoice_no}. Please verify bank credit before unlocking deliverables.`,
                category: "BILLING",
                priority: "HIGH",
                recipientRole: "PARTNER",
                recipientEntityId: clientId,
                targetTab: "pay-to-release",
                isRead: false,
                createdAt: new Date().toISOString(),
              },
            });
            replyText = `Thank you! Payment UTR *${extractedUtr}* for *${clientName}* has been submitted for partner bank verification. Deliverables will unlock once credited.`;
          } else {
            replyText = `Thank you! Reference *${extractedUtr}* logged for *${clientName}*. No pending invoices found.`;
          }
        } else {
          replyText = `Please include your 12-digit UTR/UPI reference number so we can submit it for bank verification.`;
        }
      } else {
        replyText = `Hello from *${client.firm_name || DEFAULT_FIRM_BRANDING.firmName}*. Your message for *${clientName}* has been received.`;
      }
    }

    return NextResponse.json({
      success: true,
      matched: true,
      sender: fromPhone,
      clientName,
      messageType,
      tasksAdvanced: advancedTasksCount,
      savedDocument: savedDocName,
      replyMessage: replyText,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed." }, { status: 500 });
  }
}
