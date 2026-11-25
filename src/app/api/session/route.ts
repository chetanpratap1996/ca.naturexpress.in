import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required." },
        { status: 401 }
      );
    }

    const user = { ...auth.user };
    if (auth.role !== "CLIENT" && auth.firmId) {
      try {
        const pool = getPostgresPool();
        const profRes = await pool.query(
          `SELECT payload->'allowedTools' as tools
           FROM public.firm_workspace_records
           WHERE firm_id::text = $1 AND record_type = 'STAFF_PROFILE' AND payload->>'id' = $2
           LIMIT 1`,
          [auth.firmId, auth.user.id]
        );
        if (Array.isArray(profRes.rows[0]?.tools)) {
          user.allowedTools = profRes.rows[0].tools;
        }
      } catch {}
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("[Session API] Error:", err);
    return NextResponse.json({ success: false, error: "Session verification failed." }, { status: 500 });
  }
}
