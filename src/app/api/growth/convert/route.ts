import { NextRequest, NextResponse } from "next/server";
import { LeadStore } from "@/lib/intelligence/store/leadStore";

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

    return NextResponse.json({
      success: true,
      message: `Successfully onboarded ${lead.legalName} into Practice Roster`,
      clientId: newClientId,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error("Convert lead to client error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to convert lead" },
      { status: 500 }
    );
  }
}
