import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase } from "@/lib/server/db";

export async function GET() {
  try {
    const data = ensureDatabase();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
