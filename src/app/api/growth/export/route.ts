import { NextRequest, NextResponse } from "next/server";
import { LeadStore } from "@/lib/intelligence/store/leadStore";
import { LeadFilterCriteria, ServiceTrack, StatutorySeverity, LeadStage } from "@/lib/intelligence/types";
import { enforceApiRole } from "@/lib/auth/serverAuth";

export async function GET(req: NextRequest) {
  const { errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse) return errorResponse;
  try {
    const { searchParams } = new URL(req.url);

    const filter: LeadFilterCriteria = {
      state: searchParams.get("state") || undefined,
      serviceTrack: (searchParams.get("track") as ServiceTrack) || undefined,
      highestSeverity: (searchParams.get("severity") as StatutorySeverity) || undefined,
      stage: (searchParams.get("stage") as LeadStage) || undefined,
      searchQuery: searchParams.get("q") || undefined,
      limit: 1000,
    };

    const leads = await LeadStore.getAllLeads(filter);

    // Build CSV Headers
    const headers = [
      "ID",
      "Legal Name",
      "Trade Name",
      "CIN",
      "GSTIN",
      "PAN",
      "Company Type",
      "Incorporation Date",
      "Authorized Capital (INR)",
      "Paid-Up Capital (INR)",
      "State",
      "ROC Jurisdiction",
      "City",
      "Pincode",
      "Industrial Cluster",
      "Industry Sector",
      "Primary Director Name",
      "Primary Director DIN",
      "Phone",
      "Email",
      "Website",
      "Primary Service Track",
      "Risk Severity",
      "Total Statutory Penalty Exposure (INR)",
      "Suggested CA Advisory Fee (INR)",
      "Pipeline Stage",
      "Registry Verification Proof Source",
      "Audit Hash",
      "Follow-up Date",
      "CA Notes"
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = leads.map((lead) => {
      const primaryDirector = lead.directors.length > 0 ? lead.directors[0] : null;
      return [
        escapeCsv(lead.id),
        escapeCsv(lead.legalName),
        escapeCsv(lead.tradeName || lead.legalName),
        escapeCsv(lead.cin || "N/A"),
        escapeCsv(lead.gstin || "N/A"),
        escapeCsv(lead.pan || "N/A"),
        escapeCsv(lead.companyType),
        escapeCsv(lead.incorporationDate),
        escapeCsv(lead.authorizedCapitalInr),
        escapeCsv(lead.paidUpCapitalInr),
        escapeCsv(lead.state),
        escapeCsv(lead.rocJurisdiction),
        escapeCsv(lead.city),
        escapeCsv(lead.pincode),
        escapeCsv(lead.industrialCluster || "General Industrial"),
        escapeCsv(lead.industrySector || "Commercial Enterprise"),
        escapeCsv(primaryDirector ? primaryDirector.name : "N/A"),
        escapeCsv(primaryDirector ? primaryDirector.din : "N/A"),
        escapeCsv(lead.phone || "N/A"),
        escapeCsv(lead.email || "N/A"),
        escapeCsv(lead.website || "N/A"),
        escapeCsv(lead.primaryTrack),
        escapeCsv(lead.highestSeverity),
        escapeCsv(lead.totalPenaltyExposureInr || 0),
        escapeCsv(lead.suggestedFeeInr || 35000),
        escapeCsv(lead.stage),
        escapeCsv(lead.proof.registrySource),
        escapeCsv(lead.proof.rawHash),
        escapeCsv(lead.followUpDate || ""),
        escapeCsv(lead.outreachNotes || "")
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="BrainsAndTaxes_Practice_Leads_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export leads CSV failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export leads" },
      { status: 500 }
    );
  }
}
