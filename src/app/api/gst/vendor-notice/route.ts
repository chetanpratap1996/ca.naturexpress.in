import { NextRequest, NextResponse } from "next/server";
import { VendorNoticeGenerator, VendorNoticeParams } from "@/lib/gst/vendorNoticeGenerator";

export async function POST(req: NextRequest) {
  try {
    const body: VendorNoticeParams = await req.json();

    if (!body.buyerEntityName || !body.buyerGstin || !body.vendorTradeName || !body.vendorGstin || !Array.isArray(body.invoices)) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: buyerEntityName, buyerGstin, vendorTradeName, vendorGstin, invoices"
      }, { status: 400 });
    }

    const notice = VendorNoticeGenerator.generateNotice(body);

    return NextResponse.json({
      success: true,
      notice
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to generate vendor notice"
    }, { status: 500 });
  }
}
