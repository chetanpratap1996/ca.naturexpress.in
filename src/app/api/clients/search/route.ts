import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid } from "@/lib/server/pgHelpers";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required.", clients: [], total: 0 },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const typeFilter = searchParams.get("type") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const offset = (page - 1) * limit;

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    const conditions: string[] = ["ce.firm_id = $1"];
    const params: any[] = [firmId];

    if (query) {
      params.push(`%${query}%`);
      const idx = params.length;
      conditions.push(
        `(ce.entity_name ILIKE $${idx} OR ce.pan ILIKE $${idx} OR COALESCE(ce.gstin,'') ILIKE $${idx} OR COALESCE(ce.cin,'') ILIKE $${idx} OR COALESCE(ce.primary_contact_name,'') ILIKE $${idx} OR COALESCE(ce.primary_contact_phone,'') ILIKE $${idx} OR COALESCE(ce.primary_contact_email,'') ILIKE $${idx})`
      );
    }
    if (typeFilter && typeFilter !== "ALL") {
      params.push(typeFilter);
      conditions.push(`ce.type::text = $${params.length}`);
    }

    const whereClause = conditions.join(" AND ");
    const countRes = await pool.query(
      `SELECT count(*)::int as cnt FROM public.client_entities ce WHERE ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.cnt || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await pool.query(
      `SELECT ce.*, cg.group_name
       FROM public.client_entities ce
       LEFT JOIN public.client_groups cg ON ce.group_id = cg.id
       WHERE ${whereClause}
       ORDER BY ce.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const clients = rows.map((e: any) => ({
      id: e.id,
      groupId: e.group_id,
      groupName: e.group_name || "Direct Practice Clients",
      name: e.entity_name,
      type: e.type,
      pan: e.pan,
      gstin: e.gstin || undefined,
      cin: e.cin || undefined,
      tan: e.tan || undefined,
      turnoverCr: Number(e.turnover_cr || 0),
      incorporationYear: e.incorporation_year || 2024,
      penaltyRiskAccrued: Number(e.penalty_risk_accrued || 0),
      partnerInCharge: DEFAULT_FIRM_BRANDING.managingPartner,
      assignedArticle: "Practice Team",
      primaryContact: {
        name: e.primary_contact_name || "Authorized Signatory",
        phone: e.primary_contact_phone || "",
        email: e.primary_contact_email || "",
        designation: e.primary_contact_designation || "Director / Authorized Signatory",
      },
    }));

    return NextResponse.json({
      success: true,
      clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    console.error("Error in /api/clients/search:", error);
    return NextResponse.json(
      { success: false, error: "Internal search error", clients: [], total: 0 },
      { status: 500 }
    );
  }
}
