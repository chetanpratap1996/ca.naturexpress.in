import { NextRequest, NextResponse } from "next/server";
import { parseXbrlFinancials } from "@/lib/parsers/xbrlParser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let xbrlContent = "";
    let overrideCin = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "No XBRL file uploaded." }, { status: 400 });
      }
      xbrlContent = await file.text();
      const cinVal = formData.get("cin");
      if (cinVal) overrideCin = String(cinVal);
    } else {
      const body = await req.json();
      xbrlContent = body.xbrlContent || body.content || "";
      if (body.cin) overrideCin = body.cin;
    }

    if (!xbrlContent || xbrlContent.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Empty XBRL document content." }, { status: 400 });
    }

    const result = parseXbrlFinancials(xbrlContent, overrideCin);

    if (!result.success && result.errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: result.errors.join("; "),
        warnings: result.warnings
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      financials: result.financials,
      cinAnalysis: result.cinAnalysis,
      schedule3Ledgers: result.schedule3Ledgers,
      warnings: result.warnings
    });
  } catch (err: any) {
    console.error("[XbrlParserAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: `Failed to parse MCA XBRL document: ${err.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
