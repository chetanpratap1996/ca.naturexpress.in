import { NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/server/db";

export async function GET() {
  try {
    const data = await ensureDatabase();
    return NextResponse.json({
      success: true,
      source: process.env.NODE_ENV === "production" ? "POSTGRES_FIRM_STATE" : "LOCAL_DEMO_STATE",
      data,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Firm data is temporarily unavailable." },
      { status: 503 }
    );
  }
}
