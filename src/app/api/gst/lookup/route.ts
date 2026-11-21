import { NextRequest, NextResponse } from "next/server";
import { lookupGstin, lookupGstReturns } from "@/lib/gst/gstinApiClient";
import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gstin = searchParams.get("gstin") || "";
  const includeReturns = searchParams.get("returns") === "true";
  const fy = searchParams.get("fy") || "2024-25";

  if (!gstin) {
    return NextResponse.json(
      { success: false, error: "Query parameter 'gstin' is required." },
      { status: 400 }
    );
  }

  // 0ms offline validation check first
  const validation = validateGstinDetailed(gstin);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        success: false,
        validation,
        error: validation.error,
        offlineOnly: true
      },
      { status: 400 }
    );
  }

  const result = await lookupGstin(gstin);

  if (includeReturns && result.success) {
    const returnsResult = await lookupGstReturns(gstin, fy);
    return NextResponse.json({
      ...result,
      returnsData: returnsResult
    });
  }

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const gstin = body.gstin || "";
    const includeReturns = Boolean(body.includeReturns);
    const fy = body.fy || "2024-25";

    if (!gstin) {
      return NextResponse.json(
        { success: false, error: "Field 'gstin' is required in request body." },
        { status: 400 }
      );
    }

    const validation = validateGstinDetailed(gstin);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          validation,
          error: validation.error,
          offlineOnly: true
        },
        { status: 400 }
      );
    }

    const result = await lookupGstin(gstin);

    if (includeReturns && result.success) {
      const returnsResult = await lookupGstReturns(gstin, fy);
      return NextResponse.json({
        ...result,
        returnsData: returnsResult
      });
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Invalid request payload." },
      { status: 500 }
    );
  }
}
