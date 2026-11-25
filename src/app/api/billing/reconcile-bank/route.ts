import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { reconcileFirmBankStatement } from "@/lib/billing/bankReceiptReconciler";
import { parseBankStatementPdfBuffer } from "@/lib/parsers/bankStatementParser";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  appendPgAuditLog,
  upsertWorkspaceRecord,
} from "@/lib/server/pgHelpers";
import { InvoiceItem, ClientEntity, PayToReleaseConfig } from "@/lib/types";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Partner authorization required for bank reconciliation." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const actorName = auth.userName || DEFAULT_FIRM_BRANDING.managingPartner;
    const actorUuid = auth.user?.id && UUID_REGEX.test(auth.user.id) ? auth.user.id : null;

    const contentType = req.headers.get("content-type") || "";
    let csvContent = "";
    let autoApply = true;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = (formData.get("file") as File | null) || (formData.get("statement") as File | null);
      if (!file) {
        return NextResponse.json({ success: false, error: "No bank statement file uploaded." }, { status: 400 });
      }
      if (file.name.toLowerCase().endsWith(".pdf") || file.type.includes("pdf")) {
        const arrBuf = await file.arrayBuffer();
        const pdfParsed = await parseBankStatementPdfBuffer(Buffer.from(arrBuf));
        if (pdfParsed.success && pdfParsed.transactions.length > 0) {
          csvContent =
            "Date,Narration,ChqRefNo,Withdrawal,Deposit,Balance\n" +
            pdfParsed.transactions
              .map(
                (t) =>
                  `"${t.date}","${t.narration.replace(/"/g, '""')}","${t.chqRefNo || ""}",${t.withdrawal},${t.deposit},${t.balance}`
              )
              .join("\n");
        } else {
          csvContent = await file.text();
        }
      } else {
        csvContent = await file.text();
      }
      const autoApplyVal = formData.get("autoApply");
      if (autoApplyVal !== null) autoApply = autoApplyVal === "true";
    } else {
      const body = await req.json();
      csvContent = body.csvContent || body.content || "";
      if (body.autoApply !== undefined) autoApply = Boolean(body.autoApply);
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Empty bank statement content." }, { status: 400 });
    }

    const [{ rows: entRows }, { rows: invRows }] = await Promise.all([
      pool.query("SELECT * FROM public.client_entities WHERE firm_id = $1", [firmId]),
      pool.query("SELECT * FROM public.invoices WHERE firm_id = $1", [firmId]),
    ]);

    const entMap = new Map(entRows.map((e: any) => [e.id, e]));
    const clients: ClientEntity[] = entRows.map((e: any) => ({
      id: e.id,
      groupId: e.group_id,
      groupName: "",
      name: e.entity_name,
      type: e.type,
      pan: e.pan,
      gstin: e.gstin || undefined,
      turnoverCr: Number(e.turnover_cr || 0),
      incorporationYear: e.incorporation_year || 2024,
      penaltyRiskAccrued: 0,
      partnerInCharge: actorName,
      assignedArticle: "Practice Team",
      primaryContact: {
        name: e.primary_contact_name || "",
        phone: e.primary_contact_phone || "",
        email: e.primary_contact_email || "",
        designation: e.primary_contact_designation || "Director",
      },
    }));

    const invoices: InvoiceItem[] = invRows.map((inv: any) => {
      const e: any = entMap.get(inv.entity_id);
      return {
        id: inv.id,
        invoiceNo: inv.invoice_no,
        entityId: inv.entity_id,
        entityName: e?.entity_name || "Client Entity",
        groupId: e?.group_id || "",
        serviceDescription: inv.service_description,
        taxableAmount: Number(inv.taxable_amount || 0),
        gstRate: Number(inv.gst_rate || 18),
        gstAmount: Number(inv.gst_amount || 0),
        amount: Number(inv.total_amount || 0),
        dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        status: inv.status,
        sacCode: inv.sac_code || "998231",
        clientUtrNumber: inv.client_utr_number || undefined,
      };
    });

    const report = reconcileFirmBankStatement(csvContent, invoices, clients);

    if (autoApply && report.reconciledInvoices.length > 0) {
      for (const match of report.reconciledInvoices) {
        const mode = ["NEFT_RTGS", "UPI", "IMPS", "CHEQUE"].includes(match.paymentMode) ? match.paymentMode : "NEFT_RTGS";
        await pool.query(
          `UPDATE public.invoices
           SET status = 'PAID',
               client_utr_number = $1,
               client_payment_mode = $2::payment_mode,
               client_payment_date = CURRENT_DATE,
               reconciled_by_id = $3,
               reconciled_at = now()
           WHERE id = $4 AND firm_id = $5`,
          [match.utrNumber, mode, actorUuid, match.invoiceId, firmId]
        );

        await appendPgAuditLog({
          firmId,
          actorId: auth.user?.id,
          actorName,
          actorRole: "PARTNER",
          entityId: match.entityId,
          entityName: match.entityName,
          action: "Bank UTR Reconciled",
          details: `Verified bank credit of ₹${match.matchedAmount.toLocaleString("en-IN")} for Invoice #${match.invoiceNo} (UTR: ${match.utrNumber}).`,
          category: "INVOICE",
        });

        await upsertWorkspaceRecord({
          firmId,
          entityId: match.entityId,
          recordType: "NOTIFICATION",
          payload: {
            id: `NOTIF-BANK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: `Fee Payment Reconciled: ₹${match.matchedAmount.toLocaleString("en-IN")}`,
            message: `Bank credit reconciled for Invoice #${match.invoiceNo} (UTR: ${match.utrNumber}). Deliverables unlocked.`,
            category: "BILLING",
            priority: "HIGH",
            recipientRole: "CLIENT",
            recipientEntityId: match.entityId,
            targetTab: "vault",
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        });

        const remRes = await pool.query(
          "SELECT COALESCE(SUM(total_amount), 0)::numeric as remaining FROM public.invoices WHERE firm_id = $1 AND entity_id = $2 AND status <> 'PAID'",
          [firmId, match.entityId]
        );
        const remaining = Number(remRes.rows[0]?.remaining || 0);
        if (remaining === 0) {
          const cfgPayload: PayToReleaseConfig = {
            entityId: match.entityId,
            isLocked: false,
            totalOutstandingAmount: 0,
            oldestInvoiceDays: 0,
            gracePeriodDays: 30,
            blockedDeliverables: [],
            instantUpiVpa: DEFAULT_FIRM_BRANDING.firmUpiVpa,
            merchantName: DEFAULT_FIRM_BRANDING.firmName,
            lockReason: `Cleared via Bank Statement UTR ${match.utrNumber}.`,
          };
          await upsertWorkspaceRecord({
            firmId,
            entityId: match.entityId,
            recordType: "PAY_TO_RELEASE_CONFIG",
            matchKey: "entityId",
            matchValue: match.entityId,
            payload: cfgPayload,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      report,
      clearedCount: report.reconciledInvoices.length,
      realizedInr: report.totalRealizedInr,
      gatewayFeesSavedInr: report.totalGatewayFeesSavedInr,
    });
  } catch (error: any) {
    console.error("Bank statement reconciliation API error:", error);
    return NextResponse.json({ success: false, error: "Failed to process bank statement." }, { status: 500 });
  }
}
