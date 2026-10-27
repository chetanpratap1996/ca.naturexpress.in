import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  try {
    const db = ensureDatabase();
    return NextResponse.json({
      success: true,
      partnerMetrics: db.partnerMetrics || [],
      securityLogs: db.staffSecurityLogs || [],
      firmMetrics: db.firmMetrics
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
