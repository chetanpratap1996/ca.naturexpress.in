import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { PayToReleaseConfig, PaymentReleaseReceipt, UtrReconciliationRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const db = ensureDatabase();
    const searchParams = request.nextUrl.searchParams;
    const entityId = searchParams.get("entityId");

    if (entityId) {
      const config = db.payToReleaseConfigs?.find((c) => c.entityId === entityId) || {
        entityId,
        isLocked: false,
        totalOutstandingAmount: 0,
        oldestInvoiceDays: 0,
        gracePeriodDays: 30,
        blockedDeliverables: [],
        instantUpiVpa: db.firmMetrics.firmUpiVpa,
        merchantName: db.firmMetrics.name,
        lockReason: "Account in good standing."
      };
      return NextResponse.json({ success: true, config });
    }

    // Extract pending UTR submissions for maker-checker reconciliation
    const pendingUtrs: UtrReconciliationRecord[] = (db.invoices || [])
      .filter((inv) => inv.status === "UTR_SUBMITTED")
      .map((inv) => ({
        id: `UTR-REC-${inv.id}`,
        entityId: inv.entityId,
        clientName: inv.entityName,
        invoiceId: inv.id,
        invoiceNo: inv.invoiceNo,
        amount: inv.amount,
        clientUtrNumber: inv.clientUtrNumber || "N/A",
        clientPaymentMode: inv.clientPaymentMode || "NEFT_RTGS",
        clientPaymentDate: inv.clientPaymentDate || new Date().toISOString().split("T")[0],
        clientPayerNote: inv.clientPayerNote,
        status: "PENDING",
        submittedAt: inv.clientPaymentDate || new Date().toISOString()
      }));

    return NextResponse.json({ 
      success: true, 
      configs: db.payToReleaseConfigs || [],
      pendingUtrs,
      firmMetrics: db.firmMetrics 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    const db = ensureDatabase();
    const body = await request.json();
    const { 
      action, 
      entityId, 
      invoiceId, 
      partnerName, 
      utrRef, 
      amountPaid, 
      paymentMode, 
      reason, 
      durationHours, 
      tdsRate, 
      gracePeriodDays,
      note 
    } = body;

    if (!entityId && action !== "UPDATE_POLICY") {
      return NextResponse.json({ success: false, error: "entityId is required" }, { status: 400 });
    }

    // Role-based verification: Clients can only trigger payment or UTR submission for their own entity
    if (auth.isAuthenticated && auth.role === "CLIENT") {
      if (auth.clientEntityId && auth.clientEntityId !== entityId) {
        return NextResponse.json({ success: false, error: "Forbidden: You cannot modify gate status for other client entities." }, { status: 403 });
      }
      if (action !== "INSTANT_PAYMENT_RELEASE" && action !== "SUBMIT_CLIENT_UTR") {
        return NextResponse.json({ success: false, error: "Clients can only submit payments or UTR references." }, { status: 403 });
      }
    }

    const client = db.clients.find((c) => c.id === entityId);
    const clientName = client ? client.name : entityId;

    if (!db.payToReleaseConfigs) {
      db.payToReleaseConfigs = [];
    }

    let configIndex = db.payToReleaseConfigs.findIndex((c) => c.entityId === entityId);
    if (configIndex === -1 && entityId) {
      db.payToReleaseConfigs.push({
        entityId,
        isLocked: false,
        totalOutstandingAmount: 0,
        oldestInvoiceDays: 0,
        gracePeriodDays: 30,
        blockedDeliverables: ["FORM_3CD_PDF", "BALANCE_SHEET_SIGNED", "ITR_ACKNOWLEDGMENT"],
        instantUpiVpa: db.firmMetrics.firmUpiVpa,
        merchantName: db.firmMetrics.name,
        lockReason: "Initial default configuration"
      });
      configIndex = db.payToReleaseConfigs.length - 1;
    }

    // ACTION 1: INSTANT PAYMENT RELEASE (Dynamic UPI / NPCI Webhook)
    if (action === "INSTANT_PAYMENT_RELEASE") {
      const currentConfig = db.payToReleaseConfigs[configIndex];
      const clearedAmount = amountPaid || currentConfig.totalOutstandingAmount;

      // Mark invoices as PAID
      if (db.invoices) {
        db.invoices = db.invoices.map((inv) => {
          if (inv.entityId === entityId && inv.status !== "PAID") {
            return {
              ...inv,
              status: "PAID",
              clientUtrNumber: utrRef || `UPI-${Date.now().toString().slice(-8)}`,
              clientPaymentDate: new Date().toISOString(),
              clientPaymentMode: paymentMode || "UPI",
              reconciledBy: "AUTOPAY_GATEKEEPER",
              reconciledAt: new Date().toISOString()
            };
          }
          return inv;
        });
      }

      // Unlock entity deliverables
      db.payToReleaseConfigs[configIndex] = {
        ...currentConfig,
        isLocked: false,
        totalOutstandingAmount: Math.max(0, currentConfig.totalOutstandingAmount - clearedAmount),
        lockReason: `Fee of ₹${clearedAmount.toLocaleString("en-IN")} cleared on ${new Date().toLocaleDateString("en-IN")}. Deliverables unlocked.`
      };

      // Create payment receipt
      const receipt: PaymentReleaseReceipt = {
        transactionId: `TXN-${Date.now().toString().slice(-6)}`,
        invoiceIds: db.invoices.filter((i) => i.entityId === entityId).map((i) => i.id),
        amountPaid: clearedAmount,
        paymentMode: (paymentMode as any) || "UPI_DYNAMIC",
        utrRef: utrRef || `UPI-${Date.now().toString().slice(-8)}`,
        releasedAt: new Date().toISOString(),
        releasedDeliverables: currentConfig.blockedDeliverables as string[],
        autoReceiptPdfUrl: `/api/billing/receipt?txn=${Date.now()}`
      };

      await logAuditEvent(
        auth.userName || "Client Auto-Release Bot",
        auth.role || "SYSTEM",
        clientName,
        "Pay-to-Release Fee Clearance",
        `Cleared ₹${clearedAmount.toLocaleString("en-IN")} via ${paymentMode || "UPI"}. Deliverables instantly unlocked for client download.`,
        "PAY_RELEASE"
      );

      await createNotification({
        title: `Deliverables Unlocked: ${clientName}`,
        message: `₹${clearedAmount.toLocaleString("en-IN")} received via ${paymentMode || "UPI"}. Deliverables (Audit Reports, Form 3CD, ITR) are now unlocked for download.`,
        category: "BILLING",
        priority: "HIGH",
        targetRoles: ["SUPER_ADMIN", "PARTNER", "CLIENT"],
        entityId: entityId,
        link: "/client",
        actionLabel: "View Deliverables",
        metadata: { utr: utrRef, clearedAmount }
      });

      await saveDatabase(db);

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from("invoices")
            .update({
              status: "PAID",
              client_utr_number: utrRef || `UPI-${Date.now().toString().slice(-8)}`,
              client_payment_mode: paymentMode || "UPI",
              client_payment_date: new Date().toISOString().split("T")[0],
              reconciled_at: new Date().toISOString()
            })
            .eq("entity_id", entityId)
            .neq("status", "PAID");
        } catch (sbErr) {
          console.warn("Supabase pay-to-release invoice sync warning:", sbErr);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: "Payment processed and deliverables released", 
        receipt, 
        config: db.payToReleaseConfigs[configIndex] 
      });
    }

    // ACTION 2: CLIENT SUBMIT UTR (RTGS / NEFT / IMPS)
    if (action === "SUBMIT_CLIENT_UTR") {
      if (!utrRef) {
        return NextResponse.json({ success: false, error: "12-digit UTR Reference Number is required" }, { status: 400 });
      }

      // Update matching invoice status to UTR_SUBMITTED
      let targetInvoiceNo = "";
      if (db.invoices) {
        db.invoices = db.invoices.map((inv) => {
          if (inv.entityId === entityId && (invoiceId ? inv.id === invoiceId : inv.status !== "PAID")) {
            targetInvoiceNo = inv.invoiceNo;
            return {
              ...inv,
              status: "UTR_SUBMITTED",
              clientUtrNumber: utrRef,
              clientPaymentMode: paymentMode || "NEFT_RTGS",
              clientPaymentDate: new Date().toISOString(),
              clientPayerNote: note || "Client reported bank transfer. Pending CA firm reconciliation."
            };
          }
          return inv;
        });
      }

      await logAuditEvent(
        auth.userName || clientName,
        "CLIENT",
        clientName,
        "Client Payment UTR Submitted",
        `Submitted UTR: ${utrRef} for invoice ${targetInvoiceNo || "overdue balance"}. Pending bank verification.`,
        "PAY_RELEASE"
      );

      await createNotification({
        title: `Payment UTR Submitted: ${clientName}`,
        message: `${clientName} reported transfer of ₹${amountPaid || "overdue balance"} via ${paymentMode || "RTGS"} (UTR: ${utrRef}). Please verify against bank statement.`,
        category: "BILLING",
        priority: "HIGH",
        targetRoles: ["SUPER_ADMIN", "PARTNER", "ARTICLE"],
        entityId: entityId,
        link: "/admin?tab=pay-to-release",
        actionLabel: "Reconcile UTR",
        metadata: { utr: utrRef, entityId }
      });

      await saveDatabase(db);
      return NextResponse.json({ success: true, message: "UTR submitted successfully. CA firm desk notified for verification." });
    }

    // ACTION 3: RECONCILE UTR (Maker-Checker Verification by Partner/Staff)
    if (action === "RECONCILE_UTR") {
      const currentConfig = db.payToReleaseConfigs[configIndex];
      let reconciledSum = 0;

      if (db.invoices) {
        db.invoices = db.invoices.map((inv) => {
          if (inv.entityId === entityId && (invoiceId ? inv.id === invoiceId : inv.status === "UTR_SUBMITTED")) {
            reconciledSum += inv.amount;
            return {
              ...inv,
              status: "PAID",
              reconciledBy: partnerName || auth.userName || "CA Gunjan Jain",
              reconciledAt: new Date().toISOString()
            };
          }
          return inv;
        });
      }

      // Unlock entity deliverables
      db.payToReleaseConfigs[configIndex] = {
        ...currentConfig,
        isLocked: false,
        totalOutstandingAmount: Math.max(0, currentConfig.totalOutstandingAmount - reconciledSum),
        lockReason: `Bank credit verified for UTR ${utrRef || "RTGS"}. Deliverables released.`
      };

      await logAuditEvent(
        partnerName || auth.userName || "CA Gunjan Jain",
        "PARTNER",
        clientName,
        "UTR Bank Credit Reconciled",
        `Verified bank credit for UTR ${utrRef}. ₹${reconciledSum.toLocaleString("en-IN")} cleared. Deliverables released.`,
        "PAY_RELEASE"
      );

      await createNotification({
        title: `Deliverables Released: ${clientName}`,
        message: `Your payment via UTR ${utrRef} has been verified by the partner. All statutory audit deliverables are now available for download.`,
        category: "BILLING",
        priority: "HIGH",
        targetRoles: ["CLIENT"],
        entityId: entityId,
        link: "/client",
        actionLabel: "Download Documents"
      });

      await saveDatabase(db);
      return NextResponse.json({ 
        success: true, 
        message: "UTR reconciled and deliverables released", 
        config: db.payToReleaseConfigs[configIndex] 
      });
    }

    // ACTION 4: REJECT UTR (If bogus or not credited)
    if (action === "REJECT_UTR") {
      if (db.invoices) {
        db.invoices = db.invoices.map((inv) => {
          if (inv.entityId === entityId && (invoiceId ? inv.id === invoiceId : inv.status === "UTR_SUBMITTED")) {
            return {
              ...inv,
              status: "OVERDUE",
              clientPayerNote: `UTR Rejected: ${reason || "Credit not reflected in firm ICICI Bank account"}`
            };
          }
          return inv;
        });
      }

      await logAuditEvent(
        partnerName || auth.userName || "CA Gunjan Jain",
        "PARTNER",
        clientName,
        "UTR Reconciliation Rejected",
        `Rejected UTR ${utrRef}. Reason: ${reason || "Bank credit mismatch"}. Deliverable lock maintained.`,
        "PAY_RELEASE"
      );

      await createNotification({
        title: `Payment Verification Unsuccessful: ${clientName}`,
        message: `The submitted UTR ${utrRef} could not be verified in the firm bank account. Reason: ${reason || "Credit mismatch"}. Deliverables remain gated.`,
        category: "BILLING",
        priority: "HIGH",
        targetRoles: ["CLIENT"],
        entityId: entityId,
        link: "/client",
        actionLabel: "View Bill"
      });

      await saveDatabase(db);
      return NextResponse.json({ success: true, message: "UTR rejected and client notified." });
    }

    // ACTION 5: TIME-BOUND PARTNER OVERRIDE UNLOCK
    if (action === "PARTNER_OVERRIDE_UNLOCK") {
      const currentConfig = db.payToReleaseConfigs[configIndex];
      const hours = durationHours || 48; // Default 48h emergency window
      const expiryDate = new Date(Date.now() + hours * 3600 * 1000).toISOString();

      db.payToReleaseConfigs[configIndex] = {
        ...currentConfig,
        isLocked: false,
        partnerOverrideUntil: expiryDate,
        partnerOverrideReason: reason || "Emergency partner authorization for board meeting / bank loan pack",
        partnerOverrideBy: partnerName || auth.userName || "CA Gunjan Jain",
        lockReason: `Partner Override by ${partnerName || "CA Gunjan Jain"} active until ${new Date(expiryDate).toLocaleString("en-IN")}. Reason: ${reason || "Temporary exception authorized"}`
      };

      await logAuditEvent(
        partnerName || auth.userName || "CA Gunjan Jain",
        "PARTNER",
        clientName,
        "Partner Lock Override (ICAI SA 210)",
        `Partner authorized ${hours}h emergency unlock. Expiry: ${new Date(expiryDate).toLocaleString("en-IN")}. Justification: ${reason || "Board meeting requirement"}`,
        "PAY_RELEASE"
      );

      await createNotification({
        title: `Partner Override Active: ${clientName}`,
        message: `Emergency download access authorized for ${hours} hours under ICAI SA 210 protocol.`,
        category: "BILLING",
        priority: "MEDIUM",
        targetRoles: ["SUPER_ADMIN", "PARTNER"],
        entityId: entityId,
        link: "/admin?tab=pay-to-release"
      });

      await saveDatabase(db);
      return NextResponse.json({ 
        success: true, 
        message: `Partner override active for ${hours} hours`, 
        config: db.payToReleaseConfigs[configIndex] 
      });
    }

    // ACTION 6: SECTION 194J TDS SETTLEMENT (10% TDS Deduction)
    if (action === "APPLY_TDS_SETTLEMENT") {
      const currentConfig = db.payToReleaseConfigs[configIndex];
      const rate = tdsRate || 10; // Default 10% for professional technical services u/s 194J
      const fullAmount = amountPaid || currentConfig.totalOutstandingAmount;
      const tdsAmount = Math.round(fullAmount * (rate / 100));
      const netPayable = fullAmount - tdsAmount;

      db.payToReleaseConfigs[configIndex] = {
        ...currentConfig,
        appliedTdsRate: rate,
        netPayableAmount: netPayable,
        lockReason: `Gross: ₹${fullAmount.toLocaleString("en-IN")} | TDS @${rate}%: ₹${tdsAmount.toLocaleString("en-IN")} | Net Payable: ₹${netPayable.toLocaleString("en-IN")}`
      };

      await saveDatabase(db);
      return NextResponse.json({ 
        success: true, 
        message: `TDS @ ${rate}% calculated. Net payable: ₹${netPayable.toLocaleString("en-IN")}`, 
        config: db.payToReleaseConfigs[configIndex] 
      });
    }

    // ACTION 7: UPDATE GLOBAL LOCK POLICY
    if (action === "UPDATE_POLICY") {
      const days = gracePeriodDays || 30;
      if (db.payToReleaseConfigs) {
        db.payToReleaseConfigs = db.payToReleaseConfigs.map((c) => ({
          ...c,
          gracePeriodDays: days
        }));
      }

      await logAuditEvent(
        partnerName || auth.userName || "CA Gunjan Jain",
        "PARTNER",
        "Firmwide Practice",
        "Lock Policy Threshold Updated",
        `Grace period updated to ${days} days across practice.`,
        "PAY_RELEASE"
      );

      await saveDatabase(db);
      return NextResponse.json({ success: true, message: `Grace period policy updated to ${days} days` });
    }

    // ACTION 8: MANUAL TOGGLE LOCK
    if (action === "TOGGLE_LOCK") {
      const currentConfig = db.payToReleaseConfigs[configIndex];
      const willLock = !currentConfig.isLocked;
      db.payToReleaseConfigs[configIndex] = {
        ...currentConfig,
        isLocked: willLock,
        partnerOverrideUntil: null,
        lockReason: willLock 
          ? `Manually locked by ${partnerName || "Partner"} pending fee settlement` 
          : "Unlocked by Partner"
      };

      await logAuditEvent(
        partnerName || auth.userName || "CA Partner",
        "PARTNER",
        clientName,
        willLock ? "Pay-to-Release Lock Enabled" : "Pay-to-Release Lock Disabled",
        `Deliverables lock status toggled to: ${willLock ? "LOCKED" : "UNLOCKED"}`,
        "PAY_RELEASE"
      );

      await saveDatabase(db);
      return NextResponse.json({ success: true, config: db.payToReleaseConfigs[configIndex] });
    }

    // ACTION 9: RECORD REMINDER LOG
    if (action === "RECORD_REMINDER") {
      const currentConfig = db.payToReleaseConfigs[configIndex];
      db.payToReleaseConfigs[configIndex] = {
        ...currentConfig,
        lastReminderSentAt: new Date().toISOString(),
        reminderCount: (currentConfig.reminderCount || 0) + 1
      };
      await saveDatabase(db);
      return NextResponse.json({ success: true, config: db.payToReleaseConfigs[configIndex] });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
