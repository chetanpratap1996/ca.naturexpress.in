import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import {
  resolveFirmUuid,
  appendPgAuditLog,
  listWorkspaceRecords,
  upsertWorkspaceRecord,
} from "@/lib/server/pgHelpers";
import { BankAccountRecordItem, PortalCredential, PortalType } from "@/lib/types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getPortalLoginUrl(portalType: string): string {
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
    default:
      return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
    const action = typeof body.action === "string" ? body.action.trim() : "";

    if (!entityId || !UUID_REGEX.test(entityId)) {
      return NextResponse.json({ success: false, error: "Valid entityId is required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const { rows } = await pool.query(
      `SELECT id, entity_name, group_id, pan, primary_contact_phone
       FROM public.client_entities
       WHERE id = $1 AND firm_id = $2
       LIMIT 1`,
      [entityId, firmId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client entity not found." }, { status: 404 });
    }

    const entity = rows[0];

    if (auth.role === "CLIENT") {
      const ownsEntity = auth.clientEntityId && auth.clientEntityId === entity.id;
      const ownsGroup = auth.clientGroupId && entity.group_id && auth.clientGroupId === entity.group_id;
      if (!ownsEntity && !ownsGroup) {
        return NextResponse.json({ success: false, error: "Unauthorized for this client entity." }, { status: 403 });
      }
    }

    if (action === "SAVE_PORTAL_KEY") {
      const portalType = String(body.portalType || "").toUpperCase() as PortalType;
      const username = String(body.username || "").trim();
      const password = String(body.password || "").trim();

      if (!portalType || !username || !password) {
        return NextResponse.json(
          { success: false, error: "portalType, username, and password are required." },
          { status: 400 }
        );
      }

      const existingCreds = await listWorkspaceRecords<PortalCredential>(firmId, "PORTAL_CREDENTIAL", entityId);
      const matchCred = existingCreds.find((r) => r.payload?.portalType === portalType)?.payload;
      const credId = matchCred?.id || `CRED-${Date.now()}`;
      const ts = new Date().toISOString();

      const credential: PortalCredential = {
        id: credId,
        entityId: entity.id,
        entityName: entity.entity_name,
        groupId: entity.group_id || "GRP-DEFAULT",
        portalType,
        portalName: `${portalType.replace(/_/g, " ")} Portal`,
        loginUrl: getPortalLoginUrl(portalType),
        username,
        password,
        secondaryIdentifier: entity.pan,
        registeredMobile: body.registeredMobile || entity.primary_contact_phone || undefined,
        lastVerifiedAt: ts,
        lastChangedDate: ts.split("T")[0],
        notes: "Submitted via Client Handover Dropzone",
      };

      await upsertWorkspaceRecord({
        firmId,
        entityId: entity.id,
        recordType: "PORTAL_CREDENTIAL",
        matchKey: "id",
        matchValue: credId,
        payload: credential,
      });

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || entity.entity_name,
        actorRole: auth.role,
        entityId: entity.id,
        entityName: entity.entity_name,
        action: "Handover Portal Key Stored",
        details: `${portalType} login submitted via handover dropzone.`,
        category: "SYSTEM",
      });

      return NextResponse.json({ success: true, credential });
    }

    if (action === "SAVE_BANK_ACCOUNT") {
      const bankName = String(body.bankName || "").trim();
      const accountNumber = String(body.accountNo || body.accountNumber || "").trim();
      const ifsc = String(body.ifsc || "").trim().toUpperCase();
      const accountType = (
        body.accountType === "SAVINGS" || body.accountType === "CASH_CREDIT" || body.accountType === "OVERDRAFT"
          ? body.accountType
          : "CURRENT"
      ) as BankAccountRecordItem["accountType"];
      const statementPassword = String(body.statementPassword || "").trim();

      if (!bankName || !accountNumber) {
        return NextResponse.json({ success: false, error: "bankName and accountNumber are required." }, { status: 400 });
      }

      const profileRows = await listWorkspaceRecords<any>(firmId, "GST_CLIENT_PROFILE", entityId);
      const currentProfile = profileRows[0]?.payload || { entityId: entity.id };
      const existingBanks: BankAccountRecordItem[] = Array.isArray(currentProfile.bankAccounts)
        ? currentProfile.bankAccounts
        : [];

      const newBank: BankAccountRecordItem = {
        id: `BANK-${Date.now()}`,
        bankName,
        accountNumber,
        accountType,
        ifsc,
        branch: String(body.branch || "").trim(),
        statementPassword: statementPassword || undefined,
        isPrimary: existingBanks.length === 0 ? true : Boolean(body.isPrimary),
      };

      const filteredBanks = existingBanks.filter((b) => b.accountNumber !== accountNumber);
      const nextBanks = newBank.isPrimary
        ? [newBank, ...filteredBanks.map((b) => ({ ...b, isPrimary: false }))]
        : [...filteredBanks, newBank];

      await upsertWorkspaceRecord({
        firmId,
        entityId: entity.id,
        recordType: "GST_CLIENT_PROFILE",
        matchKey: "entityId",
        matchValue: entity.id,
        payload: {
          ...currentProfile,
          entityId: entity.id,
          bankAccounts: nextBanks,
          updatedAt: new Date().toISOString(),
        },
      });

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || entity.entity_name,
        actorRole: auth.role,
        entityId: entity.id,
        entityName: entity.entity_name,
        action: "Handover Bank Account Added",
        details: `Added ${bankName} (...${accountNumber.slice(-4)}) via Client Portal handover.`,
        category: "SYSTEM",
      });

      return NextResponse.json({ success: true, bankAccounts: nextBanks });
    }

    return NextResponse.json({ success: false, error: "Unsupported handover action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/client/handover error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process handover item." }, { status: 500 });
  }
}
