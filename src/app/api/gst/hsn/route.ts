import { NextRequest, NextResponse } from "next/server";
import { enforceApiRole } from "@/lib/auth/serverAuth";
import { searchHsnSac, getHsnItem, computeGstForHsn } from "@/lib/gst/hsnMaster";

export async function GET(request: NextRequest) {
  const { errorResponse } = await enforceApiRole(request, ["PARTNER", "ARTICLE", "TEAM"]);
  if (errorResponse) return errorResponse;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const code = searchParams.get("code");
  const amount = searchParams.get("amount");
  const isInterState = searchParams.get("isInterState") === "true";

  // If specific code requested
  if (code) {
    const item = getHsnItem(code);
    if (!item) {
      return NextResponse.json({ success: false, error: `HSN/SAC Code '${code}' not found.` }, { status: 404 });
    }

    if (amount) {
      const taxable = parseFloat(amount) || 0;
      const breakdown = computeGstForHsn(taxable, code, isInterState);
      return NextResponse.json({ success: true, item, breakdown });
    }

    return NextResponse.json({ success: true, item });
  }

  // Fuzzy search query
  const items = searchHsnSac(q, 20);
  return NextResponse.json({
    success: true,
    count: items.length,
    query: q,
    items
  });
}
