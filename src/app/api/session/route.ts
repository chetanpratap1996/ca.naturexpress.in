import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ success: false, error: auth.error || "Authentication required." }, { status: 401 });
    }
    return NextResponse.json({ success: true, user: auth.user });
  } catch (err) {
    console.error("[Session API] Error:", err);
    return NextResponse.json({ success: false, error: "Session verification failed." }, { status: 500 });
  }
}
