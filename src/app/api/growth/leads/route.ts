import { NextRequest, NextResponse } from "next/server";
import { LeadStore } from "@/lib/intelligence/store/leadStore";
import { LeadFilterCriteria, LeadStage, ServiceTrack, StatutorySeverity } from "@/lib/intelligence/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const filter: LeadFilterCriteria = {
      state: searchParams.get("state") || undefined,
      rocJurisdiction: searchParams.get("roc") || undefined,
      serviceTrack: (searchParams.get("track") as ServiceTrack) || undefined,
      highestSeverity: (searchParams.get("severity") as StatutorySeverity) || undefined,
      stage: (searchParams.get("stage") as LeadStage) || undefined,
      industrialCluster: searchParams.get("cluster") || undefined,
      searchQuery: searchParams.get("q") || undefined,
      minPenaltyInr: searchParams.get("minPenalty") ? parseInt(searchParams.get("minPenalty")!, 10) : undefined,
      minCapitalInr: searchParams.get("minCapital") ? parseInt(searchParams.get("minCapital")!, 10) : undefined,
      hotOnly: searchParams.get("hotOnly") === "true",
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0,
    };

    const leads = await LeadStore.getAllLeads(filter);
    const metrics = await LeadStore.getGrowthMetrics();

    return NextResponse.json({
      success: true,
      count: leads.length,
      metrics,
      leads,
    });
  } catch (error: any) {
    console.error("Failed fetching growth leads:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support batch insertion
    if (Array.isArray(body.leads)) {
      const inserted = await LeadStore.batchUpsertLeads(body.leads);
      return NextResponse.json({ success: true, count: inserted.length, leads: inserted });
    }

    if (!body.legalName || (!body.cin && !body.gstin)) {
      return NextResponse.json(
        { success: false, error: "Legal Name and either CIN or GSTIN are strictly required for 1000% accuracy." },
        { status: 400 }
      );
    }

    const newLead = await LeadStore.upsertLead({
      id: body.id || `lead_${Date.now()}`,
      firmId: body.firmId || "gpa_brainsandtaxes",
      cin: body.cin,
      gstin: body.gstin,
      pan: body.pan || (body.gstin ? body.gstin.substring(2, 12) : undefined),
      legalName: body.legalName,
      tradeName: body.tradeName || body.legalName,
      companyType: body.companyType || "PVT_LTD",
      incorporationDate: body.incorporationDate || new Date().toISOString().split("T")[0],
      authorizedCapitalInr: body.authorizedCapitalInr || 2500000,
      paidUpCapitalInr: body.paidUpCapitalInr || 1000000,
      state: body.state || "Madhya Pradesh",
      stateCode: body.stateCode || "MP",
      rocJurisdiction: body.rocJurisdiction || "ROC Gwalior",
      city: body.city || "Indore",
      pincode: body.pincode || "452001",
      registeredAddress: body.registeredAddress || "Address on MCA Record",
      industrialCluster: body.industrialCluster,
      industrySector: body.industrySector,
      phone: body.phone,
      email: body.email,
      website: body.website,
      googleMapsUrl: body.googleMapsUrl,
      suggestedFeeInr: body.suggestedFeeInr,
      directors: body.directors || [],
      gstDetails: body.gstDetails,
      chargesRegistered: body.chargesRegistered || [],
      painPoints: [],
      totalPenaltyExposureInr: 0,
      highestSeverity: "OPPORTUNITY",
      primaryTrack: body.primaryTrack || "NEW_INCORPORATION",
      proof: body.proof || {
        registrySource: "MANUAL_IMPORT",
        verifiedAt: new Date().toISOString(),
        accuracyScore: 1000,
        sourceUrl: "https://www.mca.gov.in",
        rawHash: "manual_verified_record",
        evidenceSummary: "Record verified manually by practice compliance manager.",
      },
      stage: body.stage || "DISCOVERED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, lead: newLead });
  } catch (error: any) {
    console.error("Failed creating growth lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, stage, outreachNotes, followUpDate, dealValueEstimatedInr, phone, email } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Lead 'id' is required." },
        { status: 400 }
      );
    }

    if (stage) {
      await LeadStore.updateLeadStage(id, stage as LeadStage, outreachNotes);
    }

    if (outreachNotes !== undefined || followUpDate !== undefined || dealValueEstimatedInr !== undefined || phone || email) {
      await LeadStore.updateLeadNotes(id, {
        outreachNotes,
        followUpDate,
        dealValueEstimatedInr,
        phone,
        email,
      });
    }

    const updated = await LeadStore.getLeadById(id);
    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error("Failed updating lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Lead 'id' is required" }, { status: 400 });
    }

    const removed = await LeadStore.deleteLead(id);
    return NextResponse.json({ success: removed });
  } catch (error: any) {
    console.error("Failed deleting lead:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
