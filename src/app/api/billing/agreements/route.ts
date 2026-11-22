import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent, createNotification } from "@/lib/server/db";
import {
  SAMPLE_ENGAGEMENT_AGREEMENTS,
  SAMPLE_SCOPE_CREEP_INCIDENTS,
  SAMPLE_DYNAMIC_MICRO_BILLS,
  EngagementAgreement,
  ScopeCreepIncident,
  DynamicMicroBill,
  calculateVolumeOverageBilling,
  generateMicroApprovalWhatsAppMessage
} from "@/lib/billing/scopeCreepEngine";
import { generateNpciDynamicUpiUri, generateUpiQrDataUrl } from "@/lib/billing/npciUpiEngine";

export async function GET(request: NextRequest) {
  try {
    const db = ensureDatabase();
    const searchParams = request.nextUrl.searchParams;
    const entityId = searchParams.get("entityId");
    const statusFilter = searchParams.get("status");

    // Initialize in-memory / db structures if not present
    if (!(db as any).engagementAgreements) {
      (db as any).engagementAgreements = SAMPLE_ENGAGEMENT_AGREEMENTS;
    }
    if (!(db as any).scopeCreepIncidents) {
      (db as any).scopeCreepIncidents = SAMPLE_SCOPE_CREEP_INCIDENTS;
    }
    if (!(db as any).dynamicMicroBills) {
      (db as any).dynamicMicroBills = SAMPLE_DYNAMIC_MICRO_BILLS;
    }

    let agreements: EngagementAgreement[] = (db as any).engagementAgreements;
    let incidents: ScopeCreepIncident[] = (db as any).scopeCreepIncidents;
    let microBills: DynamicMicroBill[] = (db as any).dynamicMicroBills;

    // Filter by entity if requested
    if (entityId) {
      agreements = agreements.filter((a) => a.entityId === entityId);
      incidents = incidents.filter((i) => i.entityId === entityId);
      microBills = microBills.filter((m) => m.entityId === entityId);
    }

    // Filter incidents by status if requested
    if (statusFilter) {
      incidents = incidents.filter((i) => i.status === statusFilter);
    }

    // Compute volume overage alerts across all agreements
    const volumeAlerts = agreements.map((agr) => {
      const overage = calculateVolumeOverageBilling(agr);
      return {
        agreementId: agr.id,
        entityId: agr.entityId,
        clientName: agr.clientName,
        currentFee: agr.baseRetainerFee,
        ...overage
      };
    }).filter((a) => a.isOverCapacity);

    // Compute aggregated metrics
    const totalScopeCreepValue = incidents.reduce((sum, inc) => sum + inc.proposedMicroBillFee, 0);
    const recoverableUnbilled = incidents.filter((i) => i.status === "DETECTED" || i.status === "CONSENT_SENT").reduce((sum, inc) => sum + inc.proposedMicroBillFee, 0);
    const approvedReadyToInvoice = incidents.filter((i) => i.status === "CLIENT_APPROVED").reduce((sum, inc) => sum + inc.proposedMicroBillFee, 0);
    const goodwillGiftedValue = incidents.filter((i) => i.status === "WAIVED_BY_PARTNER").reduce((sum, inc) => sum + inc.proposedMicroBillFee, 0);

    return NextResponse.json({
      success: true,
      agreements,
      incidents,
      microBills,
      volumeAlerts,
      metrics: {
        totalAgreementsCount: agreements.length,
        totalScopeCreepValue,
        recoverableUnbilled,
        approvedReadyToInvoice,
        goodwillGiftedValue,
        volumeAlertsCount: volumeAlerts.length
      }
    });
  } catch (error: any) {
    console.error("GET /api/billing/agreements error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = ensureDatabase();
    const body = await request.json();
    const { action, incidentId, agreementId, entityId, newMonthlyFee, partnerName, reason } = body;

    if (!(db as any).engagementAgreements) {
      (db as any).engagementAgreements = SAMPLE_ENGAGEMENT_AGREEMENTS;
    }
    if (!(db as any).scopeCreepIncidents) {
      (db as any).scopeCreepIncidents = SAMPLE_SCOPE_CREEP_INCIDENTS;
    }
    if (!(db as any).dynamicMicroBills) {
      (db as any).dynamicMicroBills = SAMPLE_DYNAMIC_MICRO_BILLS;
    }

    const agreements: EngagementAgreement[] = (db as any).engagementAgreements;
    const incidents: ScopeCreepIncident[] = (db as any).scopeCreepIncidents;
    const microBills: DynamicMicroBill[] = (db as any).dynamicMicroBills;

    // ACTION 1: SEND CONSENT REQUEST TO CLIENT
    if (action === "SEND_CONSENT_REQUEST") {
      const incident = incidents.find((i) => i.id === incidentId);
      if (!incident) {
        return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
      }

      const agreement = agreements.find((a) => a.id === incident.agreementId) || agreements[0];
      incident.status = "CONSENT_SENT";

      const approvalUrl = `https://brains-and-taxes.in/client/approval/${incident.clientApprovalToken}`;
      const whatsappText = generateMicroApprovalWhatsAppMessage({
        incident,
        agreement,
        approvalUrl,
        partnerName: partnerName || "CA Gunjan Jain"
      });

      await logAuditEvent(
        partnerName || "CA Gunjan Jain",
        "PARTNER",
        incident.clientName,
        "Scope Creep Consent Requested",
        `Dispatched micro-bill consent for '${incident.title}' (₹${incident.proposedMicroBillFee.toLocaleString("en-IN")}) under agreement ${agreement.id}.`,
        "INVOICE"
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: "Scope creep consent dispatched to client WhatsApp & portal.",
        incident,
        whatsappText,
        approvalUrl
      });
    }

    // ACTION 2: CLIENT APPROVAL
    if (action === "CLIENT_APPROVE_INCIDENT") {
      const incident = incidents.find((i) => i.id === incidentId || i.clientApprovalToken === incidentId);
      if (!incident) {
        return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
      }

      incident.status = "CLIENT_APPROVED";
      incident.approvedAt = new Date().toISOString();

      await logAuditEvent(
        incident.clientName,
        "CLIENT",
        incident.clientName,
        "Scope Creep Micro-Bill Approved",
        `Client confirmed add-on scope for '${incident.title}' (₹${incident.proposedMicroBillFee.toLocaleString("en-IN")}). Ready for instant micro-billing.`,
        "INVOICE"
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: "Micro-bill add-on approved by client.",
        incident
      });
    }

    // ACTION 3: CONVERT TO DYNAMIC MICRO-BILL
    if (action === "CONVERT_TO_MICRO_BILL") {
      const incident = incidents.find((i) => i.id === incidentId);
      if (!incident) {
        return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
      }

      const fee = incident.proposedMicroBillFee;
      const gstAmount = Math.round(fee * 0.18);
      const totalPayable = fee + gstAmount;
      const billId = `MB-2026-${Date.now().toString().slice(-4)}`;

      const upiPaymentLink = generateNpciDynamicUpiUri({
        vpa: "BRAINSANDTAXES@icici",
        payeeName: "GPA & Co., Chartered Accountants",
        amount: totalPayable,
        invoiceNo: billId,
        note: `Add-on Fee ${incident.title.slice(0, 30)}`
      });

      const qrDataUrl = await generateUpiQrDataUrl(upiPaymentLink);

      const microBill: DynamicMicroBill = {
        id: billId,
        entityId: incident.entityId,
        clientName: incident.clientName,
        agreementId: incident.agreementId,
        incidentId: incident.id,
        title: `Add-On: ${incident.title}`,
        feeAmount: fee,
        gstAmount,
        totalPayable,
        upiPaymentLink,
        qrDataUrl,
        paymentStatus: "PENDING",
        createdAt: new Date().toISOString()
      };

      microBills.unshift(microBill);
      incident.status = "INVOICED";
      incident.invoicedAt = new Date().toISOString();
      incident.invoiceId = billId;

      await logAuditEvent(
        partnerName || "CA Gunjan Jain",
        "PARTNER",
        incident.clientName,
        "Dynamic Micro-Bill Issued",
        `Issued micro-bill ${billId} for ₹${totalPayable.toLocaleString("en-IN")} via dynamic NPCI UPI.`,
        "INVOICE"
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: `Micro-bill ${billId} generated successfully with dynamic NPCI UPI QR.`,
        microBill,
        incident
      });
    }

    // ACTION 4: WAIVE AS GOODWILL COURTESY (Log to Paisa Bachaya Kitna)
    if (action === "WAIVE_AS_GOODWILL") {
      const incident = incidents.find((i) => i.id === incidentId);
      if (!incident) {
        return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
      }

      incident.status = "WAIVED_BY_PARTNER";
      incident.waivedReason = reason || "Waived as Relationship Goodwill Courtesy (Preserving Lihaaz)";

      await logAuditEvent(
        partnerName || "CA Gunjan Jain",
        "PARTNER",
        incident.clientName,
        "Scope Creep Waived as Goodwill",
        `Waived add-on fee of ₹${incident.proposedMicroBillFee.toLocaleString("en-IN")} for '${incident.title}'. Credited to client value ledger.`,
        "INVOICE"
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: `Fee of ₹${incident.proposedMicroBillFee.toLocaleString("en-IN")} waived and credited to client value ledger.`,
        incident
      });
    }

    // ACTION 5: UPDATE VOLUME TIER REVISION
    if (action === "UPDATE_VOLUME_TIER") {
      const agreement = agreements.find((a) => a.id === agreementId || a.entityId === entityId);
      if (!agreement) {
        return NextResponse.json({ success: false, error: "Agreement not found" }, { status: 404 });
      }

      const prevFee = agreement.baseRetainerFee;
      agreement.baseRetainerFee = newMonthlyFee || agreement.suggestedFeeRevision || prevFee;
      agreement.status = "ACTIVE";
      agreement.revisionRationale = `Contractual bracket updated from ₹${prevFee.toLocaleString("en-IN")} to ₹${agreement.baseRetainerFee.toLocaleString("en-IN")}/mo reflecting business transaction volume growth.`;

      await logAuditEvent(
        partnerName || "CA Gunjan Jain",
        "PARTNER",
        agreement.clientName,
        "Retainer Volume Tier Upgraded",
        `Adjusted monthly retainer from ₹${prevFee.toLocaleString("en-IN")} to ₹${agreement.baseRetainerFee.toLocaleString("en-IN")}/mo.`,
        "INVOICE"
      );

      await saveDatabase(db);
      return NextResponse.json({
        success: true,
        message: `Retainer volume tier updated to ₹${agreement.baseRetainerFee.toLocaleString("en-IN")}/mo.`,
        agreement
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/billing/agreements error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
