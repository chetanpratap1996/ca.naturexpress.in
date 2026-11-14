import { NextRequest, NextResponse } from "next/server";
import { LeadStore } from "@/lib/intelligence/store/leadStore";
import { generateAdvisoryDocket } from "@/lib/intelligence/engine/advisoryGenerator";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter 'leadId'" },
        { status: 400 }
      );
    }

    const lead = await LeadStore.getLeadById(leadId);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: `Lead '${leadId}' not found.` },
        { status: 404 }
      );
    }

    const docket = generateAdvisoryDocket(lead, DEFAULT_FIRM_BRANDING);

    return NextResponse.json({
      success: true,
      docket,
    });
  } catch (error: any) {
    console.error("Advisory docket generation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate advisory docket" },
      { status: 500 }
    );
  }
}
