import { NextRequest, NextResponse } from "next/server";
import { DscRecord } from "@/lib/types";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog } from "@/lib/server/pgHelpers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapDscRow(r: any, entityMap: Map<string, { name: string; groupId: string }>): DscRecord {
  const ent = entityMap.get(r.entity_id);
  const validTill = r.valid_till ? new Date(r.valid_till).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
  const daysToExpiry = Math.ceil((new Date(validTill).getTime() - Date.now()) / 86400000);
  return {
    id: r.id,
    entityId: r.entity_id,
    entityName: ent?.name || "Practice Client",
    groupId: ent?.groupId || "",
    holderName: r.holder_name,
    pan: r.holder_pan,
    serialNumber: r.serial_number,
    tokenType: r.token_type || "ePass2003",
    validTill,
    daysToExpiry,
    expiryStatus: daysToExpiry <= 0 ? "EXPIRED" : daysToExpiry <= 30 ? "EXPIRING_SOON" : "ACTIVE",
    currentCustodian: r.checked_out_at ? "Checked Out (Staff)" : "Firm Master Safe",
    vaultSlot: r.vault_slot || "Cabinet A - Locker 01",
    checkedOutAt: r.checked_out_at ? new Date(r.checked_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
    checkedOutPurpose: r.checked_out_purpose || undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const [{ rows: entRows }, { rows: dscRows }] = await Promise.all([
      pool.query("SELECT id, entity_name, group_id FROM public.client_entities WHERE firm_id = $1", [firmId]),
      pool.query("SELECT * FROM public.dsc_vault WHERE firm_id = $1 ORDER BY valid_till ASC", [firmId]),
    ]);

    const entityMap = new Map<string, { name: string; groupId: string }>();
    for (const e of entRows) {
      entityMap.set(e.id, { name: e.entity_name, groupId: e.group_id });
    }

    return NextResponse.json({
      success: true,
      tokens: dscRows.map((r: any) => mapDscRow(r, entityMap)),
    });
  } catch (error: any) {
    console.error("GET /api/dsc error:", error);
    return NextResponse.json({ success: false, error: "Failed to load DSC vault." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await req.json();
    const { tokenId, action, purpose } = body;
    if (!tokenId || !UUID_REGEX.test(String(tokenId))) {
      return NextResponse.json({ success: false, error: "Valid tokenId is required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const custodianUuid = action === "CHECKOUT" && auth.user?.id && UUID_REGEX.test(auth.user.id) ? auth.user.id : null;
    const checkedOutAt = action === "CHECKOUT" ? new Date().toISOString() : null;
    const checkedOutPurpose = action === "CHECKOUT" ? String(purpose || "Statutory Department Sign-off").slice(0, 255) : null;

    const upd = await pool.query(
      `UPDATE public.dsc_vault
       SET current_custodian_id = $1, checked_out_at = $2, checked_out_purpose = $3
       WHERE id = $4 AND firm_id = $5
       RETURNING *`,
      [custodianUuid, checkedOutAt, checkedOutPurpose, tokenId, firmId]
    );
    if (upd.rows.length === 0) {
      return NextResponse.json({ success: false, error: "DSC token not found." }, { status: 404 });
    }

    const row = upd.rows[0];
    const entRes = await pool.query("SELECT entity_name, group_id FROM public.client_entities WHERE id = $1 LIMIT 1", [row.entity_id]);
    const entityName = entRes.rows[0]?.entity_name || "Practice Client";

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Staff Custodian",
      actorRole: auth.role || "ARTICLE",
      entityId: row.entity_id,
      entityName,
      action: action === "CHECKOUT" ? "Physical DSC Token Checked Out" : "Physical DSC Token Returned",
      details:
        action === "CHECKOUT"
          ? `DSC Token ${row.serial_number} (${row.holder_name}) checked out by ${auth.userName} for: ${checkedOutPurpose}`
          : `DSC Token ${row.serial_number} (${row.holder_name}) returned to Master Safe`,
      category: "SECURITY",
    });

    const entityMap = new Map([[row.entity_id, { name: entityName, groupId: entRes.rows[0]?.group_id || "" }]]);
    return NextResponse.json({ success: true, token: mapDscRow(row, entityMap) });
  } catch (error: any) {
    console.error("PATCH /api/dsc error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await req.json();
    const { entityId, holderName, pan, serialNumber, tokenType, validTill, vaultSlot } = body;

    if (!entityId || !UUID_REGEX.test(String(entityId))) {
      return NextResponse.json({ success: false, error: "Valid entityId is required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const entRes = await pool.query(
      "SELECT id, entity_name, group_id, pan FROM public.client_entities WHERE id = $1 AND firm_id = $2 LIMIT 1",
      [entityId, firmId]
    );
    if (entRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client entity not found." }, { status: 404 });
    }
    const ent = entRes.rows[0];

    const expiryDate = validTill || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];
    const cleanPan = (pan || ent.pan || "AAAAA0000A").toUpperCase();
    const serial = serialNumber || `USB-${Math.floor(1000 + Math.random() * 9000)}`;

    const ins = await pool.query(
      `INSERT INTO public.dsc_vault (
        firm_id, entity_id, holder_name, holder_pan, serial_number, token_type, valid_till, vault_slot
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [firmId, ent.id, holderName || "Director / Partner", cleanPan, serial, tokenType || "ePass2003", expiryDate, vaultSlot || "Cabinet A - Locker 01"]
    );

    const row = ins.rows[0];
    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Firm Staff",
      actorRole: auth.role || "PARTNER",
      entityId: ent.id,
      entityName: ent.entity_name,
      action: "DSC Hardware Enrolled",
      details: `Enrolled ${row.token_type} (${row.serial_number}) for ${row.holder_name} in ${row.vault_slot}.`,
      category: "SECURITY",
    });

    const entityMap = new Map([[ent.id, { name: ent.entity_name, groupId: ent.group_id }]]);
    return NextResponse.json({ success: true, token: mapDscRow(row, entityMap) });
  } catch (error: any) {
    console.error("POST /api/dsc error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Partner privileges required to discharge DSC token." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: "Valid token ID required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const del = await pool.query(
      "DELETE FROM public.dsc_vault WHERE id = $1 AND firm_id = $2 RETURNING entity_id, serial_number, holder_name",
      [id, firmId]
    );
    if (del.rows.length === 0) {
      return NextResponse.json({ success: false, error: "DSC token not found." }, { status: 404 });
    }

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Firm Partner",
      actorRole: "PARTNER",
      entityId: del.rows[0].entity_id,
      entityName: del.rows[0].holder_name,
      action: "DSC Hardware Discharged",
      details: `Discharged physical DSC token (${del.rows[0].serial_number}).`,
      category: "SECURITY",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/dsc error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
