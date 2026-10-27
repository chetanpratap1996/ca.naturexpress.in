import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { PayToReleaseConfig, PaymentReleaseReceipt } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const db = await ensureDatabase();
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

    return NextResponse.json({ 
      success: true, 
      configs: db.payToReleaseConfigs || [],
      firmMetrics: db.firmMetrics 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Request failed. Refresh the page and try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await ensureDatabase();
    const body = await request.json();
    const { action, entityId, partnerName, utrRef, amountPaid, paymentMode, reason } = body;

    if (!entityId) {
      return NextResponse.json({ success: false, error: "entityId is required" }, { status: 400 });
    }

    const client = db.clients.find((c) => c.id === entityId);
    const clientName = client ? client.name : entityId;

    if (!db.payToReleaseConfigs) {
      db.payToReleaseConfigs = [];
    }

    let configIndex = db.payToReleaseConfigs.findIndex((c) => c.entityId === entityId);
    if (configIndex === -1) {
      db.payToReleaseConfigs.push({
        entityId,
        isLocked: false,
        totalOutstandingAmount: 0,
        oldestInvoiceDays: 0,
        gracePeriodDays: 30,
        blockedDeliverables: ["FORM_3CD_PDF", "ITR_ACKNOWLEDGMENT"],
        instantUpiVpa: db.firmMetrics.firmUpiVpa,
        merchantName: db.firmMetrics.name,
        lockReason: "Initial default configuration"
      });
      configIndex = db.payToReleaseConfigs.length - 1;
    }

    if (action === "INSTANT_PAYMENT_RELEASE") {
      // Client paid via Dynamic UPI or Verified UTR
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
        paymentMode: paymentMode || "UPI_DYNAMIC",
        utrRef: utrRef || `UPI-${Date.now().toString().slice(-8)}`,
        releasedAt: new Date().toISOString(),
        releasedDeliverables: currentConfig.blockedDeliverables,
        autoReceiptPdfUrl: `/api/billing/receipt?txn=${Date.now()}`
      };

      await logAuditEvent(
        "Client Auto-Release Bot",
        "SYSTEM",
        clientName,
        "Pay-to-Release Fee Clearance",
        `Cleared ₹${clearedAmount.toLocaleString("en-IN")} via ${paymentMode || "UPI"}. Deliverables instantly unlocked for client download.`,
        "PAY_RELEASE",
      db
      );

      await saveDatabase(db);
      return NextResponse.json({ success: true, message: "Payment processed and deliverables released", receipt, config: db.payToReleaseConfigs[configIndex] });
    }

    if (action === "PARTNER_OVERRIDE_UNLOCK") {
      // CA Partner explicitly overrides the lock (e.g. relationship client)
      const currentConfig = db.payToReleaseConfigs[configIndex];
      db.payToReleaseConfigs[configIndex] = {
        ...currentConfig,
        isLocked: false,
        lockReason: `Partner Override by ${partnerName || "CA Gunjan Jain"}: ${reason || "Grace period extended for board meeting"}`
      };

      await logAuditEvent(
        partnerName || "CA Gunjan Jain",
        "PARTNER",
        clientName,
        "Partner Lock Override",
        `Partner manually unlocked deliverables. Reason: ${reason || "Temporary waiver authorized"}`,
        "PAY_RELEASE",
      db
      );

      await saveDatabase(db);
      return NextResponse.json({ success: true, message: "Partner override successful", config: db.payToReleaseConfigs[configIndex] });
    }

    if (action === "TOGGLE_LOCK") {
      const currentConfig = db.payToReleaseConfigs[configIndex];
      const willLock = !currentConfig.isLocked;
      db.payToReleaseConfigs[configIndex] = {
        ...currentConfig,
        isLocked: willLock,
        lockReason: willLock 
          ? `Manually locked by ${partnerName || "Partner"} pending fee settlement` 
          : "Unlocked by Partner"
      };

      await logAuditEvent(
        partnerName || "CA Partner",
        "PARTNER",
        clientName,
        willLock ? "Pay-to-Release Lock Enabled" : "Pay-to-Release Lock Disabled",
        `Deliverables lock status toggled to: ${willLock ? "LOCKED" : "UNLOCKED"}`,
        "PAY_RELEASE",
      db
      );

      await saveDatabase(db);
      return NextResponse.json({ success: true, config: db.payToReleaseConfigs[configIndex] });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Request failed. Refresh the page and try again." }, { status: 500 });
  }
}