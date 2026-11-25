import { NextRequest, NextResponse } from "next/server";
import { CorporateScraperEngine } from "@/lib/intelligence/scraper/corporateScraper";
import { LeadStore } from "@/lib/intelligence/store/leadStore";
import { enforceApiRole } from "@/lib/auth/serverAuth";

export async function GET(req: NextRequest) {
  const { errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse) return errorResponse;
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const state = searchParams.get("state") || undefined;

    if (!query.trim() && !state) {
      return NextResponse.json(
        { success: false, error: "Please provide a search keyword or state to query real corporate registries." },
        { status: 400 }
      );
    }

    const matches = await CorporateScraperEngine.searchCorporateEntities(query, state);

    return NextResponse.json({
      success: true,
      count: matches.length,
      results: matches,
    });
  } catch (error: any) {
    console.error("Live corporate search error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search corporate records" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await enforceApiRole(req, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse) return errorResponse;
  try {
    const body = await req.json();
    const { cin, gstin, legalName, stateCode, city, directors, phone, email, website, autoCommit } = body;

    if (!cin && !gstin && !legalName) {
      return NextResponse.json(
        { success: false, error: "CIN, GSTIN, or Registered Legal Name is required to run statutory scraper." },
        { status: 400 }
      );
    }

    const result = await CorporateScraperEngine.scrapeAndVerifyCompany({
      cin,
      gstin,
      legalName,
      stateCode,
      city,
      directors,
      phone,
      email,
      website,
    });

    if (!result.success || !result.lead) {
      return NextResponse.json(
        { success: false, error: result.error || "Scraping failed against statutory registries." },
        { status: 400 }
      );
    }

    // If autoCommit is true, persist directly into the practice lead store
    if (autoCommit) {
      await LeadStore.upsertLead(result.lead);
    }

    return NextResponse.json({
      success: true,
      lead: result.lead,
      accuracyScore: result.accuracyScore,
      source: result.source,
      auditHash: result.auditHash,
    });
  } catch (error: any) {
    console.error("Live scraper execution error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Scraping pipeline encountered an error" },
      { status: 500 }
    );
  }
}
