import { NextResponse } from "next/server";
import { getPostgresPool } from "@/lib/server/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  const secretConfigured = Boolean(
    (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "").length >= 16 &&
      !(process.env.NEXTAUTH_SECRET || "").includes("generate-secure")
  );

  try {
    const pool = getPostgresPool();
    const res = await pool.query("SELECT count(*)::int as firms_count FROM public.firms");
    return NextResponse.json({
      status: "ok",
      database: "connected",
      firmsCount: res.rows[0]?.firms_count || 0,
      authSecretConfigured: secretConfigured,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Health check DB error:", err?.message || err);
    return NextResponse.json(
      {
        status: "degraded",
        database: "unreachable",
        authSecretConfigured: secretConfigured,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
