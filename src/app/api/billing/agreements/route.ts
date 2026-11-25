import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import {
  EngagementAgreement,
  ScopeCreepIncident,
  DynamicMicroBill,
  calculateVolumeOverageBilling,
  generateMicroApprovalWhatsAppMessage,
} from "@/lib/billing/scopeCreepEngine";
import { generateNpciDynamicUpiUri, generateUpiQrDataUrl } from "@/lib/billing/npciUpiEngine";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  appendPgAuditLog,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
} from "@/lib/server/pgHelpers";
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
    const entityId = searchParams.get("entityId");
    const statusFilter = searchParams.get("status");

    const [{ rows: entRows }, agrRecs, incRecs, billRecs] = await Promise.all([
      pool.query("SELECT * FROM public.client_entities WHERE firm_id = $1", [firmId]),
      listWorkspaceRecords<EngagementAgreement>(firmId, "ENGAGEMENT_AGREEMENT", entityId),
      listWorkspaceRecords<ScopeCreepIncident>(firmId, "SCOPE_CREEP_INCIDENT", entityId),
      listWorkspaceRecords<DynamicMicroBill>(firmId, "DYNAMIC_MICRO_BILL", entityId),
    ]);

    const agreements: EngagementAgreement[] = agrRecs.map((r) => r.payload);
    for (const c of entRows) {
      if (entityId && c.id !== entityId) continue;
      if (!agreements.some((a) => a.entityId === c.id)) {
        const turnover = Number(c.turnover_cr || 5.0);
        const fee = turnover > 20 ? 10000 : turnover > 5 ? 5000 : 3500;
        const maxInvoices = Math.max(50, Math.round(turnover * 20));
        agreements.push({
          id: `AGR-${c.id}`,
          entityId: c.id,
          clientName: c.entity_name,
          billingCycle: c.type === "PVT_LTD" ? "MONTHLY" : "QUARTERLY",
          baseRetainerFee: fee,
          includedServices: [
            "Monthly GST Filing & ITC 2B Matching",
            "Quarterly TDS Compliances & Form 26Q",
            "Advance Tax Computations",
            "Annual Statutory Financial Statements",
          ],
          thresholds: { maxMonthlyInvoices: maxInvoices, maxAnnualTurnoverCr: turnover * 1.25, maxBankAccounts: 2 },
          actuals: { actualMonthlyInvoices: maxInvoices, actualTurnoverCr: turnover, actualBankAccounts: 2, overagePercentage: 0 },
          status: "ACTIVE",
          startDate: "2026-04-01",
          renewalDate: "2027-03-31",
        });
      }
    }

    let incidents = incRecs.map((r) => r.payload);
    if (statusFilter) incidents = incidents.filter((i) => i.status === statusFilter);
    const microBills = billRecs.map((r) => r.payload);

    const volumeAlerts = agreements
      .map((agr) => ({
        agreementId: agr.id,
        entityId: agr.entityId,
        clientName: agr.clientName,
        currentFee: agr.baseRetainerFee,
        ...calculateVolumeOverageBilling(agr),
      }))
      .filter((a) => a.isOverCapacity);

    return NextResponse.json({
      success: true,
      agreements,
      incidents,
      microBills,
      volumeAlerts,
      metrics: {
        totalAgreementsCount: agreements.length,
        totalScopeCreepValue: incidents.reduce((sum, inc) => sum + inc.proposedMicroBillFee, 0),
        recoverableUnbilled: incidents
          .filter((i) => i.status === "DETECTED" || i.status === "CONSENT_SENT")
          .reduce((sum, inc) => sum + inc.proposedMicroBillFee, 0),
        approvedReadyToInvoice: incidents
          .filter((i) => i.status === "CLIENT_APPROVED")
          .reduce((sum, inc) => sum + inc.proposedMicroBillFee, 0),
        goodwillGiftedValue: incidents
          .filter((i) => i.status === "WAIVED_BY_PARTNER")
          .reduce((sum, inc) => sum + inc.proposedMicroBillFee, 0),
        volumeAlertsCount: volumeAlerts.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/billing/agreements error:", error);
    return NextResponse.json({ success: false, error: "Failed to load agreements." }, { status: 500 });
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
    const body = await request.json();
    const { action, incidentId, agreementId, entityId, newMonthlyFee, reason } = body;

    const [agrRecs, incRecs] = await Promise.all([
      listWorkspaceRecords<EngagementAgreement>(firmId, "ENGAGEMENT_AGREEMENT"),
      listWorkspaceRecords<ScopeCreepIncident>(firmId, "SCOPE_CREEP_INCIDENT"),
    ]);

    const agreements = agrRecs.map((r) => r.payload);
    const incidents = incRecs.map((r) => r.payload);
    const partnerName = auth.userName || DEFAULT_FIRM_BRANDING.managingPartner;

    if (action === "SEND_CONSENT_REQUEST") {
      const incident = incidents.find((i) => i.id === incidentId);
      if (!incident) return NextResponse.json({ success: false, error: "Incident not found." }, { status: 404 });
      const agreement = agreements.find((a) => a.id === incident.agreementId) || agreements[0];
      incident.status = "CONSENT_SENT";

      await upsertWorkspaceRecord({
        firmId,
        entityId: incident.entityId,
        recordType: "SCOPE_CREEP_INCIDENT",
        matchKey: "id",
        matchValue: incident.id,
        payload: incident,
      });

      const approvalUrl = `${request.nextUrl.origin}/client?approval=${incident.clientApprovalToken}`;
      const whatsappText = agreement
        ? generateMicroApprovalWhatsAppMessage({ incident, agreement, approvalUrl, partnerName })
        : "";

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: partnerName,
        actorRole: "PARTNER",
        entityId: incident.entityId,
        entityName: incident.clientName,
        action: "Scope Creep Consent Requested",
        details: `Dispatched micro-bill consent for '${incident.title}'.`,
        category: "INVOICE",
      });

      return NextResponse.json({ success: true, incident, whatsappText, approvalUrl });
    }

    if (action === "CONVERT_TO_MICRO_BILL") {
      const incident = incidents.find((i) => i.id === incidentId);
      if (!incident) return NextResponse.json({ success: false, error: "Incident not found." }, { status: 404 });
      const fee = incident.proposedMicroBillFee;
      const gstAmount = Math.round(fee * 0.18);
      const totalPayable = fee + gstAmount;
      const billId = `MB-${Date.now().toString().slice(-6)}`;

      const upiPaymentLink = generateNpciDynamicUpiUri({
        vpa: DEFAULT_FIRM_BRANDING.firmUpiVpa,
        payeeName: DEFAULT_FIRM_BRANDING.firmName,
        amount: totalPayable,
        invoiceNo: billId,
        note: `Add-on Fee ${incident.title.slice(0, 30)}`,
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
        createdAt: new Date().toISOString(),
      };

      incident.status = "INVOICED";
      incident.invoicedAt = new Date().toISOString();
      incident.invoiceId = billId;

      await Promise.all([
        upsertWorkspaceRecord({
          firmId,
          entityId: incident.entityId,
          recordType: "DYNAMIC_MICRO_BILL",
          matchKey: "id",
          matchValue: billId,
          payload: microBill,
        }),
        upsertWorkspaceRecord({
          firmId,
          entityId: incident.entityId,
          recordType: "SCOPE_CREEP_INCIDENT",
          matchKey: "id",
          matchValue: incident.id,
          payload: incident,
        }),
      ]);

      return NextResponse.json({ success: true, microBill, incident });
    }

    if (action === "WAIVE_AS_GOODWILL") {
      const incident = incidents.find((i) => i.id === incidentId);
      if (!incident) return NextResponse.json({ success: false, error: "Incident not found." }, { status: 404 });
      incident.status = "WAIVED_BY_PARTNER";
      incident.waivedReason = reason || "Waived as Relationship Goodwill Courtesy";
      await upsertWorkspaceRecord({
        firmId,
        entityId: incident.entityId,
        recordType: "SCOPE_CREEP_INCIDENT",
        matchKey: "id",
        matchValue: incident.id,
        payload: incident,
      });
      return NextResponse.json({ success: true, incident });
    }

    if (action === "UPDATE_VOLUME_TIER") {
      const agreement = agreements.find((a) => a.id === agreementId || a.entityId === entityId);
      if (!agreement) return NextResponse.json({ success: false, error: "Agreement not found." }, { status: 404 });
      agreement.baseRetainerFee = newMonthlyFee || agreement.suggestedFeeRevision || agreement.baseRetainerFee;
      agreement.status = "ACTIVE";
      await upsertWorkspaceRecord({
        firmId,
        entityId: agreement.entityId,
        recordType: "ENGAGEMENT_AGREEMENT",
        matchKey: "id",
        matchValue: agreement.id,
        payload: agreement,
      });
      return NextResponse.json({ success: true, agreement });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/billing/agreements error:", error);
    return NextResponse.json({ success: false, error: "Failed to process agreement action." }, { status: 500 });
  }
}
