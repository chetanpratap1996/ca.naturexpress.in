import { NextRequest, NextResponse } from "next/server";
import { PortalCredential } from "@/lib/types";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  appendPgAuditLog,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
} from "@/lib/server/pgHelpers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const records = await listWorkspaceRecords<PortalCredential>(firmId, "PORTAL_CREDENTIAL");
    return NextResponse.json({ success: true, credentials: records.map((r) => r.payload) });
  } catch (error: any) {
    console.error("GET /api/credentials error:", error);
    return NextResponse.json({ success: false, error: "Failed to load credentials." }, { status: 500 });
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

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const body = await req.json();
    const { rows: clients } = await pool.query(
      "SELECT id, entity_name, group_id, pan, gstin, primary_contact_phone, primary_contact_email FROM public.client_entities WHERE firm_id = $1",
      [firmId]
    );

    if (body.bulk && Array.isArray(body.items)) {
      const added: PortalCredential[] = [];
      const timestamp = new Date().toISOString();

      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        if (!item.username || !item.password) continue;

        const matchedEntity = clients.find(
          (c: any) =>
            c.id === item.entityId ||
            (item.pan && c.pan?.toLowerCase() === String(item.pan).toLowerCase()) ||
            (item.gstin && c.gstin?.toLowerCase() === String(item.gstin).toLowerCase()) ||
            (item.entityName && c.entity_name?.toLowerCase().includes(String(item.entityName).toLowerCase()))
        );

        const credId = item.id || `CRED-${Date.now()}-${i}`;
        const newCred: PortalCredential = {
          id: credId,
          entityId: matchedEntity?.id || item.entityId || "ENT-PRACTICE-GENERAL",
          entityName: matchedEntity?.entity_name || item.entityName || "Practice Client",
          groupId: matchedEntity?.group_id || item.groupId,
          portalType: item.portalType || "OTHER",
          portalName: item.portalName || `${item.portalType || "Govt"} Portal`,
          loginUrl: item.loginUrl || getPortalUrl(item.portalType),
          username: String(item.username).trim(),
          password: String(item.password).trim(),
          secondaryIdentifier: item.secondaryIdentifier || item.pan || item.gstin || matchedEntity?.pan,
          registeredMobile: item.registeredMobile || matchedEntity?.primary_contact_phone,
          registeredEmail: item.registeredEmail || matchedEntity?.primary_contact_email,
          tokenPin: item.tokenPin,
          notes: item.notes || "Imported via bulk credentials batch",
          lastVerifiedAt: timestamp,
          lastChangedDate: timestamp.split("T")[0],
        };

        await upsertWorkspaceRecord({
          firmId,
          entityId: UUID_REGEX.test(newCred.entityId) ? newCred.entityId : null,
          recordType: "PORTAL_CREDENTIAL",
          matchKey: "id",
          matchValue: newCred.id,
          payload: newCred,
        });
        added.push(newCred);
      }

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Firm Staff",
        actorRole: auth.role || "PARTNER",
        entityName: "Firm Keys Vault",
        action: "Bulk Credentials Imported",
        details: `Imported ${added.length} client portal credentials into Firm Vault.`,
        category: "SECURITY",
      });

      return NextResponse.json({ success: true, count: added.length, credentials: added });
    }

    const { entityId, entityName, groupId, portalType, portalName, loginUrl, username, password, secondaryIdentifier, registeredMobile, registeredEmail, tokenPin, notes } = body;
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required." }, { status: 400 });
    }

    const matched = entityId ? clients.find((c: any) => c.id === entityId) : null;
    const newCred: PortalCredential = {
      id: body.id || `CRED-${Date.now()}`,
      entityId: matched?.id || entityId || "ENT-PRACTICE-GENERAL",
      entityName: matched?.entity_name || entityName || "Practice Client",
      groupId: matched?.group_id || groupId,
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

    await upsertWorkspaceRecord({
      firmId,
      entityId: UUID_REGEX.test(newCred.entityId) ? newCred.entityId : null,
      recordType: "PORTAL_CREDENTIAL",
      matchKey: "id",
      matchValue: newCred.id,
      payload: newCred,
    });

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Firm Staff",
      actorRole: auth.role || "PARTNER",
      entityId: UUID_REGEX.test(newCred.entityId) ? newCred.entityId : null,
      entityName: newCred.entityName,
      action: "Portal Credential Added",
      details: `Saved ${newCred.portalType} credential for ${newCred.username} (${newCred.entityName}).`,
      category: "SECURITY",
    });

    return NextResponse.json({ success: true, credential: newCred });
  } catch (error: any) {
    console.error("POST /api/credentials error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await req.json();
    const { id, username, password, portalType, portalName, loginUrl, secondaryIdentifier, registeredMobile, registeredEmail, tokenPin, notes } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Credential ID is required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const records = await listWorkspaceRecords<PortalCredential>(firmId, "PORTAL_CREDENTIAL");
    const found = records.find((r) => r.payload?.id === id);
    if (!found) {
      return NextResponse.json({ success: false, error: "Credential not found." }, { status: 404 });
    }

    const existing = found.payload;
    const passwordChanged = Boolean(password && password !== existing.password);
    const updated: PortalCredential = {
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

    await upsertWorkspaceRecord({
      firmId,
      entityId: found.entity_id,
      recordType: "PORTAL_CREDENTIAL",
      matchKey: "id",
      matchValue: id,
      payload: updated,
    });

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Firm Staff",
      actorRole: auth.role || "PARTNER",
      entityId: found.entity_id,
      entityName: existing.entityName,
      action: passwordChanged ? "Portal Password Rotated" : "Portal Credential Updated",
      details: `${passwordChanged ? "Password rotated" : "Details updated"} for ${existing.portalType} (${existing.entityName}).`,
      category: "SECURITY",
    });

    return NextResponse.json({ success: true, credential: updated });
  } catch (error: any) {
    console.error("PUT /api/credentials error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Partner privileges required to delete credentials." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID parameter required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const del = await pool.query(
      `DELETE FROM public.firm_workspace_records
       WHERE firm_id = $1 AND record_type = 'PORTAL_CREDENTIAL' AND payload->>'id' = $2
       RETURNING entity_id, payload`,
      [firmId, id]
    );
    if (del.rows.length > 0) {
      const cred = del.rows[0].payload as PortalCredential;
      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Firm Partner",
        actorRole: "PARTNER",
        entityId: del.rows[0].entity_id,
        entityName: cred.entityName,
        action: "Portal Credential Deleted",
        details: `Removed ${cred.portalType} login credentials for ${cred.username}.`,
        category: "SECURITY",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/credentials error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
