import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { DscRecord } from "@/lib/types";
import { authenticateServerRequest, createRequestSupabaseClient, writeServerAuditLog } from "@/lib/auth/serverAuth";

export async function GET(request: NextRequest) {
  const auth = await authenticateServerRequest(request);
  if (!auth.isAuthenticated || !auth.user) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const authUser = auth.user;
  if (process.env.NODE_ENV === "production") {
    const client = createRequestSupabaseClient(request);
    if (!client || !auth.firmId) return NextResponse.json({ success: false, error: "Supabase session unavailable." }, { status: 503 });
    const [{ data: rows, error }, { data: entities }] = await Promise.all([
      client.from("dsc_vault").select("*").eq("firm_id", auth.firmId),
      client.from("client_entities").select("id, entity_name, group_id").eq("firm_id", auth.firmId),
    ]);
    if (error) return NextResponse.json({ success: false, error: "Could not load the DSC custody register." }, { status: 503 });
    const now = Date.now();
    const tokens: DscRecord[] = (rows || []).map((row: any) => {
      const entity = entities?.find((item: any) => item.id === row.entity_id);
      const validTill = row.valid_till ? new Date(row.valid_till) : new Date(0);
      const daysToExpiry = Math.ceil((validTill.getTime() - now) / 86400000);
      return {
        id: row.id, entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity", groupId: entity?.group_id || "",
        holderName: row.holder_name, pan: row.holder_pan, serialNumber: row.serial_number, tokenType: row.token_type,
        validTill: validTill.toISOString().slice(0, 10), daysToExpiry,
        expiryStatus: daysToExpiry <= 0 ? "EXPIRED" : daysToExpiry <= 30 ? "EXPIRING_SOON" : "ACTIVE",
        currentCustodian: row.current_custodian_id === authUser.id ? authUser.name : (row.current_custodian_id ? "Assigned staff" : "Firm Master Safe"),
        vaultSlot: row.vault_slot, checkedOutAt: row.checked_out_at || undefined, checkedOutPurpose: row.checked_out_purpose || undefined,
      };
    });
    return NextResponse.json({ success: true, tokens });
  }
  try {
    const db = ensureDatabase();
    return NextResponse.json({ success: true, tokens: db.dscTokens || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenId, action, staffName, purpose, actorName } = body;

    if (process.env.NODE_ENV === "production") {
      const auth = await authenticateServerRequest(req);
      const client = createRequestSupabaseClient(req);
      if (!auth.isAuthenticated || auth.role !== "PARTNER" || !auth.firmId || !auth.user || !client) {
        return NextResponse.json({ success: false, error: "Partner access required for DSC custody changes." }, { status: 403 });
      }
      if (!["CHECKOUT", "RETURN"].includes(action)) return NextResponse.json({ success: false, error: "Invalid custody action." }, { status: 400 });
      const { data: current } = await client.from("dsc_vault").select("*").eq("id", tokenId).eq("firm_id", auth.firmId).maybeSingle();
      if (!current) return NextResponse.json({ success: false, error: "DSC record not found or not accessible." }, { status: 404 });
      const update = action === "CHECKOUT"
        ? { current_custodian_id: auth.user.id, checked_out_at: new Date().toISOString(), checked_out_purpose: String(purpose || "Statutory signing").slice(0, 500) }
        : { current_custodian_id: null, checked_out_at: null, checked_out_purpose: null };
      const { data: row, error } = await client.from("dsc_vault").update(update).eq("id", tokenId).eq("firm_id", auth.firmId).select("*").single();
      if (error || !row) return NextResponse.json({ success: false, error: "DSC custody update could not be saved." }, { status: 400 });
      const { data: entity } = await client.from("client_entities").select("entity_name, group_id").eq("id", row.entity_id).maybeSingle();
      const audit = await writeServerAuditLog(req, auth, {
        entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity", action: action === "CHECKOUT" ? "DSC Checked Out" : "DSC Returned",
        details: `Custody status changed for DSC serial ${row.serial_number}.`, category: "SECURITY",
      });
      if (audit.error) console.error("Audit log write failed for DSC custody update.");
      const validTill = row.valid_till ? new Date(row.valid_till) : new Date(0);
      const daysToExpiry = Math.ceil((validTill.getTime() - Date.now()) / 86400000);
      const token: DscRecord = {
        id: row.id, entityId: row.entity_id, entityName: entity?.entity_name || "Client Entity", groupId: entity?.group_id || "",
        holderName: row.holder_name, pan: row.holder_pan, serialNumber: row.serial_number, tokenType: row.token_type,
        validTill: validTill.toISOString().slice(0, 10), daysToExpiry,
        expiryStatus: daysToExpiry <= 0 ? "EXPIRED" : daysToExpiry <= 30 ? "EXPIRING_SOON" : "ACTIVE",
        currentCustodian: row.current_custodian_id ? auth.user.name : "Firm Master Safe", vaultSlot: row.vault_slot,
        checkedOutAt: row.checked_out_at || undefined, checkedOutPurpose: row.checked_out_purpose || undefined,
      };
      return NextResponse.json({ success: true, token });
    }

    const db = ensureDatabase();
    if (!db.dscTokens) db.dscTokens = [];

    const index = db.dscTokens.findIndex((t) => t.id === tokenId);
    let token: DscRecord | null = null;

    if (index !== -1) {
      token = db.dscTokens[index];
    }

    const currentCustodian = action === "CHECKOUT" 
      ? (staffName || "Kriti Jain (Article)") 
      : "Firm Master Safe";

    const checkedOutAt = action === "CHECKOUT" 
      ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
      : undefined;

    const checkedOutPurpose = action === "CHECKOUT" 
      ? (purpose || "Statutory Department Sign-off") 
      : undefined;

    if (token) {
      token.currentCustodian = currentCustodian;
      token.checkedOutAt = checkedOutAt;
      token.checkedOutPurpose = checkedOutPurpose;
      db.dscTokens[index] = token;
      await saveDatabase(db);
    }

    // Persist to Supabase if connected
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("dsc_vault")
          .update({
            current_custodian: currentCustodian,
            checked_out_at: checkedOutAt ? new Date().toISOString() : null,
            checked_out_purpose: checkedOutPurpose || null,
          })
          .eq("id", tokenId);
      } catch (sbErr) {
        console.warn("Supabase DSC status sync failed:", sbErr);
      }
    }

    const entityLabel = token?.entityName || "Practice Client";
    const holderLabel = token?.holderName || "DSC Token";
    const serialLabel = token?.serialNumber || tokenId;

    await logAuditEvent(
      actorName || staffName || "Staff Custodian",
      "ARTICLE",
      entityLabel,
      action === "CHECKOUT" ? "Physical DSC Token Checked Out" : "Physical DSC Token Returned",
      action === "CHECKOUT"
        ? `DSC Token ${serialLabel} (${holderLabel}) checked out by ${currentCustodian} for: ${checkedOutPurpose}`
        : `DSC Token ${serialLabel} (${holderLabel}) returned safely to Master Safe`,
      "SECURITY"
    );

    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
