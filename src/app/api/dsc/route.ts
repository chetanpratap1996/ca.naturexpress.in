import { NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
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
    if (index === -1) {
      return NextResponse.json({ success: false, error: "DSC token not found" }, { status: 404 });
    }

    const token = db.dscTokens[index];

    if (action === "CHECKOUT") {
      token.currentCustodian = staffName || "Rohan Verma (Article)";
      token.checkedOutAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      token.checkedOutPurpose = purpose || "Statutory Department Sign-off";

      await logAuditEvent(
        actorName || staffName || "Staff Custodian",
        "ARTICLE",
        token.entityName,
        "Physical DSC Token Checked Out",
        `DSC Token ${token.serialNumber} (${token.holderName}) checked out from Master Safe by ${token.currentCustodian} for: ${token.checkedOutPurpose}`,
        "SECURITY"
      );
    } else if (action === "RETURN") {
      const prevCustodian = token.currentCustodian;
      token.currentCustodian = "Firm Master Safe";
      token.checkedOutAt = undefined;
      token.checkedOutPurpose = undefined;

      await logAuditEvent(
        actorName || "Staff Custodian",
        "ARTICLE",
        token.entityName,
        "Physical DSC Token Returned",
        `DSC Token ${token.serialNumber} (${token.holderName}) returned to ${token.vaultSlot} by ${prevCustodian}`,
        "SECURITY"
      );
    }

    db.dscTokens[index] = token;
    await saveDatabase(db);

    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
