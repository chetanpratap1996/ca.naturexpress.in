import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { PayToReleaseConfig, UtrReconciliationRecord } from "@/lib/types";
import {
  evaluateClientRelationshipTier,
  computeTds194jSettlement,
  GatekeeperDeliverable,
} from "@/lib/billing/tieredGatekeeper";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  appendPgAuditLog,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
} from "@/lib/server/pgHelpers";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const searchParams = request.nextUrl.searchParams;
    const requestedEntityId = searchParams.get("entityId");
    const tierFilter = searchParams.get("tier");

    const effectiveEntityId =
      auth.role === "CLIENT" ? auth.clientEntityId || requestedEntityId : requestedEntityId;

    if (auth.role === "CLIENT" && requestedEntityId && auth.clientEntityId && requestedEntityId !== auth.clientEntityId) {
      return NextResponse.json({ success: false, error: "Forbidden for requested entity." }, { status: 403 });
    }

    const [{ rows: firmRows }, { rows: clientRows }, { rows: invRows }, configRecs] = await Promise.all([
      pool.query("SELECT firm_name, firm_upi_vpa FROM public.firms WHERE id = $1 LIMIT 1", [firmId]),
      auth.role === "CLIENT" && auth.clientEntityId && UUID_REGEX.test(auth.clientEntityId)
        ? pool.query("SELECT * FROM public.client_entities WHERE firm_id = $1 AND id = $2", [firmId, auth.clientEntityId])
        : pool.query("SELECT * FROM public.client_entities WHERE firm_id = $1", [firmId]),
      auth.role === "CLIENT" && auth.clientEntityId && UUID_REGEX.test(auth.clientEntityId)
        ? pool.query("SELECT * FROM public.invoices WHERE firm_id = $1 AND entity_id = $2", [firmId, auth.clientEntityId])
        : pool.query("SELECT * FROM public.invoices WHERE firm_id = $1", [firmId]),
      listWorkspaceRecords<PayToReleaseConfig>(firmId, "PAY_TO_RELEASE_CONFIG", auth.role === "CLIENT" ? auth.clientEntityId : null),
    ]);

    const firm = firmRows[0];
    const firmVpa = firm?.firm_upi_vpa || DEFAULT_FIRM_BRANDING.firmUpiVpa;
    const firmName = firm?.firm_name || DEFAULT_FIRM_BRANDING.firmName;
    const configs: PayToReleaseConfig[] = configRecs.map((r) => r.payload);

    const deliverables: GatekeeperDeliverable[] = [];
    for (const c of clientRows) {
      const clientInvoices = invRows.filter((i: any) => i.entity_id === c.id);
      const config = configs.find((cfg) => cfg.entityId === c.id);
      const clientObj = { id: c.id, name: c.entity_name, type: c.type, turnoverCr: Number(c.turnover_cr || 0) };
      const mappedInvs = clientInvoices.map((inv: any) => ({
        id: inv.id,
        invoiceNo: inv.invoice_no,
        entityId: inv.entity_id,
        amount: Number(inv.total_amount || 0),
        status: inv.status,
        dueDate: inv.due_date,
        serviceDescription: inv.service_description,
      }));
      const tierEval = evaluateClientRelationshipTier(clientObj as any, mappedInvs as any, config);

      for (const inv of mappedInvs) {
        const isOverrideActive = config?.partnerOverrideUntil
          ? new Date(config.partnerOverrideUntil).getTime() > Date.now()
          : false;
        const isPaid = inv.status === "PAID";
        const isLocked = isOverrideActive ? false : config ? config.isLocked : !isPaid && tierEval.recommendedPolicy !== "SOFT_NUDGE";
        const appliedTdsRate = config?.appliedTdsRate ?? 10;
        const netPayable = appliedTdsRate > 0 ? computeTds194jSettlement(inv.amount, appliedTdsRate).netPayableAmount : inv.amount;

        deliverables.push({
          id: `DELIV-${inv.id}`,
          entityId: c.id,
          clientName: c.entity_name,
          deliverableType: inv.serviceDescription?.toLowerCase().includes("audit")
            ? "FORM_3CD_TAX_AUDIT"
            : inv.serviceDescription?.toLowerCase().includes("gst")
            ? "GST_ANNUAL_GSTR9C"
            : ("STATUTORY_COMPLIANCE_PACKAGE" as any),
          title: inv.serviceDescription || `Statutory Package (${inv.invoiceNo})`,
          period: "FY 2025-26",
          invoiceId: inv.id,
          invoiceNo: inv.invoiceNo,
          feeAmount: inv.amount,
          tdsApplicable: true,
          appliedTdsRate,
          netPayableAmount: netPayable,
          realUdin: `PENDING_ISSUANCE_${inv.invoiceNo.slice(-4)}`,
          maskedUdin: isLocked ? "UNLOCKS ON VERIFIED CLEARANCE" : `ISSUED_${inv.invoiceNo.slice(-4)}`,
          watermarkText: isLocked ? "CONFIDENTIAL DRAFT - PENDING PROFESSIONAL CLEARANCE" : "",
          isLocked,
          statutoryDeadline: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "2026-11-30",
          urgencyLevel: isLocked ? "HIGH" : "STANDARD",
          clientTier: tierEval.tier,
          gatePolicy: tierEval.recommendedPolicy,
          partnerOverrideUntil: config?.partnerOverrideUntil || null,
          partnerOverrideBy: config?.partnerOverrideBy || null,
          partnerOverrideReason: config?.partnerOverrideReason || null,
          summaryPreview: {
            heading: `Statutory Package for ${c.entity_name}`,
            keyHighlights: [
              `Prepared by ${firmName}`,
              `Linked Tax Invoice #${inv.invoiceNo} (₹${inv.amount.toLocaleString("en-IN")})`,
            ],
            confidentialNotice: isLocked
              ? "Draft copy for verification. Signed copy unlocks after partner-verified fee settlement."
              : "Certified copy unlocked.",
          },
        });
      }
    }

    if (effectiveEntityId) {
      const entityConfig: PayToReleaseConfig = configs.find((c) => c.entityId === effectiveEntityId) || {
        entityId: effectiveEntityId,
        isLocked: false,
        totalOutstandingAmount: invRows
          .filter((i: any) => i.entity_id === effectiveEntityId && i.status !== "PAID")
          .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0),
        oldestInvoiceDays: 0,
        gracePeriodDays: 30,
        blockedDeliverables: ["FORM_3CD_PDF", "BALANCE_SHEET_SIGNED", "ITR_ACKNOWLEDGMENT"],
        instantUpiVpa: firmVpa,
        merchantName: firmName,
        lockReason: "Account status verified.",
      };
      const entityDeliverables = deliverables.filter((d) => d.entityId === effectiveEntityId);
      const clientRow = clientRows.find((c: any) => c.id === effectiveEntityId);
      const clientInvs = invRows.filter((i: any) => i.entity_id === effectiveEntityId);
      const tierEval = evaluateClientRelationshipTier(
        { id: effectiveEntityId, name: clientRow?.entity_name || effectiveEntityId } as any,
        clientInvs.map((i: any) => ({ ...i, amount: Number(i.total_amount || 0) })) as any,
        entityConfig
      );
      return NextResponse.json({
        success: true,
        config: entityConfig,
        tierEvaluation: tierEval,
        deliverables: entityDeliverables,
      });
    }

    if (auth.role === "CLIENT") {
      return NextResponse.json({ success: false, error: "Client entity scope required." }, { status: 403 });
    }

    const pendingUtrs: UtrReconciliationRecord[] = invRows
      .filter((inv: any) => inv.status === "UTR_SUBMITTED")
      .map((inv: any) => {
        const clientRow = clientRows.find((c: any) => c.id === inv.entity_id);
        return {
          id: `UTR-REC-${inv.id}`,
          entityId: inv.entity_id,
          clientName: clientRow?.entity_name || "Client Entity",
          invoiceId: inv.id,
          invoiceNo: inv.invoice_no,
          amount: Number(inv.total_amount || 0),
          clientUtrNumber: inv.client_utr_number || "N/A",
          clientPaymentMode: inv.client_payment_mode || "NEFT_RTGS",
          clientPaymentDate: inv.client_payment_date ? new Date(inv.client_payment_date).toISOString().split("T")[0] : "",
          clientPayerNote: inv.client_payer_note || undefined,
          status: "PENDING",
          submittedAt: inv.client_payment_date ? new Date(inv.client_payment_date).toISOString() : new Date().toISOString(),
        };
      });

    const filteredDeliverables = tierFilter
      ? deliverables.filter((d) => d.clientTier === tierFilter)
      : deliverables;

    return NextResponse.json({
      success: true,
      deliverables: filteredDeliverables,
      configs,
      pendingUtrs,
    });
  } catch (error: any) {
    console.error("GET /api/pay-to-release error:", error);
    return NextResponse.json({ success: false, error: "Failed to load Pay-to-Release state." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const body = await request.json();
    const {
      action,
      entityId,
      invoiceId,
      utrRef,
      amountPaid,
      paymentMode,
      reason,
      durationHours,
      tdsRate,
      gracePeriodDays,
      note,
    } = body;

    if (!entityId && action !== "UPDATE_POLICY") {
      return NextResponse.json({ success: false, error: "entityId is required." }, { status: 400 });
    }

    // Strict client restrictions: clients may ONLY submit a UTR reference for their own entity
    if (auth.role === "CLIENT") {
      if (!auth.clientEntityId || auth.clientEntityId !== entityId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot modify gate status for other client entities." },
          { status: 403 }
        );
      }
      if (action === "INSTANT_PAYMENT_RELEASE") {
        return NextResponse.json(
          {
            success: false,
            error: "Automated UPI webhook verification is not configured. Please submit your 12-digit UTR reference for partner bank verification.",
            code: "PAYMENT_GATEWAY_WEBHOOK_REQUIRED",
          },
          { status: 403 }
        );
      }
      if (action !== "SUBMIT_CLIENT_UTR") {
        return NextResponse.json(
          { success: false, error: "Clients may only submit payment UTR references." },
          { status: 403 }
        );
      }
    } else if (auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Managing Partner privileges required for Pay-to-Release operations." },
        { status: 403 }
      );
    }

    let clientName = "Firmwide Practice";
    if (entityId) {
      if (!UUID_REGEX.test(String(entityId))) {
        return NextResponse.json({ success: false, error: "Invalid entityId." }, { status: 400 });
      }
      const entRes = await pool.query(
        "SELECT id, entity_name FROM public.client_entities WHERE id = $1 AND firm_id = $2 LIMIT 1",
        [entityId, firmId]
      );
      if (entRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Client entity not found in your firm." }, { status: 404 });
      }
      clientName = entRes.rows[0].entity_name;
    }

    const existingRecs = entityId
      ? await listWorkspaceRecords<PayToReleaseConfig>(firmId, "PAY_TO_RELEASE_CONFIG", entityId)
      : [];
    let currentConfig: PayToReleaseConfig = existingRecs[0]?.payload || {
      entityId: entityId || "",
      isLocked: false,
      totalOutstandingAmount: 0,
      oldestInvoiceDays: 0,
      gracePeriodDays: 30,
      blockedDeliverables: ["FORM_3CD_PDF", "BALANCE_SHEET_SIGNED", "ITR_ACKNOWLEDGMENT"],
      instantUpiVpa: DEFAULT_FIRM_BRANDING.firmUpiVpa,
      merchantName: DEFAULT_FIRM_BRANDING.firmName,
      lockReason: "Default configuration",
    };

    // ACTION: CLIENT SUBMIT UTR (Always awaits Partner verification; NEVER marks PAID)
    if (action === "SUBMIT_CLIENT_UTR") {
      const cleanUtr = typeof utrRef === "string" ? utrRef.trim() : "";
      if (!/^[A-Za-z0-9-]{6,40}$/.test(cleanUtr)) {
        return NextResponse.json({ success: false, error: "A valid 6-40 character UTR Reference Number is required." }, { status: 400 });
      }

      const mode = ["NEFT_RTGS", "UPI", "IMPS", "CHEQUE"].includes(paymentMode) ? paymentMode : "UPI";
      const upd = invoiceId && UUID_REGEX.test(String(invoiceId))
        ? await pool.query(
            `UPDATE public.invoices
             SET status = 'UTR_SUBMITTED', client_utr_number = $1, client_payment_mode = $2::payment_mode,
                 client_payment_date = CURRENT_DATE, client_payer_note = $3
             WHERE id = $4 AND firm_id = $5 AND entity_id = $6 AND status IN ('PENDING', 'OVERDUE', 'UTR_SUBMITTED')
             RETURNING invoice_no`,
            [cleanUtr, mode, (note || "Submitted by client; awaiting bank reconciliation.").slice(0, 500), invoiceId, firmId, entityId]
          )
        : await pool.query(
            `UPDATE public.invoices
             SET status = 'UTR_SUBMITTED', client_utr_number = $1, client_payment_mode = $2::payment_mode,
                 client_payment_date = CURRENT_DATE, client_payer_note = $3
             WHERE firm_id = $4 AND entity_id = $5 AND status IN ('PENDING', 'OVERDUE')
             RETURNING invoice_no`,
            [cleanUtr, mode, (note || "Submitted by client; awaiting bank reconciliation.").slice(0, 500), firmId, entityId]
          );

      if (upd.rows.length === 0) {
        return NextResponse.json({ success: false, error: "No pending/overdue invoice found to attach UTR." }, { status: 400 });
      }

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || clientName,
        actorRole: auth.role,
        entityId,
        entityName: clientName,
        action: "Client Payment UTR Submitted",
        details: `Submitted UTR ${cleanUtr} (${mode}) for ${upd.rows.map((r: any) => r.invoice_no).join(", ")}. Pending bank verification.`,
        category: "PAY_RELEASE",
      });

      await upsertWorkspaceRecord({
        firmId,
        entityId,
        recordType: "NOTIFICATION",
        payload: {
          id: `NOTIF-UTR-${Date.now()}`,
          title: `Payment UTR Submitted: ${clientName}`,
          message: `${clientName} submitted UTR ${cleanUtr} via ${mode}. Please verify against firm bank statement before releasing deliverables.`,
          category: "BILLING",
          priority: "HIGH",
          recipientRole: "PARTNER",
          recipientEntityId: entityId,
          targetTab: "pay-to-release",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        status: "UTR_SUBMITTED",
        message: "UTR submitted successfully. Partner bank verification required before deliverables unlock.",
      });
    }

    // PARTNER-ONLY ACTIONS BELOW
    if (action === "RECONCILE_UTR" || action === "INSTANT_PAYMENT_RELEASE") {
      const actorUuid = auth.user?.id && UUID_REGEX.test(auth.user.id) ? auth.user.id : null;
      const cleanUtr = typeof utrRef === "string" && utrRef.trim() ? utrRef.trim() : null;
      const upd = invoiceId && UUID_REGEX.test(String(invoiceId))
        ? await pool.query(
            `UPDATE public.invoices
             SET status = 'PAID',
                 client_utr_number = COALESCE($1, client_utr_number),
                 reconciled_by_id = $2,
                 reconciled_at = now()
             WHERE id = $3 AND firm_id = $4 AND entity_id = $5
             RETURNING total_amount`,
            [cleanUtr, actorUuid, invoiceId, firmId, entityId]
          )
        : await pool.query(
            `UPDATE public.invoices
             SET status = 'PAID',
                 client_utr_number = COALESCE($1, client_utr_number),
                 reconciled_by_id = $2,
                 reconciled_at = now()
             WHERE firm_id = $3 AND entity_id = $4 AND status IN ('UTR_SUBMITTED', 'PENDING', 'OVERDUE')
             RETURNING total_amount`,
            [cleanUtr, actorUuid, firmId, entityId]
          );

      const reconciledSum = upd.rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);
      const remRes = await pool.query(
        "SELECT COALESCE(SUM(total_amount), 0)::numeric as remaining FROM public.invoices WHERE firm_id = $1 AND entity_id = $2 AND status <> 'PAID'",
        [firmId, entityId]
      );
      const remaining = Number(remRes.rows[0]?.remaining || 0);

      currentConfig = {
        ...currentConfig,
        isLocked: remaining > 0 ? currentConfig.isLocked : false,
        totalOutstandingAmount: remaining,
        partnerOverrideUntil: null,
        lockReason: `Verified settlement of ₹${reconciledSum.toLocaleString("en-IN")} by ${auth.userName || "Partner"}.`,
      };
      await upsertWorkspaceRecord({
        firmId,
        entityId,
        recordType: "PAY_TO_RELEASE_CONFIG",
        matchKey: "entityId",
        matchValue: entityId,
        payload: currentConfig,
      });

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Firm Partner",
        actorRole: "PARTNER",
        entityId,
        entityName: clientName,
        action: "UTR Bank Credit Reconciled",
        details: `Verified bank credit (₹${reconciledSum.toLocaleString("en-IN")}${cleanUtr ? `, UTR: ${cleanUtr}` : ""}). Deliverables released.`,
        category: "PAY_RELEASE",
      });

      return NextResponse.json({ success: true, message: "Settlement verified and deliverables released.", config: currentConfig });
    }

    if (action === "REJECT_UTR") {
      await pool.query(
        `UPDATE public.invoices
         SET status = 'OVERDUE',
             client_payer_note = $1
         WHERE firm_id = $2 AND entity_id = $3 AND status = 'UTR_SUBMITTED'`,
        [`UTR Rejected: ${reason || "Credit not reflected in firm bank account"}`, firmId, entityId]
      );
      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Firm Partner",
        actorRole: "PARTNER",
        entityId,
        entityName: clientName,
        action: "UTR Reconciliation Rejected",
        details: `Rejected UTR ${utrRef || ""}. Reason: ${reason || "Bank credit mismatch"}.`,
        category: "PAY_RELEASE",
      });
      return NextResponse.json({ success: true, message: "UTR rejected and client notified." });
    }

    if (action === "PARTNER_OVERRIDE_UNLOCK") {
      const hours = Number(durationHours) || 48;
      const expiryDate = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      currentConfig = {
        ...currentConfig,
        isLocked: false,
        partnerOverrideUntil: expiryDate,
        partnerOverrideReason: reason || "Emergency partner authorization",
        partnerOverrideBy: auth.userName || "Managing Partner",
        lockReason: `Partner Override by ${auth.userName || "Partner"} active until ${new Date(expiryDate).toLocaleString("en-IN")}.`,
      };
      await upsertWorkspaceRecord({
        firmId,
        entityId,
        recordType: "PAY_TO_RELEASE_CONFIG",
        matchKey: "entityId",
        matchValue: entityId,
        payload: currentConfig,
      });
      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Managing Partner",
        actorRole: "PARTNER",
        entityId,
        entityName: clientName,
        action: "Partner Lock Override (ICAI SA 210)",
        details: `Authorized ${hours}h temporary unlock. Reason: ${reason || "Urgent deadline"}.`,
        category: "PAY_RELEASE",
      });
      return NextResponse.json({ success: true, message: `Partner override active for ${hours} hours.`, config: currentConfig });
    }

    if (action === "APPLY_TDS_SETTLEMENT") {
      const rate = typeof tdsRate === "number" ? tdsRate : 10;
      const fullAmount = Number(amountPaid) || currentConfig.totalOutstandingAmount;
      const settlement = computeTds194jSettlement(fullAmount, rate);
      currentConfig = {
        ...currentConfig,
        appliedTdsRate: rate,
        netPayableAmount: settlement.netPayableAmount,
        lockReason: `Gross: ₹${fullAmount.toLocaleString("en-IN")} | TDS @${rate}% u/s 194J: ₹${settlement.tdsAmount.toLocaleString("en-IN")} | Net Payable: ₹${settlement.netPayableAmount.toLocaleString("en-IN")}`,
      };
      await upsertWorkspaceRecord({
        firmId,
        entityId,
        recordType: "PAY_TO_RELEASE_CONFIG",
        matchKey: "entityId",
        matchValue: entityId,
        payload: currentConfig,
      });
      return NextResponse.json({ success: true, settlement, config: currentConfig });
    }

    if (action === "TOGGLE_LOCK") {
      const willLock = !currentConfig.isLocked;
      currentConfig = {
        ...currentConfig,
        isLocked: willLock,
        partnerOverrideUntil: null,
        lockReason: willLock ? `Manually locked by ${auth.userName || "Partner"}` : "Unlocked by Partner",
      };
      await upsertWorkspaceRecord({
        firmId,
        entityId,
        recordType: "PAY_TO_RELEASE_CONFIG",
        matchKey: "entityId",
        matchValue: entityId,
        payload: currentConfig,
      });
      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Firm Partner",
        actorRole: "PARTNER",
        entityId,
        entityName: clientName,
        action: willLock ? "Pay-to-Release Lock Enabled" : "Pay-to-Release Lock Disabled",
        details: `Deliverables lock status toggled to ${willLock ? "LOCKED" : "UNLOCKED"}.`,
        category: "PAY_RELEASE",
      });
      return NextResponse.json({ success: true, config: currentConfig });
    }

    if (action === "UPDATE_POLICY") {
      const days = Number(gracePeriodDays) || 30;
      const allConfigs = await listWorkspaceRecords<PayToReleaseConfig>(firmId, "PAY_TO_RELEASE_CONFIG");
      for (const rec of allConfigs) {
        await upsertWorkspaceRecord({
          firmId,
          entityId: rec.entity_id,
          recordType: "PAY_TO_RELEASE_CONFIG",
          matchKey: "entityId",
          matchValue: rec.payload.entityId,
          payload: { ...rec.payload, gracePeriodDays: days },
        });
      }
      return NextResponse.json({ success: true, message: `Grace period policy updated to ${days} days.` });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/pay-to-release error:", error);
    return NextResponse.json({ success: false, error: error.message || "Pay-to-Release operation failed." }, { status: 500 });
  }
}
