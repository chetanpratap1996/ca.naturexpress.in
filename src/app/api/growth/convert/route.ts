import { NextRequest, NextResponse } from "next/server";
import { LeadStore } from "@/lib/intelligence/store/leadStore";
import { ensureDatabase, saveDatabase, createNotification, logAuditEvent } from "@/lib/server/db";
import { ClientEntity } from "@/lib/types";
import { executePracticeAutopilotSweep } from "@/lib/automation/practiceAutopilot";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, clientName, partnerName } = body;

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

    const newClientId = `CLI_${Date.now()}`;
    const updatedLead = await LeadStore.convertLeadToClient(leadId, newClientId);

    // Autonomous Practice Roster Ingestion & Statutory Calendar Priming
    const db = ensureDatabase();
    if (!db.clients) db.clients = [];

    const newClient: ClientEntity = {
      id: newClientId,
      groupId: "GRP-01",
      groupName: lead.legalName,
      name: lead.legalName,
      tradeName: lead.tradeName || lead.legalName,
      type: "PVT_LTD",
      pan: lead.pan || "AABCA0000A",
      gstin: lead.gstin || "",
      cin: lead.cin || "",
      turnoverCr: (lead.annualTurnoverEstimatedInr || 25000000) / 10000000,
      partnerInCharge: partnerName || "CA Gunjan Jain",
      assignedArticle: "Dev Article Assistant",
      incorporationYear: lead.incorporationDate ? parseInt(lead.incorporationDate.slice(0, 4), 10) : 2020,
      penaltyRiskAccrued: 0,
      primaryContact: {
        name: lead.directors?.[0]?.name || "Director",
        phone: lead.phone || "+91 98200 44101",
        email: lead.email || "finance@client.com",
        designation: "Managing Director",
      },
    };

    db.clients.push(newClient);
    await saveDatabase(db);

    await logAuditEvent(
      partnerName || "CA Gunjan Jain",
      "PARTNER",
      lead.legalName,
      "CLIENT_ONBOARDED",
      `Converted lead '${lead.legalName}' into active practice client. Spawning statutory compliance calendar (GST/TDS/ITR/MCA).`,
      "COMPLIANCE"
    );

    await createNotification({
      title: `Welcome to GPA & Co. Practice Portal`,
      message: `Statutory compliance desk initialized for ${lead.legalName}. Statutory returns auto-scheduled based on Entity DNA.`,
      category: "COMPLIANCE",
      priority: "NORMAL",
      targetTab: "tasks",
      recipientRole: "CLIENT",
      recipientEntityId: newClientId,
    });

    // Auto-spawn statutory tasks via practice autopilot sweep
    executePracticeAutopilotSweep(db, "Client Onboarding Autopilot").catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Successfully onboarded ${lead.legalName} into Practice Roster`,
      clientId: newClientId,
      lead: updatedLead,
      client: newClient
    });
  } catch (error: any) {
    console.error("Convert lead to client error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to convert lead" },
      { status: 500 }
    );
  }
}
