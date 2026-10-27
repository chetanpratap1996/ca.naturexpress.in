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
