import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { DscRecord } from "@/lib/types";

export async function GET() {
  try {
    const db = ensureDatabase();
    return NextResponse.json({ success: true, tokens: db.dscTokens || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { tokenId, action, staffName, purpose, actorName } = body;

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      entityId,
      entityName,
      groupId,
      holderName,
      pan,
      serialNumber,
      tokenType,
      validTill,
      vaultSlot,
      tokenPin,
      actorName,
    } = body;

    const db = ensureDatabase();
    if (!db.dscTokens) db.dscTokens = [];

    let entName = entityName;
    if (!entName && entityId) {
      const found = db.clients.find((c) => c.id === entityId);
      if (found) entName = found.name;
    }

    const expiryDate = validTill || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const daysToExpiry = Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const newToken: DscRecord = {
      id: body.id || `DSC-${Date.now()}`,
      entityId: entityId || "ENT-PRACTICE-GENERAL",
      entityName: entName || "Practice Client",
      groupId: groupId || "GRP-001",
      holderName: holderName || "Director / Partner",
      pan: pan || "PAN_PENDING",
      serialNumber: serialNumber || `USB-${Math.floor(1000 + Math.random() * 9000)}`,
      tokenType: tokenType || "ePass2003",
      validTill: expiryDate,
      daysToExpiry,
      expiryStatus: daysToExpiry <= 0 ? "EXPIRED" : daysToExpiry <= 30 ? "EXPIRING_SOON" : "ACTIVE",
      currentCustodian: "Firm Master Safe",
      vaultSlot: vaultSlot || "Cabinet A - Locker 01",
      tokenPin,
    };

    db.dscTokens.push(newToken);
    await saveDatabase(db);

    await logAuditEvent(
      actorName || "CA Partner",
      "PARTNER",
      newToken.entityName,
      "DSC Hardware Enrolled",
      `Physical ${newToken.tokenType} dongle (${newToken.serialNumber}) for ${newToken.holderName} enrolled into vault slot ${newToken.vaultSlot}.`,
      "SECURITY"
    );

    return NextResponse.json({ success: true, token: newToken });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Token ID required" }, { status: 400 });
    }

    const db = ensureDatabase();
    if (!db.dscTokens) db.dscTokens = [];

    const found = db.dscTokens.find((t) => t.id === id);
    db.dscTokens = db.dscTokens.filter((t) => t.id !== id);
    await saveDatabase(db);

    if (found) {
      await logAuditEvent(
        "CA Partner",
        "PARTNER",
        found.entityName,
        "DSC Hardware Discharged",
        `Physical DSC token (${found.serialNumber}) discharged and removed from vault ledger.`,
        "SECURITY"
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
