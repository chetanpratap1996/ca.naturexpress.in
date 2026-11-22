import { validateGstinDetailed, GstinValidationResult } from "./gstinChecksum";

export interface NormalizedGstProfile {
  gstin: string;
  legalName: string;
  tradeName: string;
  pan: string;
  status: "Active" | "Cancelled" | "Suspended" | string;
  taxpayerType: "Regular" | "Composition" | string;
  businessConstitution?: string | null;
  registrationDate: string;
  cancellationDate?: string | null;
  stateCode: string;
  stateName: string;
  address: string;
  city: string;
  pincode: string;
  addressDetails: {
    buildingNumber?: string | null;
    buildingName?: string | null;
    street?: string | null;
    locality?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  };
  blockStatus: string;
  creditsRemaining?: number;
  source: "LIVE_API" | "LOCAL_CACHE";
  cachedAt?: string;
}

export interface GstLookupResponse {
  success: boolean;
  validation: GstinValidationResult;
  data?: NormalizedGstProfile;
  returns?: Array<{
    returnType: string;
    returnPeriod: string;
    filingStatus: string;
    filingDate: string;
    arn: string;
  }>;
  creditsRemaining?: number;
  error?: string;
  offlineOnly?: boolean;
}

// In-memory cache to save API credits on repeated queries in the same process
const gstinMemoryCache = new Map<string, { data: NormalizedGstProfile; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * High-performance GSTIN Lookup Engine
 * 1. Executes 0ms offline Mod-36 validation (protects API credits from typos)
 * 2. Checks local cache (0 API cost for repeated lookups)
 * 3. Calls gstinapi.in live API using secure server-side credentials
 */
export async function lookupGstin(rawGstin: string): Promise<GstLookupResponse> {
  // Step 1: 0ms Mathematical validation
  const validation = validateGstinDetailed(rawGstin);
  if (!validation.isValid) {
    return {
      success: false,
      validation,
      error: validation.error || "Invalid GSTIN format or checksum.",
      offlineOnly: true
    };
  }

  const cleanGstin = validation.cleanGstin;

  // Step 2: Check in-memory cache
  const cached = gstinMemoryCache.get(cleanGstin);
  if (cached && Date.now() < cached.expiresAt) {
    return {
      success: true,
      validation,
      data: { ...cached.data, source: "LOCAL_CACHE" },
      creditsRemaining: cached.data.creditsRemaining
    };
  }

  // Step 3: Call Live API
  const apiKey = process.env.GSTIN_API_KEY || "gak_a23317e2eb7b4ba4a0fae0b6f6c8b618";
  const baseUrl = process.env.GSTIN_API_BASE_URL || "https://www.gstinapi.in/v1";

  try {
    const res = await fetch(`${baseUrl}/gstin/${cleanGstin}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Accept": "application/json"
      },
      // Short timeout to prevent hanging
      signal: AbortSignal.timeout(8000)
    });

    const resJson = await res.json();

    if (!res.ok || !resJson.success) {
      return {
        success: false,
        validation,
        error: resJson.error || `GSTIN Lookup failed with status ${res.status}`,
        creditsRemaining: resJson.credits_remaining
      };
    }

    const d = resJson.data || {};
    const normalized: NormalizedGstProfile = {
      gstin: cleanGstin,
      legalName: d.legal_name || "N/A",
      tradeName: d.trade_name || d.legal_name || "N/A",
      pan: validation.pan || cleanGstin.substring(2, 12),
      status: d.status || "Active",
      taxpayerType: d.taxpayer_type || "Regular",
      businessConstitution: d.business_constitution || null,
      registrationDate: d.registration_date || "2017-07-01",
      cancellationDate: d.cancellation_date || null,
      stateCode: d.state_code || validation.stateCode || cleanGstin.substring(0, 2),
      stateName: validation.stateName || d.address_details?.state || "India",
      address: d.address || "",
      city: d.city || d.address_details?.city || d.address_details?.locality || "",
      pincode: d.pincode || d.address_details?.pincode || "",
      addressDetails: {
        buildingNumber: d.address_details?.building_number || null,
        buildingName: d.address_details?.building_name || null,
        street: d.address_details?.street || null,
        locality: d.address_details?.locality || null,
        district: d.address_details?.district || null,
        city: d.address_details?.city || null,
        state: d.address_details?.state || validation.stateName || null,
        pincode: d.address_details?.pincode || null,
      },
      blockStatus: d.block_status || "Unblocked",
      creditsRemaining: resJson.credits_remaining,
      source: "LIVE_API",
      cachedAt: new Date().toISOString()
    };

    // Cache the result for 24h
    gstinMemoryCache.set(cleanGstin, {
      data: normalized,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return {
      success: true,
      validation,
      data: normalized,
      creditsRemaining: resJson.credits_remaining
    };
  } catch (err: any) {
    return {
      success: false,
      validation,
      error: `Network error calling GSTIN verification: ${err.message || String(err)}`
    };
  }
}

/**
 * Fetch return filing history for a GSTIN
 */
export async function lookupGstReturns(rawGstin: string, fy?: string) {
  const validation = validateGstinDetailed(rawGstin);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const apiKey = process.env.GSTIN_API_KEY || "gak_a23317e2eb7b4ba4a0fae0b6f6c8b618";
  const baseUrl = process.env.GSTIN_API_BASE_URL || "https://www.gstinapi.in/v1";
  const targetFy = fy || "2024-25";

  try {
    const res = await fetch(`${baseUrl}/gstin/${validation.cleanGstin}/returns?fy=${targetFy}`, {
      headers: { "x-api-key": apiKey }
    });
    const resJson = await res.json();
    return resJson;
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Fetch GSTR-2B Statement for connected GSTIN via gstinapi.in GSP Integration
 * Requires 1-time taxpayer authorization via GST Portal OTP with GSP BVM IT Consulting
 */
export async function fetchGstr2bFromApi(params: {
  gstin: string;
  returnPeriod: string; // MMYYYY format e.g. "102026"
}) {
  const { gstin, returnPeriod } = params;
  const validation = validateGstinDetailed(gstin);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const apiKey = process.env.GSTIN_API_KEY || "gak_a23317e2eb7b4ba4a0fae0b6f6c8b618";
  const baseUrl = process.env.GSTIN_API_BASE_URL || "https://www.gstinapi.in/v1";

  try {
    const res = await fetch(`${baseUrl}/gstr2b/fetch`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        gstin: validation.cleanGstin,
        return_period: returnPeriod
      }),
      signal: AbortSignal.timeout(15000)
    });

    const resJson = await res.json();
    return resJson;
  } catch (err: any) {
    return { success: false, error: `GSTR-2B Sync Error: ${err.message || String(err)}` };
  }
}
