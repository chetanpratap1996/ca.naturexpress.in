import { NextRequest, NextResponse } from "next/server";
import { lookupGstin } from "@/lib/gst/gstinApiClient";
import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";
import { parseCinStrict } from "@/lib/intelligence/registry/mcaEngine";

export interface EntityAutoDetectPayload {
  gstin?: string;
  cin?: string;
  pan?: string;
}

export interface EntityIntelligenceSnapshot {
  source: "GSTIN" | "CIN" | "PAN" | "COMBINED";
  // Core identity
  legalName: string;
  tradeName: string;
  pan: string;
  gstin: string;
  cin: string;
  // Constitution
  entityType: string; // PVT_LTD, LLP, PROPRIETORSHIP, etc.
  businessConstitution: string;
  taxpayerType: string; // Regular, Composition
  // Registration details
  gstStatus: string;
  gstRegistrationDate: string;
  gstCancellationDate: string | null;
  // Address
  registeredAddress: string;
  stateCode: string;
  stateName: string;
  city: string;
  pincode: string;
  // Company details from CIN
  incorporationYear: number | null;
  isListedCompany: boolean;
  rocJurisdiction: string;
  // Filing frequency inference
  gstFilingFrequency: "MONTHLY" | "QRMP" | "COMPOSITION" | "UNREGISTERED";
  // Block status
  blockStatus: string;
  // API meta
  creditsRemaining?: number;
  dataFreshness: "LIVE" | "CACHED" | "OFFLINE";
  errors: string[];
  warnings: string[];
}

// Map GSTN taxpayerType + businessConstitution + legalName → our entity type enum
function mapGstConstitutionToEntityType(
  taxpayerType: string,
  constitution: string | null | undefined,
  legalName?: string,
  pan?: string
): string {
  const t = (taxpayerType || "").toLowerCase();
  const c = (constitution || "").toLowerCase();
  const n = (legalName || "").toLowerCase();
  if (c.includes("private limited") || c.includes("pvt") || n.includes("private limited") || n.includes("pvt ltd")) return "PVT_LTD";
  if (c.includes("public limited") || c.includes("public company") || n.includes("public limited")) return "PUBLIC_LTD";
  if (c.includes("llp") || c.includes("limited liability") || n.endsWith(" llp")) return "LLP";
  if (c.includes("partnership")) return "PARTNERSHIP";
  if (c.includes("propriet") || c.includes("sole")) return "PROPRIETORSHIP";
  if (c.includes("trust") || c.includes("society") || c.includes("section 8")) return "TRUST_NGO";
  if (c.includes("individual")) return "INDIVIDUAL_HNI";
  if (pan && pan.length === 10) {
    const ch = pan[3];
    if (ch === "C") return "PVT_LTD";
    if (ch === "F") return "PARTNERSHIP";
    if (ch === "P" || ch === "H") return "INDIVIDUAL_HNI";
    if (ch === "T" || ch === "A" || ch === "B") return "TRUST_NGO";
  }
  if (t.includes("compos")) return "PROPRIETORSHIP";
  return "PVT_LTD";
}

function inferGstFilingFrequency(taxpayerType: string, turnoverHint?: string): "MONTHLY" | "QRMP" | "COMPOSITION" | "UNREGISTERED" {
  const t = (taxpayerType || "").toLowerCase();
  if (t.includes("compos")) return "COMPOSITION";
  // QRMP is elected by taxpayer — we default to MONTHLY for Regular unless turnover suggests small
  return "MONTHLY";
}

export async function POST(request: NextRequest) {
  let body: EntityAutoDetectPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const { gstin, cin, pan } = body;

  if (!gstin && !cin && !pan) {
    return NextResponse.json({ success: false, error: "Provide at least one of: gstin, cin, pan." }, { status: 400 });
  }

  const snapshot: EntityIntelligenceSnapshot = {
    source: "PAN",
    legalName: "",
    tradeName: "",
    pan: (pan || "").toUpperCase(),
    gstin: (gstin || "").toUpperCase(),
    cin: (cin || "").toUpperCase(),
    entityType: "PVT_LTD",
    businessConstitution: "",
    taxpayerType: "Regular",
    gstStatus: "",
    gstRegistrationDate: "",
    gstCancellationDate: null,
    registeredAddress: "",
    stateCode: "",
    stateName: "",
    city: "",
    pincode: "",
    incorporationYear: null,
    isListedCompany: false,
    rocJurisdiction: "",
    gstFilingFrequency: "UNREGISTERED",
    blockStatus: "Unblocked",
    dataFreshness: "OFFLINE",
    errors: [],
    warnings: [],
  };

  // ── 1. GSTIN Lookup (most data-rich source) ──────────────────────────────
  if (gstin) {
    const cleanGstin = gstin.trim().toUpperCase();
    const validation = validateGstinDetailed(cleanGstin);

    if (!validation.isValid) {
      snapshot.errors.push(`GSTIN validation failed: ${validation.error}`);
    } else {
      snapshot.gstin = cleanGstin;
      snapshot.pan = snapshot.pan || validation.pan || cleanGstin.substring(2, 12);
      snapshot.stateCode = validation.stateCode || cleanGstin.substring(0, 2);
      snapshot.stateName = validation.stateName || "";

      const gstResult = await lookupGstin(cleanGstin);
      if (gstResult.success && gstResult.data) {
        const d = gstResult.data;
        snapshot.source = "GSTIN";
        snapshot.dataFreshness = d.source === "LIVE_API" ? "LIVE" : "CACHED";
        snapshot.legalName = d.legalName;
        snapshot.tradeName = d.tradeName;
        snapshot.pan = d.pan || snapshot.pan;
        snapshot.gstStatus = d.status;
        snapshot.gstRegistrationDate = d.registrationDate;
        snapshot.gstCancellationDate = d.cancellationDate || null;
        snapshot.businessConstitution = d.businessConstitution || "";
        snapshot.taxpayerType = d.taxpayerType;
        snapshot.blockStatus = d.blockStatus;
        snapshot.creditsRemaining = gstResult.creditsRemaining;
        snapshot.entityType = mapGstConstitutionToEntityType(d.taxpayerType, d.businessConstitution, d.legalName, snapshot.pan);
        snapshot.gstFilingFrequency = inferGstFilingFrequency(d.taxpayerType);
        // Address assembly — prefer full address from API
        const ad = d.addressDetails;
        const parts = [
          ad.buildingNumber, ad.buildingName, ad.street,
          ad.locality, ad.district, ad.city, ad.state, ad.pincode
        ].filter(Boolean);
        snapshot.registeredAddress = parts.length > 0 ? parts.join(", ") : d.address;
        snapshot.city = d.city || ad.city || "";
        snapshot.pincode = d.pincode || ad.pincode || "";
        snapshot.stateName = d.stateName || snapshot.stateName;

        if (d.status === "Cancelled") {
          snapshot.warnings.push(`⚠ GST Registration CANCELLED on ${d.cancellationDate || "unknown date"}. Verify with client.`);
        }
        if (d.status === "Suspended") {
          snapshot.warnings.push(`⚠ GST Registration is SUSPENDED. Returns may be blocked.`);
        }
      } else {
        snapshot.warnings.push(`GST Portal fetch failed: ${gstResult.error || "Unknown error"}. Offline checksum data used.`);
        snapshot.dataFreshness = "OFFLINE";
      }
    }
  }

  // ── 2. CIN Decode (adds company-level metadata) ───────────────────────────
  if (cin) {
    const cinData = parseCinStrict(cin.trim().toUpperCase());
    if (cinData.isValid) {
      snapshot.cin = cinData.cin;
      snapshot.source = snapshot.source === "GSTIN" ? "COMBINED" : "CIN";
      snapshot.incorporationYear = cinData.incorporationYear;
      snapshot.isListedCompany = cinData.isListed;
      snapshot.rocJurisdiction = cinData.rocJurisdictions?.[0] || "";
      // CIN state overrides if no GSTIN state
      if (!snapshot.stateName) {
        snapshot.stateName = cinData.stateName;
        snapshot.stateCode = cinData.stateCode;
      }
      // CIN entity type is most reliable for companies
      if (!gstin) {
        snapshot.entityType = cinData.companyType as string;
      }
    } else {
      snapshot.warnings.push(`CIN decode: ${cinData.error || "Invalid CIN format."}`);
    }
  }

  // ── 3. PAN fallback — infer entity type from 4th character ───────────────
  if (pan && !gstin && !cin) {
    const cleanPan = pan.trim().toUpperCase();
    if (cleanPan.length === 10) {
      const fourthChar = cleanPan[3];
      const panTypeMap: Record<string, string> = {
        C: "PVT_LTD",   // Company
        P: "INDIVIDUAL_HNI", // Person
        H: "INDIVIDUAL_HNI", // HUF
        F: "PARTNERSHIP",  // Firm
        A: "TRUST_NGO",  // AOP
        T: "TRUST_NGO",  // Trust
        B: "TRUST_NGO",  // BOI
        L: "LLP",       // Local Authority
        J: "TRUST_NGO",  // Artificial Juridical Person
        G: "TRUST_NGO",  // Government
      };
      snapshot.entityType = panTypeMap[fourthChar] || "PVT_LTD";
      snapshot.source = "PAN";
      snapshot.dataFreshness = "OFFLINE";
      snapshot.warnings.push("Only PAN provided — entity type inferred from 4th character. Add GSTIN for full lookup.");
    }
  }

  return NextResponse.json({ success: true, data: snapshot }, { status: 200 });
}
