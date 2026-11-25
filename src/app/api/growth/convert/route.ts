import { NextRequest, NextResponse } from "next/server";
import { LeadStore } from "@/lib/intelligence/store/leadStore";
import { ClientEntity } from "@/lib/types";
import { generateStatutoryTasksForClient } from "@/lib/statutoryTasks";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog, upsertWorkspaceRecord } from "@/lib/server/pgHelpers";
import { hashSecret, normalizePhone10 } from "@/lib/auth/enterpriseAuth";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await req.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "leadId is required to convert to a practice client." },
        { status: 400 }
      );
    }

    const lead = await LeadStore.getLeadById(leadId);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead entity not found in practice repository." },
        { status: 404 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const pan = (lead.pan || (lead.gstin ? lead.gstin.substring(2, 12) : "AAAAA0000A")).toUpperCase();
    const groupName = `${lead.legalName} Group`;
    const contactName = lead.directors?.[0]?.name || "Authorized Signatory";
    const contactPhone = lead.phone || "";
    const contactEmail = lead.email || "";

    const grpIns = await pool.query(
      `INSERT INTO public.client_groups (
        firm_id, group_name, promoter_name, promoter_phone, promoter_email, unbilled_wip_total, overdue_fees_total
      ) VALUES ($1, $2, $3, $4, $5, 0, 0) RETURNING id`,
      [firmId, groupName, contactName, contactPhone || "+91 00000 00000", contactEmail || "accounts@client.in"]
    );
    const groupId = grpIns.rows[0].id;

    const phone10 = normalizePhone10(contactPhone);
    const initialPin = phone10.length >= 4 ? phone10.slice(-4) : String(crypto.randomInt(1000, 9999));
    const { hash, salt } = hashSecret(initialPin);

    const entIns = await pool.query(
      `INSERT INTO public.client_entities (
        firm_id, group_id, entity_name, type, pan, gstin, cin, turnover_cr, incorporation_year,
        primary_contact_name, primary_contact_phone, primary_contact_email, primary_contact_designation,
        auth_pin, auth_pin_hash, auth_pin_salt, is_pin_customized
      ) VALUES ($1, $2, $3, 'PVT_LTD', $4, $5, $6, $7, $8, $9, $10, $11, 'Managing Director', NULL, $12, $13, FALSE)
      RETURNING id`,
      [
        firmId,
        groupId,
        lead.legalName,
        pan,
        lead.gstin || null,
        lead.cin || null,
        (lead.annualTurnoverEstimatedInr || 25000000) / 10000000,
        lead.incorporationDate ? parseInt(lead.incorporationDate.slice(0, 4), 10) : 2020,
        contactName,
        contactPhone,
        contactEmail,
        hash,
        salt,
      ]
    );

    const newClientId = entIns.rows[0].id;
    const updatedLead = await LeadStore.convertLeadToClient(leadId, newClientId);

    const newClient: ClientEntity = {
      id: newClientId,
      groupId,
      groupName,
      name: lead.legalName,
      tradeName: lead.tradeName || lead.legalName,
      type: "PVT_LTD",
      pan,
      gstin: lead.gstin || undefined,
      cin: lead.cin || undefined,
      turnoverCr: (lead.annualTurnoverEstimatedInr || 25000000) / 10000000,
      partnerInCharge: auth.userName || DEFAULT_FIRM_BRANDING.managingPartner,
      assignedArticle: "Practice Team",
      incorporationYear: lead.incorporationDate ? parseInt(lead.incorporationDate.slice(0, 4), 10) : 2020,
      penaltyRiskAccrued: 0,
      primaryContact: {
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
        designation: "Managing Director",
      },
    };

    const tasks = generateStatutoryTasksForClient(newClient);
    for (const t of tasks) {
      await pool.query(
        `INSERT INTO public.compliance_tasks (
          firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty
        ) VALUES ($1, $2, $3::compliance_category, $4, $5, $6, $7::workflow_status, $8::task_priority, $9, $10)`,
        [firmId, newClientId, t.category, t.title, t.period, t.dueDate, t.status, t.priority, t.penaltyRisk, t.accruingDailyPenalty]
      );
    }

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Practice Staff",
      actorRole: auth.role || "PARTNER",
      entityId: newClientId,
      entityName: lead.legalName,
      action: "CLIENT_ONBOARDED",
      details: `Converted lead '${lead.legalName}' into active practice client.`,
      category: "COMPLIANCE",
    });

    await upsertWorkspaceRecord({
      firmId,
      entityId: newClientId,
      recordType: "NOTIFICATION",
      payload: {
        id: `NOTIF-CONV-${Date.now()}`,
        title: `Welcome to ${DEFAULT_FIRM_BRANDING.firmShortName} Practice Portal`,
        message: `Statutory compliance desk initialized for ${lead.legalName}.`,
        category: "COMPLIANCE",
        priority: "NORMAL",
        recipientRole: "CLIENT",
        recipientEntityId: newClientId,
        targetTab: "tasks",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully onboarded ${lead.legalName} into Practice Roster`,
      clientId: newClientId,
      lead: updatedLead,
      client: newClient,
    });
  } catch (error: any) {
    console.error("Convert lead to client error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to convert lead to client." },
      { status: 500 }
    );
  }
}
