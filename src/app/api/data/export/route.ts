import { NextResponse } from "next/server";
import { ensureDatabase, logAuditEvent, saveDatabase } from "@/lib/server/db";

function safeFilePart(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "firm";
}

export async function GET() {
  try {
    const db = await ensureDatabase();
    await logAuditEvent(
      "Firm user",
      "PARTNER",
      "Firm workspace",
      "Firm data export generated",
      "A partner generated a JSON export of core workspace records and document metadata. File contents and credentials are excluded.",
      "SECURITY",
      db,
    );
    await saveDatabase(db);

    const exportedAt = new Date().toISOString();
    const payload = {
      exportVersion: 1,
      exportedAt,
      firm: {
        name: db.firmMetrics.name,
        frn: db.firmMetrics.frn,
      },
      groups: db.groups,
      clients: db.clients,
      tasks: db.tasks,
      documents: db.documents.map(({ storagePath: _storagePath, ...document }) => document),
      invoices: db.invoices,
      notices: db.notices,
      auditTrail: db.auditTrail,
      note: "Document contents, credentials, bank statement transactions, and payment configuration are not included.",
    };
    const date = exportedAt.slice(0, 10);
    const filename = `brains-taxes-${safeFilePart(db.firmMetrics.frn || "firm")}-${date}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Firm data export could not be prepared. Refresh and try again." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
