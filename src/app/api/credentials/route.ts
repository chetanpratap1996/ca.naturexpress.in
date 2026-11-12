import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { PortalCredential } from "@/lib/types";

export async function GET() {
  try {
    const db = ensureDatabase();
    return NextResponse.json({ success: true, credentials: db.portalCredentials || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = ensureDatabase();
    if (!db.portalCredentials) db.portalCredentials = [];

    // Check for bulk import
    if (body.bulk && Array.isArray(body.items)) {
      const added: PortalCredential[] = [];
      const timestamp = new Date().toISOString();

      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        if (!item.username || !item.password) continue;

        // Attempt to match entity if entityId is not directly provided
        let matchedEntity = db.clients.find(
          (c) =>
            c.id === item.entityId ||
            (item.pan && c.pan?.toLowerCase() === item.pan.toLowerCase()) ||
            (item.gstin && c.gstin?.toLowerCase() === item.gstin.toLowerCase()) ||
            (item.entityName && c.name?.toLowerCase().includes(item.entityName.toLowerCase()))
        );

        const entityId = matchedEntity?.id || item.entityId || "ENT-PRACTICE-GENERAL";
        const entityName = matchedEntity?.name || item.entityName || "Practice Client";

        const newCred: PortalCredential = {
          id: item.id || `CRED-${Date.now()}-${i}`,
          entityId,
          entityName,
          groupId: matchedEntity?.groupId || item.groupId,
          portalType: item.portalType || "OTHER",
          portalName: item.portalName || `${item.portalType || "Govt"} Portal`,
          loginUrl: item.loginUrl || getPortalUrl(item.portalType),
          username: String(item.username).trim(),
          password: String(item.password).trim(),
          secondaryIdentifier: item.secondaryIdentifier || item.pan || item.gstin || matchedEntity?.pan,
          registeredMobile: item.registeredMobile || matchedEntity?.primaryContact?.phone,
          registeredEmail: item.registeredEmail || matchedEntity?.primaryContact?.email,
          tokenPin: item.tokenPin,
          notes: item.notes || "Imported via bulk credentials batch",
          lastVerifiedAt: timestamp,
          lastChangedDate: new Date().toISOString().split("T")[0],
        };

        db.portalCredentials.push(newCred);
        added.push(newCred);
      }

      await saveDatabase(db);

      await logAuditEvent(
        body.actorName || "CA Partner / Article",
        "PARTNER",
        "Firm Keys Vault",
        "Bulk Credentials Imported",
        `Imported ${added.length} client portal credentials into Practice Vault.`,
        "SECURITY"
      );

      return NextResponse.json({ success: true, count: added.length, credentials: added });
    }

    // Single item creation
    const {
      entityId,
      entityName,
      groupId,
      portalType,
      portalName,
      loginUrl,
      username,
      password,
      secondaryIdentifier,
      registeredMobile,
      registeredEmail,
      tokenPin,
      notes,
      actorName,
      actorRole
    } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 });
    }

    let entName = entityName;
    if (!entName && entityId) {
      const found = db.clients.find((c) => c.id === entityId);
      if (found) entName = found.name;
    }

    const newCred: PortalCredential = {
      id: body.id || `CRED-${Date.now()}`,
      entityId: entityId || "ENT-PRACTICE-GENERAL",
      entityName: entName || "Practice Client",
      groupId,
      portalType: portalType || "OTHER",
      portalName: portalName || `${portalType || "Govt"} Portal`,
      loginUrl: loginUrl || getPortalUrl(portalType),
      username: String(username).trim(),
      password: String(password).trim(),
      secondaryIdentifier,
      registeredMobile,
      registeredEmail,
      tokenPin,
      notes,
      lastVerifiedAt: new Date().toISOString(),
      lastChangedDate: new Date().toISOString().split("T")[0],
    };

    db.portalCredentials.push(newCred);
    await saveDatabase(db);

    await logAuditEvent(
      actorName || "CA Partner",
      actorRole || "PARTNER",
      newCred.entityName,
      "Portal Credential Added",
      `Saved ${newCred.portalType} credential for ${newCred.username} (${newCred.entityName})`,
      "SECURITY"
    );

    return NextResponse.json({ success: true, credential: newCred });
  } catch (error: any) {
    console.error("Failed to add credential:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, password, portalType, portalName, loginUrl, secondaryIdentifier, registeredMobile, registeredEmail, tokenPin, notes, actorName, actorRole } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Credential ID is required" }, { status: 400 });
    }

    const db = ensureDatabase();
    if (!db.portalCredentials) db.portalCredentials = [];

    const index = db.portalCredentials.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: "Credential not found" }, { status: 404 });
    }

    const existing = db.portalCredentials[index];
    const passwordChanged = password && password !== existing.password;

    db.portalCredentials[index] = {
      ...existing,
      username: username !== undefined ? String(username).trim() : existing.username,
      password: password !== undefined ? String(password).trim() : existing.password,
      portalType: portalType || existing.portalType,
      portalName: portalName || existing.portalName,
      loginUrl: loginUrl !== undefined ? loginUrl : existing.loginUrl,
      secondaryIdentifier: secondaryIdentifier !== undefined ? secondaryIdentifier : existing.secondaryIdentifier,
      registeredMobile: registeredMobile !== undefined ? registeredMobile : existing.registeredMobile,
      registeredEmail: registeredEmail !== undefined ? registeredEmail : existing.registeredEmail,
      tokenPin: tokenPin !== undefined ? tokenPin : existing.tokenPin,
      notes: notes !== undefined ? notes : existing.notes,
      lastVerifiedAt: new Date().toISOString(),
      lastChangedDate: passwordChanged ? new Date().toISOString().split("T")[0] : existing.lastChangedDate,
    };

    await saveDatabase(db);

    await logAuditEvent(
      actorName || "CA Partner / Article",
      actorRole || "ARTICLE",
      existing.entityName,
      passwordChanged ? "Portal Password Rotated" : "Portal Credential Updated",
      `${passwordChanged ? "Password updated" : "Details updated"} for ${existing.portalType} (${existing.entityName})`,
      "SECURITY"
    );

    return NextResponse.json({ success: true, credential: db.portalCredentials[index] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID parameter required" }, { status: 400 });
    }

    const db = ensureDatabase();
    if (!db.portalCredentials) db.portalCredentials = [];

    const found = db.portalCredentials.find((c) => c.id === id);
    db.portalCredentials = db.portalCredentials.filter((c) => c.id !== id);

    await saveDatabase(db);

    if (found) {
      await logAuditEvent(
        "CA Partner",
        "PARTNER",
        found.entityName,
        "Portal Credential Deleted",
        `Removed ${found.portalType} login credentials for ${found.username} from firm vault.`,
        "SECURITY"
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function getPortalUrl(portalType?: string): string {
  switch (portalType) {
    case "GST":
      return "https://services.gst.gov.in/services/login";
    case "INCOME_TAX":
      return "https://eportal.incometax.gov.in/iec/foservices/#/login";
    case "MCA_V3":
      return "https://www.mca.gov.in/mcafoportal/login.html";
    case "TRACES":
      return "https://www.tdscpc.gov.in/app/login.xhtml";
    case "EPFO":
      return "https://unifiedportal-emp.epfindia.gov.in/epfo/";
    case "ESIC":
      return "https://www.esic.in/EmployerPortal/ESICInsurancePortal/Portal_LoginNew.aspx";
    case "ICEGATE":
      return "https://www.icegate.gov.in/";
    default:
      return "";
  }
}
