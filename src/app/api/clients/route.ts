import { NextRequest, NextResponse } from "next/server";
import { ClientEntity } from "@/lib/types";
import { isValidPan, isValidGstin } from "@/lib/utils";
import { generateStatutoryTasksForClient } from "@/lib/statutoryTasks";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog, listWorkspaceRecords, upsertWorkspaceRecord } from "@/lib/server/pgHelpers";
import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";
import { executeAutonomousWorkDispatcher } from "@/lib/tasks/autonomousDispatcher";
import { getAutopilotPolicy } from "@/lib/automation/postgresAutopilot";
import { hashSecret, normalizePhone10 } from "@/lib/auth/enterpriseAuth";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { parseCinStrict } from "@/lib/intelligence/registry/mcaEngine";
import crypto from "crypto";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveIncorporationYear(rawYear: unknown, cin?: string | null): number {
  if (cin) {
    const parsed = parseCinStrict(cin);
    if (parsed.isValid && parsed.incorporationYear >= 1900 && parsed.incorporationYear <= 2100) {
      return parsed.incorporationYear;
    }
  }
  const n = parseInt(String(rawYear ?? ""), 10);
  if (Number.isFinite(n) && n >= 1900 && n <= 2100) return n;
  return new Date().getFullYear();
}

function hydrateProfileFields(base: ClientEntity, prof?: any): ClientEntity {
  if (!prof) return base;
  if (prof.tradeName) base.tradeName = prof.tradeName;
  if (Array.isArray(prof.gstinRecords)) base.gstinRecords = prof.gstinRecords;
  if (prof.gstFilingFrequency) base.gstFilingFrequency = prof.gstFilingFrequency;
  if (prof.onboardingMode) base.onboardingMode = prof.onboardingMode;
  if (prof.onboardingChecklist) base.onboardingChecklist = prof.onboardingChecklist;
  if (Array.isArray(prof.gstHistory)) base.gstHistory = prof.gstHistory;
  if (Array.isArray(prof.serviceScope)) base.serviceScope = prof.serviceScope;
  if (prof.cutoverDate) base.cutoverDate = prof.cutoverDate;
  if (prof.lastFiledPeriods) base.lastFiledPeriods = prof.lastFiledPeriods;
  if (prof.digitalTxnPct !== undefined) base.digitalTxnPct = Number(prof.digitalTxnPct);
  if (prof.registeredAddress) base.registeredAddress = prof.registeredAddress;
  if (Array.isArray(prof.directors)) base.directors = prof.directors;
  if (Array.isArray(prof.bankAccounts)) base.bankAccounts = prof.bankAccounts;
  if (Array.isArray(prof.complianceBaselines)) base.complianceBaselines = prof.complianceBaselines;
  return base;
}

function mapEntityRow(
  e: any,
  groupMap: Map<string, any>,
  staffNameById?: Map<string, string>
): ClientEntity {
  const g = groupMap.get(e.group_id);
  const partnerName =
    (e.partner_in_charge_id && staffNameById?.get(e.partner_in_charge_id)) ||
    DEFAULT_FIRM_BRANDING.managingPartner;
  const articleName =
    (e.assigned_article_id && staffNameById?.get(e.assigned_article_id)) ||
    "Unassigned";
  return {
    id: e.id,
    groupId: e.group_id,
    groupName: g?.group_name || "Direct Practice Clients",
    name: e.entity_name,
    type: e.type,
    pan: e.pan,
    gstin: e.gstin || undefined,
    cin: e.cin || undefined,
    tan: e.tan || undefined,
    turnoverCr: Number(e.turnover_cr || 0),
    incorporationYear: e.incorporation_year || new Date().getFullYear(),
    penaltyRiskAccrued: Number(e.penalty_risk_accrued || 0),
    partnerInCharge: partnerName,
    partnerInChargeId: e.partner_in_charge_id || undefined,
    assignedArticle: articleName,
    assignedArticleId: e.assigned_article_id || undefined,
    primaryContact: {
      name: e.primary_contact_name || g?.promoter_name || "Authorized Signatory",
      phone: e.primary_contact_phone || g?.promoter_phone || "",
      email: e.primary_contact_email || g?.promoter_email || "",
      designation: e.primary_contact_designation || "Director / Authorized Signatory",
    },
  };
}

async function resolveStaffUserId(
  pool: ReturnType<typeof getPostgresPool>,
  firmId: string,
  staffId?: string,
  staffName?: string
): Promise<{ id: string | null; name: string | null }> {
  if (staffId && UUID_REGEX.test(staffId)) {
    const res = await pool.query(
      "SELECT id, full_name FROM public.users WHERE id = $1 AND firm_id = $2 LIMIT 1",
      [staffId, firmId]
    );
    if (res.rows[0]) return { id: res.rows[0].id, name: res.rows[0].full_name };
  }
  if (staffName && staffName.trim() && staffName !== "Unassigned" && staffName !== "Practice Team") {
    const clean = staffName.replace(/\s*\(.*?\)\s*/g, "").trim();
    const res = await pool.query(
      "SELECT id, full_name FROM public.users WHERE firm_id = $1 AND (LOWER(full_name) = LOWER($2) OR LOWER(full_name) = LOWER($3)) LIMIT 1",
      [firmId, staffName.trim(), clean]
    );
    if (res.rows[0]) return { id: res.rows[0].id, name: res.rows[0].full_name };
  }
  return { id: null, name: null };
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
    const [{ rows: groupRows }, { rows: entityRows }, { rows: staffRows }, gstProfileRecs] = await Promise.all([
      pool.query("SELECT * FROM public.client_groups WHERE firm_id = $1 ORDER BY created_at DESC", [firmId]),
      pool.query("SELECT * FROM public.client_entities WHERE firm_id = $1 ORDER BY created_at DESC", [firmId]),
      pool.query("SELECT id, full_name FROM public.users WHERE firm_id = $1", [firmId]),
      listWorkspaceRecords<any>(firmId, "GST_CLIENT_PROFILE"),
    ]);

    const staffNameById = new Map<string, string>(staffRows.map((u: any) => [u.id, u.full_name]));
    const gstProfileMap = new Map<string, any>();
    for (const r of gstProfileRecs) {
      const eid = r.entity_id || r.payload?.entityId;
      if (eid) gstProfileMap.set(eid, r.payload);
    }

    const groupMap = new Map(groupRows.map((g: any) => [g.id, g]));
    const clients = entityRows.map((e: any) => {
      const base = mapEntityRow(e, groupMap, staffNameById);
      return hydrateProfileFields(base, gstProfileMap.get(e.id));
    });
    const groups = groupRows.map((g: any) => ({
      id: g.id,
      name: g.group_name,
      promoterName: g.promoter_name,
      promoterPhone: g.promoter_phone,
      promoterEmail: g.promoter_email,
      totalEntities: clients.filter((c: any) => c.groupId === g.id).length,
      totalTurnoverCr: clients
        .filter((c: any) => c.groupId === g.id)
        .reduce((acc: number, curr: any) => acc + curr.turnoverCr, 0),
      unbilledWipTotal: Number(g.unbilled_wip_total || 0),
      overdueFeesTotal: Number(g.overdue_fees_total || 0),
      entityIds: clients.filter((c: any) => c.groupId === g.id).map((c: any) => c.id),
    }));

    return NextResponse.json({ success: true, clients, groups });
  } catch (error: any) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json({ success: false, error: "Failed to load clients." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required to onboard clients." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const body = await req.json();

    // ─── BATCH IMPORT FOR CSV UPLOADS (SCALED FOR 1,000+ CLIENTS) ───
    if (Array.isArray(body.batch) && body.batch.length > 0) {
      if (body.batch.length > 500) {
        return NextResponse.json({ success: false, error: "Batch size limited to 500 entities per request." }, { status: 400 });
      }

      // Preload firm groups, staff, and existing entity PANs in 3 O(1) queries
      const [grpPreload, staffPreload, entPreload] = await Promise.all([
        pool.query("SELECT id, group_name, promoter_phone FROM public.client_groups WHERE firm_id = $1", [firmId]),
        pool.query("SELECT id, full_name FROM public.users WHERE firm_id = $1", [firmId]),
        pool.query("SELECT id, pan FROM public.client_entities WHERE firm_id = $1", [firmId]),
      ]);

      const groupById = new Map<string, string>();
      const groupByPhone10 = new Map<string, string>();
      const groupByName = new Map<string, string>();
      for (const g of grpPreload.rows) {
        groupById.set(g.id, g.id);
        const p10 = normalizePhone10(g.promoter_phone || "");
        if (p10.length >= 10) groupByPhone10.set(p10, g.id);
        if (g.group_name) groupByName.set(String(g.group_name).trim().toLowerCase(), g.id);
      }

      const staffById = new Map<string, string>(staffPreload.rows.map((u: any) => [u.id, u.full_name]));
      const staffByNameLower = new Map<string, { id: string; name: string }>(
        staffPreload.rows.map((u: any) => [String(u.full_name || "").trim().toLowerCase(), { id: u.id, name: u.full_name }])
      );
      const resolveBatchStaff = (rawId?: string, rawName?: string): { id: string | null; name: string | null } => {
        if (rawId && UUID_REGEX.test(rawId) && staffById.has(rawId)) {
          return { id: rawId, name: staffById.get(rawId) || null };
        }
        if (rawName && rawName.trim()) {
          const needle = rawName.trim().toLowerCase();
          const exact = staffByNameLower.get(needle);
          if (exact) return exact;
          for (const [k, v] of staffByNameLower.entries()) {
            if (k.includes(needle) || needle.includes(k)) return v;
          }
        }
        return { id: null, name: rawName || null };
      };

      const existingByPan = new Map<string, string>(
        entPreload.rows.map((e: any) => [String(e.pan || "").toUpperCase(), e.id])
      );

      const inserted: ClientEntity[] = [];
      const tasksBuffer: Array<[string, string, string, string, string, string, string, string, number, number]> = [];
      let skippedCount = 0;

      for (const item of body.batch) {
        const entityName = typeof item.name === "string" ? item.name.trim() : "";
        const pan = typeof item.pan === "string" ? item.pan.trim().toUpperCase() : "";
        if (!entityName || !pan || !isValidPan(pan)) {
          skippedCount++;
          continue;
        }
        if (item.gstin && !isValidGstin(String(item.gstin).trim().toUpperCase())) {
          skippedCount++;
          continue;
        }

        const contactName = item.primaryContact?.name?.trim() || "Authorized Signatory";
        const contactPhone = item.primaryContact?.phone?.trim() || "";
        const contactEmail = item.primaryContact?.email?.trim() || "";
        const designation = item.primaryContact?.designation?.trim() || "Director / Authorized Signatory";
        const turnover = parseFloat(item.turnoverCr) || 0;
        const cleanCin = item.cin?.trim().toUpperCase() || null;
        const cleanTan = item.tan?.trim().toUpperCase() || null;
        const incYear = resolveIncorporationYear(item.incorporationYear, cleanCin);
        const groupName = item.groupName?.trim() || `${entityName} Group`;
        const phone10 = normalizePhone10(contactPhone);

        let groupId: string | undefined;
        if (item.groupId && UUID_REGEX.test(String(item.groupId))) {
          groupId = groupById.get(String(item.groupId));
        }
        if (!groupId && phone10.length >= 10 && item.linkByPhone !== false) {
          groupId = groupByPhone10.get(phone10);
        }
        if (!groupId) {
          groupId = groupByName.get(groupName.toLowerCase());
        }
        if (!groupId) {
          const gIns = await pool.query(
            `INSERT INTO public.client_groups (
              firm_id, group_name, promoter_name, promoter_phone, promoter_email, unbilled_wip_total, overdue_fees_total
            ) VALUES ($1, $2, $3, $4, $5, 0, 0) RETURNING id`,
            [firmId, groupName, contactName, contactPhone || "+91 00000 00000", contactEmail || "accounts@client.in"]
          );
          groupId = gIns.rows[0].id;
          if (groupId) {
            groupById.set(groupId, groupId);
            if (phone10.length >= 10) groupByPhone10.set(phone10, groupId);
            groupByName.set(groupName.toLowerCase(), groupId);
          }
        }

        const resolvedPartner = resolveBatchStaff(item.partnerInChargeId, item.partnerInCharge);
        const resolvedArticle = resolveBatchStaff(item.assignedArticleId, item.assignedArticle);

        const initialPin = phone10.length >= 4 ? phone10.slice(-4) : String(crypto.randomInt(1000, 9999));
        const { hash, salt } = hashSecret(initialPin);

        const existingEntityId = existingByPan.get(pan);

        let entityId: string;
        if (existingEntityId) {
          entityId = existingEntityId;
          await pool.query(
            `UPDATE public.client_entities
             SET entity_name = $1, type = $2::entity_type, gstin = $3, cin = $4, tan = $5, turnover_cr = $6,
                 incorporation_year = $7, primary_contact_name = $8, primary_contact_phone = $9,
                 primary_contact_email = $10, primary_contact_designation = $11,
                 partner_in_charge_id = COALESCE($12, partner_in_charge_id),
                 assigned_article_id = COALESCE($13, assigned_article_id)
             WHERE id = $14 AND firm_id = $15`,
            [
              entityName,
              item.type || "PVT_LTD",
              item.gstin?.trim().toUpperCase() || null,
              cleanCin,
              cleanTan,
              turnover,
              incYear,
              contactName,
              contactPhone,
              contactEmail,
              designation,
              resolvedPartner.id,
              resolvedArticle.id,
              entityId,
              firmId,
            ]
          );
        } else {
          const ins = await pool.query(
            `INSERT INTO public.client_entities (
              firm_id, group_id, entity_name, type, pan, gstin, cin, tan, turnover_cr, incorporation_year,
              primary_contact_name, primary_contact_phone, primary_contact_email, primary_contact_designation,
              partner_in_charge_id, assigned_article_id,
              auth_pin, auth_pin_hash, auth_pin_salt, is_pin_customized
            ) VALUES ($1, $2, $3, $4::entity_type, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NULL, $17, $18, FALSE)
            RETURNING id`,
            [
              firmId,
              groupId,
              entityName,
              item.type || "PVT_LTD",
              pan,
              item.gstin?.trim().toUpperCase() || null,
              cleanCin,
              cleanTan,
              turnover,
              incYear,
              contactName,
              contactPhone,
              contactEmail,
              designation,
              resolvedPartner.id,
              resolvedArticle.id,
              hash,
              salt,
            ]
          );
          entityId = ins.rows[0].id;
          existingByPan.set(pan, entityId);

          const clientStub: ClientEntity = {
            id: entityId,
            groupId: groupId!,
            groupName,
            name: entityName,
            tradeName: item.tradeName?.trim() || undefined,
            type: item.type || "PVT_LTD",
            pan,
            gstin: item.gstin?.trim().toUpperCase() || undefined,
            gstFilingFrequency: item.gstFilingFrequency || undefined,
            onboardingMode: item.onboardingMode || "EXISTING_CLIENT",
            serviceScope: Array.isArray(item.serviceScope) ? item.serviceScope : undefined,
            cutoverDate: item.cutoverDate || undefined,
            lastFiledPeriods: item.lastFiledPeriods || undefined,
            digitalTxnPct: item.digitalTxnPct !== undefined ? Number(item.digitalTxnPct) : undefined,
            registeredAddress: item.registeredAddress || undefined,
            onboardingChecklist: item.onboardingChecklist || undefined,
            cin: cleanCin || undefined,
            tan: cleanTan || undefined,
            turnoverCr: turnover,
            incorporationYear: incYear,
            penaltyRiskAccrued: 0,
            partnerInCharge: resolvedPartner.name || item.partnerInCharge || DEFAULT_FIRM_BRANDING.managingPartner,
            partnerInChargeId: resolvedPartner.id || undefined,
            assignedArticle: resolvedArticle.name || item.assignedArticle || "Unassigned",
            assignedArticleId: resolvedArticle.id || undefined,
            primaryContact: { name: contactName, phone: contactPhone, email: contactEmail, designation },
          };
          if (
            item.gstFilingFrequency ||
            item.onboardingMode ||
            item.onboardingChecklist ||
            item.tradeName ||
            Array.isArray(item.serviceScope) ||
            item.cutoverDate ||
            item.lastFiledPeriods ||
            item.digitalTxnPct !== undefined ||
            item.registeredAddress ||
            Array.isArray(item.gstinRecords) ||
            Array.isArray(item.directors) ||
            Array.isArray(item.bankAccounts) ||
            Array.isArray(item.complianceBaselines)
          ) {
            await upsertWorkspaceRecord({
              firmId,
              entityId,
              recordType: "GST_CLIENT_PROFILE",
              matchKey: "entityId",
              matchValue: entityId,
              payload: {
                entityId,
                tradeName: item.tradeName?.trim() || undefined,
                gstFilingFrequency: item.gstFilingFrequency || undefined,
                onboardingMode: item.onboardingMode || "EXISTING_CLIENT",
                serviceScope: Array.isArray(item.serviceScope) ? item.serviceScope : undefined,
                cutoverDate: item.cutoverDate || undefined,
                lastFiledPeriods: item.lastFiledPeriods || undefined,
                digitalTxnPct: item.digitalTxnPct !== undefined ? Number(item.digitalTxnPct) : undefined,
                registeredAddress: item.registeredAddress || undefined,
                onboardingChecklist: item.onboardingChecklist || undefined,
                gstinRecords: Array.isArray(item.gstinRecords) ? item.gstinRecords : [],
                directors: Array.isArray(item.directors) ? item.directors : undefined,
                bankAccounts: Array.isArray(item.bankAccounts) ? item.bankAccounts : undefined,
                complianceBaselines: Array.isArray(item.complianceBaselines) ? item.complianceBaselines : undefined,
                updatedAt: new Date().toISOString(),
              },
            });
          }
          const tasks = generateStatutoryTasksForClient(clientStub);
          for (const t of tasks) {
            tasksBuffer.push([
              firmId,
              entityId,
              t.category,
              t.title,
              t.period,
              t.dueDate,
              t.status,
              t.priority,
              t.penaltyRisk,
              t.accruingDailyPenalty,
            ]);
          }
        }

        if (item.bankAccounts && Array.isArray(item.bankAccounts) && item.bankAccounts.length > 0 && existingEntityId) {
          const existingProfs = await listWorkspaceRecords<any>(firmId, "GST_CLIENT_PROFILE", entityId);
          const curProf = existingProfs[0]?.payload || {};
          await upsertWorkspaceRecord({
            firmId,
            entityId,
            recordType: "GST_CLIENT_PROFILE",
            matchKey: "entityId",
            matchValue: entityId,
            payload: {
              ...curProf,
              entityId,
              bankAccounts: item.bankAccounts,
              complianceBaselines: Array.isArray(item.complianceBaselines) ? item.complianceBaselines : curProf.complianceBaselines,
              gstinRecords: Array.isArray(item.gstinRecords) ? item.gstinRecords : (curProf.gstinRecords || []),
              updatedAt: new Date().toISOString(),
            },
          });
        }

        inserted.push({
          id: entityId,
          groupId: groupId!,
          groupName,
          name: entityName,
          tradeName: item.tradeName?.trim() || undefined,
          type: item.type || "PVT_LTD",
          pan,
          gstin: item.gstin?.trim().toUpperCase() || undefined,
          gstFilingFrequency: item.gstFilingFrequency || undefined,
          onboardingMode: item.onboardingMode || "EXISTING_CLIENT",
          serviceScope: Array.isArray(item.serviceScope) ? item.serviceScope : undefined,
          cutoverDate: item.cutoverDate || undefined,
          lastFiledPeriods: item.lastFiledPeriods || undefined,
          onboardingChecklist: item.onboardingChecklist || undefined,
          cin: cleanCin || undefined,
          tan: cleanTan || undefined,
          turnoverCr: turnover,
          incorporationYear: incYear,
          penaltyRiskAccrued: 0,
          partnerInCharge: resolvedPartner.name || item.partnerInCharge || DEFAULT_FIRM_BRANDING.managingPartner,
          partnerInChargeId: resolvedPartner.id || undefined,
          assignedArticle: resolvedArticle.name || item.assignedArticle || "Unassigned",
          assignedArticleId: resolvedArticle.id || undefined,
          primaryContact: { name: contactName, phone: contactPhone, email: contactEmail, designation },
        });
      }

      // Multi-row bulk INSERT for generated statutory compliance tasks (200 rows per query)
      for (let i = 0; i < tasksBuffer.length; i += 200) {
        const chunk = tasksBuffer.slice(i, i + 200);
        const values: any[] = [];
        const placeholders = chunk
          .map((row, idx) => {
            const base = idx * 10;
            values.push(...row);
            return `($${base + 1}, $${base + 2}, $${base + 3}::compliance_category, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}::workflow_status, $${base + 8}::task_priority, $${base + 9}, $${base + 10})`;
          })
          .join(", ");
        await pool.query(
          `INSERT INTO public.compliance_tasks (
            firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty
          ) VALUES ${placeholders}`,
          values
        );
      }

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Practice Staff",
        actorRole: auth.role || "PARTNER",
        entityName: `${inserted.length} Clients`,
        action: "Bulk CSV Client Master Ingested",
        details: `Onboarded ${inserted.length} client entities (${skippedCount} skipped).`,
        category: "SYSTEM",
      });

      const policy = await getAutopilotPolicy(firmId).catch(() => null);
      if (policy?.enabled && policy.autoAssignStaff && inserted.length > 0) {
        await executeAutonomousWorkDispatcher(firmId, auth.user?.id, auth.userName || "Client Onboarding Autopilot").catch(() => null);
      }

      return NextResponse.json({
        success: true,
        count: inserted.length,
        skipped: skippedCount,
        clients: inserted,
      });
    }

    // ─── SINGLE CLIENT ONBOARDING ───
    const entityName = typeof body.name === "string" ? body.name.trim() : "";
    const pan = typeof body.pan === "string" ? body.pan.trim().toUpperCase() : "";
    if (!entityName || !pan) {
      return NextResponse.json(
        { success: false, error: "Legal Entity Name and PAN are required." },
        { status: 400 }
      );
    }

    if (!isValidPan(pan)) {
      return NextResponse.json(
        { success: false, error: `Invalid Indian PAN format '${pan}'. Expected 5 letters + 4 digits + 1 letter.` },
        { status: 400 }
      );
    }

    const cleanGstin = body.gstin ? String(body.gstin).trim().toUpperCase() : "";
    if (cleanGstin && !isValidGstin(cleanGstin)) {
      return NextResponse.json(
        { success: false, error: `Invalid 15-digit GSTIN format '${cleanGstin}'.` },
        { status: 400 }
      );
    }

    const contactName = body.primaryContact?.name?.trim() || "Authorized Signatory";
    const contactPhone = body.primaryContact?.phone?.trim() || "";
    const contactEmail = body.primaryContact?.email?.trim() || "";
    const designation = body.primaryContact?.designation?.trim() || "Director / Authorized Signatory";
    const turnover = parseFloat(body.turnoverCr) || 0;
    const cleanCin = body.cin?.trim().toUpperCase() || undefined;
    const cleanTan = body.tan?.trim().toUpperCase() || undefined;
    const incYear = resolveIncorporationYear(body.incorporationYear, cleanCin);
    const entityType = body.type || "PVT_LTD";
    const groupName = body.groupName?.trim() || `${entityName} Group`;
    const phone10Single = normalizePhone10(contactPhone);

    let targetGroupId: string | null = null;
    let resolvedGroupName = groupName;
    if (body.groupId && UUID_REGEX.test(String(body.groupId))) {
      const gById = await pool.query(
        "SELECT id, group_name FROM public.client_groups WHERE id = $1 AND firm_id = $2 LIMIT 1",
        [body.groupId, firmId]
      );
      if (gById.rows[0]?.id) {
        targetGroupId = gById.rows[0].id;
        resolvedGroupName = gById.rows[0].group_name;
      }
    }
    if (!targetGroupId && phone10Single.length >= 10 && body.linkExistingGroup !== false) {
      const gByPhone = await pool.query(
        "SELECT id, group_name FROM public.client_groups WHERE firm_id = $1 AND RIGHT(REGEXP_REPLACE(COALESCE(promoter_phone, ''), '\\D', '', 'g'), 10) = $2 LIMIT 1",
        [firmId, phone10Single]
      );
      if (gByPhone.rows[0]?.id) {
        targetGroupId = gByPhone.rows[0].id;
        resolvedGroupName = gByPhone.rows[0].group_name;
      }
    }
    if (!targetGroupId) {
      const gByName = await pool.query(
        "SELECT id, group_name FROM public.client_groups WHERE firm_id = $1 AND LOWER(group_name) = LOWER($2) LIMIT 1",
        [firmId, groupName]
      );
      if (gByName.rows[0]?.id) {
        targetGroupId = gByName.rows[0].id;
        resolvedGroupName = gByName.rows[0].group_name;
      }
    }
    if (!targetGroupId) {
      const gIns = await pool.query(
        `INSERT INTO public.client_groups (
          firm_id, group_name, promoter_name, promoter_phone, promoter_email, unbilled_wip_total, overdue_fees_total
        ) VALUES ($1, $2, $3, $4, $5, 0, 0) RETURNING id`,
        [firmId, groupName, contactName, contactPhone || "+91 00000 00000", contactEmail || "accounts@client.in"]
      );
      targetGroupId = gIns.rows[0].id;
    }

    const [resolvedPartner, resolvedArticle] = await Promise.all([
      resolveStaffUserId(pool, firmId, body.partnerInChargeId, body.partnerInCharge),
      resolveStaffUserId(pool, firmId, body.assignedArticleId, body.assignedArticle),
    ]);

    const existingEnt = await pool.query(
      "SELECT id FROM public.client_entities WHERE firm_id = $1 AND pan = $2 LIMIT 1",
      [firmId, pan]
    );

    let entityId: string;
    let isNewEntity = false;

    if (existingEnt.rows[0]?.id) {
      entityId = existingEnt.rows[0].id;
      await pool.query(
        `UPDATE public.client_entities
         SET entity_name = $1, type = $2::entity_type, gstin = $3, cin = $4, tan = $5,
             turnover_cr = $6, incorporation_year = $7, primary_contact_name = $8,
             primary_contact_phone = $9, primary_contact_email = $10, primary_contact_designation = $11,
             partner_in_charge_id = COALESCE($12, partner_in_charge_id),
             assigned_article_id = COALESCE($13, assigned_article_id)
         WHERE id = $14 AND firm_id = $15`,
        [
          entityName,
          entityType,
          cleanGstin || null,
          cleanCin || null,
          cleanTan || null,
          turnover,
          incYear,
          contactName,
          contactPhone,
          contactEmail,
          designation,
          resolvedPartner.id,
          resolvedArticle.id,
          entityId,
          firmId,
        ]
      );
    } else {
      isNewEntity = true;
      const initialPin = phone10Single.length >= 4 ? phone10Single.slice(-4) : String(crypto.randomInt(1000, 9999));
      const { hash, salt } = hashSecret(initialPin);

      const ins = await pool.query(
        `INSERT INTO public.client_entities (
          firm_id, group_id, entity_name, type, pan, gstin, cin, tan, turnover_cr, incorporation_year,
          primary_contact_name, primary_contact_phone, primary_contact_email, primary_contact_designation,
          partner_in_charge_id, assigned_article_id,
          auth_pin, auth_pin_hash, auth_pin_salt, is_pin_customized
        ) VALUES ($1, $2, $3, $4::entity_type, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NULL, $17, $18, FALSE)
        RETURNING id`,
        [
          firmId,
          targetGroupId,
          entityName,
          entityType,
          pan,
          cleanGstin || null,
          cleanCin || null,
          cleanTan || null,
          turnover,
          incYear,
          contactName,
          contactPhone,
          contactEmail,
          designation,
          resolvedPartner.id,
          resolvedArticle.id,
          hash,
          salt,
        ]
      );
      entityId = ins.rows[0].id;
    }

    const newClient: ClientEntity = {
      id: entityId,
      groupId: targetGroupId!,
      groupName: resolvedGroupName,
      name: entityName,
      tradeName: body.tradeName?.trim() || undefined,
      type: entityType,
      pan,
      gstin: cleanGstin || undefined,
      gstFilingFrequency: body.gstFilingFrequency || undefined,
      onboardingMode: body.onboardingMode || "EXISTING_CLIENT",
      serviceScope: Array.isArray(body.serviceScope) ? body.serviceScope : undefined,
      cutoverDate: body.cutoverDate || undefined,
      lastFiledPeriods: body.lastFiledPeriods || undefined,
      digitalTxnPct: body.digitalTxnPct !== undefined ? Number(body.digitalTxnPct) : undefined,
      registeredAddress: body.registeredAddress || undefined,
      onboardingChecklist: body.onboardingChecklist || undefined,
      gstHistory: Array.isArray(body.gstHistory) ? body.gstHistory : undefined,
      cin: cleanCin,
      tan: cleanTan,
      turnoverCr: turnover,
      incorporationYear: incYear,
      penaltyRiskAccrued: 0,
      partnerInCharge: resolvedPartner.name || body.partnerInCharge || DEFAULT_FIRM_BRANDING.managingPartner,
      partnerInChargeId: resolvedPartner.id || undefined,
      assignedArticle: resolvedArticle.name || body.assignedArticle || "Unassigned",
      assignedArticleId: resolvedArticle.id || undefined,
      primaryContact: { name: contactName, phone: contactPhone, email: contactEmail, designation },
      gstinRecords: Array.isArray(body.gstinRecords) ? body.gstinRecords : undefined,
      directors: Array.isArray(body.directors) ? body.directors : undefined,
      bankAccounts: Array.isArray(body.bankAccounts) ? body.bankAccounts : undefined,
      complianceBaselines: Array.isArray(body.complianceBaselines) ? body.complianceBaselines : undefined,
    };

    if (
      Array.isArray(body.gstinRecords) ||
      body.tradeName ||
      body.gstFilingFrequency ||
      body.onboardingMode ||
      body.onboardingChecklist ||
      Array.isArray(body.gstHistory) ||
      Array.isArray(body.serviceScope) ||
      body.cutoverDate ||
      body.lastFiledPeriods ||
      body.digitalTxnPct !== undefined ||
      body.registeredAddress ||
      Array.isArray(body.directors) ||
      Array.isArray(body.bankAccounts) ||
      Array.isArray(body.complianceBaselines)
    ) {
      await upsertWorkspaceRecord({
        firmId,
        entityId,
        recordType: "GST_CLIENT_PROFILE",
        matchKey: "entityId",
        matchValue: entityId,
        payload: {
          entityId,
          tradeName: body.tradeName?.trim() || undefined,
          gstinRecords: Array.isArray(body.gstinRecords) ? body.gstinRecords : [],
          gstFilingFrequency: body.gstFilingFrequency || undefined,
          onboardingMode: body.onboardingMode || "EXISTING_CLIENT",
          serviceScope: Array.isArray(body.serviceScope) ? body.serviceScope : undefined,
          cutoverDate: body.cutoverDate || undefined,
          lastFiledPeriods: body.lastFiledPeriods || undefined,
          digitalTxnPct: body.digitalTxnPct !== undefined ? Number(body.digitalTxnPct) : undefined,
          registeredAddress: body.registeredAddress || undefined,
          onboardingChecklist: body.onboardingChecklist || undefined,
          gstHistory: Array.isArray(body.gstHistory) ? body.gstHistory : undefined,
          directors: Array.isArray(body.directors) ? body.directors : undefined,
          bankAccounts: Array.isArray(body.bankAccounts) ? body.bankAccounts : undefined,
          complianceBaselines: Array.isArray(body.complianceBaselines) ? body.complianceBaselines : undefined,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    if (body.initialAgreement && Number(body.initialAgreement.baseRetainerFee) > 0) {
      const fee = Number(body.initialAgreement.baseRetainerFee);
      const billingCycle = body.initialAgreement.billingCycle || "MONTHLY";
      const scopeLabels = Array.isArray(newClient.serviceScope) && newClient.serviceScope.length > 0
        ? newClient.serviceScope
        : ["GST", "INCOME_TAX"];
      await upsertWorkspaceRecord({
        firmId,
        entityId,
        recordType: "ENGAGEMENT_AGREEMENT",
        matchKey: "entityId",
        matchValue: entityId,
        payload: {
          id: `AGR-${entityId}`,
          entityId,
          clientName: entityName,
          billingCycle,
          baseRetainerFee: fee,
          includedServices: scopeLabels,
          thresholds: {
            maxMonthlyInvoices: Math.max(50, Math.round((turnover || 1) * 20)),
            maxAnnualTurnoverCr: Math.max(1, (turnover || 1) * 1.25),
            maxBankAccounts: 3,
          },
          actuals: {
            actualMonthlyInvoices: 0,
            actualTurnoverCr: turnover,
            actualBankAccounts: Array.isArray(body.bankAccounts) ? body.bankAccounts.length : 1,
            overagePercentage: 0,
          },
          status: "ACTIVE",
          startDate: new Date().toISOString().split("T")[0],
          renewalDate: `${new Date().getFullYear() + 1}-03-31`,
        },
      });
    }

    // Optional Day-1 Initial Portal Credentials Capture (stored in PORTAL_CREDENTIAL workspace records)
    if (Array.isArray(body.initialCredentials) && body.initialCredentials.length > 0) {
      const portalUrls: Record<string, string> = {
        GST: "https://services.gst.gov.in/services/login",
        INCOME_TAX: "https://eportal.incometax.gov.in/iec/foservices/#/login",
        MCA_V3: "https://www.mca.gov.in/mcafoportal/login.html",
        TRACES: "https://www.tdscpc.gov.in/app/login.xhtml",
        EPFO: "https://unifiedportal-emp.epfindia.gov.in/epfo/",
        ESIC: "https://www.esic.in/EmployerPortal/ESICInsurancePortal/Portal_LoginNew.aspx",
      };
      const ts = new Date().toISOString();
      for (let idx = 0; idx < body.initialCredentials.length; idx++) {
        const cred = body.initialCredentials[idx];
        if (!cred?.username || !cred?.password || !cred?.portalType) continue;
        const credId = `CRED-${Date.now()}-${idx}`;
        await upsertWorkspaceRecord({
          firmId,
          entityId,
          recordType: "PORTAL_CREDENTIAL",
          matchKey: "id",
          matchValue: credId,
          payload: {
            id: credId,
            entityId,
            entityName,
            groupId: targetGroupId!,
            portalType: cred.portalType,
            portalName: cred.portalName || `${cred.portalType} Portal`,
            loginUrl: cred.loginUrl || portalUrls[cred.portalType] || "",
            username: String(cred.username).trim(),
            password: String(cred.password).trim(),
            secondaryIdentifier: cred.secondaryIdentifier || pan,
            registeredMobile: cred.registeredMobile || contactPhone || undefined,
            lastVerifiedAt: ts,
            lastChangedDate: ts.split("T")[0],
          },
        });
      }
    }

    // Optional Day-1 Initial DSC Capture (inserted into public.dsc_vault)
    if (body.initialDsc && (body.initialDsc.holderName || body.initialDsc.serialNumber)) {
      const expiryDate = body.initialDsc.validTill || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];
      await pool.query(
        `INSERT INTO public.dsc_vault (
          firm_id, entity_id, holder_name, holder_pan, serial_number, token_type, valid_till, vault_slot
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          firmId,
          entityId,
          String(body.initialDsc.holderName || contactName || "Director / Partner").trim(),
          String(body.initialDsc.pan || pan).trim().toUpperCase(),
          String(body.initialDsc.serialNumber || `DSC-${Math.floor(100000 + Math.random() * 900000)}`).trim(),
          String(body.initialDsc.tokenType || "ePass2003").trim(),
          expiryDate,
          String(body.initialDsc.vaultSlot || "Cabinet A - Onboarding Safe").trim(),
        ]
      ).catch((e: any) => console.warn("Optional Day-1 DSC insert skipped:", e?.message));
    }

    if (isNewEntity) {
      const clientTasks = generateStatutoryTasksForClient(newClient);
      for (const t of clientTasks) {
        await pool.query(
          `INSERT INTO public.compliance_tasks (
            firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty, missing_docs_list
          ) VALUES ($1, $2, $3::compliance_category, $4, $5, $6, $7::workflow_status, $8::task_priority, $9, $10, $11::jsonb)`,
          [firmId, entityId, t.category, t.title, t.period, t.dueDate, t.status, t.priority, t.penaltyRisk, t.accruingDailyPenalty, JSON.stringify(t.missingDocumentsList || [])]
        );
      }

      const policy = await getAutopilotPolicy(firmId).catch(() => null);
      if (policy?.enabled && policy.autoAssignStaff) {
        await executeAutonomousWorkDispatcher(firmId, auth.user?.id, auth.userName || "Client Onboarding Autopilot").catch(() => null);
      }
    }

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Practice Staff",
      actorRole: auth.role || "PARTNER",
      entityId,
      entityName: newClient.name,
      action: isNewEntity ? "Client Master Onboarded" : "Client Master Updated",
      details: `${isNewEntity ? "Onboarded" : "Updated"} ${newClient.type} entity ${newClient.name} (PAN: ${newClient.pan}).`,
      category: "SYSTEM",
    });

    return NextResponse.json({ success: true, client: newClient });
  } catch (error: any) {
    console.error("POST /api/clients error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to onboard client." }, { status: 500 });
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

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const body = await req.json();
    const clientId = typeof body.id === "string" ? body.id.trim() : "";

    if (!clientId || !UUID_REGEX.test(clientId)) {
      return NextResponse.json({ success: false, error: "Valid Client ID required." }, { status: 400 });
    }

    const existingRes = await pool.query(
      "SELECT * FROM public.client_entities WHERE id = $1 AND firm_id = $2 LIMIT 1",
      [clientId, firmId]
    );
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client not found." }, { status: 404 });
    }
    const ex = existingRes.rows[0];

    const nextPan = body.pan ? String(body.pan).trim().toUpperCase() : ex.pan;
    if (!isValidPan(nextPan)) {
      return NextResponse.json({ success: false, error: "Invalid PAN format." }, { status: 400 });
    }
    const nextGstin = body.gstin !== undefined ? (body.gstin ? String(body.gstin).trim().toUpperCase() : null) : ex.gstin;
    if (nextGstin && !isValidGstin(nextGstin)) {
      return NextResponse.json({ success: false, error: "Invalid GSTIN format." }, { status: 400 });
    }

    if (Array.isArray(body.gstinRecords)) {
      for (const rec of body.gstinRecords) {
        const chk = validateGstinDetailed(rec?.gstin);
        if (!chk.isValid) {
          return NextResponse.json(
            { success: false, error: `Invalid GSTIN '${rec?.gstin || ""}': ${chk.error}` },
            { status: 400 }
          );
        }
      }
    }

    const nextCin = body.cin !== undefined ? (body.cin ? String(body.cin).trim().toUpperCase() : null) : ex.cin;
    const nextTan = body.tan !== undefined ? (body.tan ? String(body.tan).trim().toUpperCase() : null) : ex.tan;
    const [resolvedPartner, resolvedArticle] = await Promise.all([
      body.partnerInChargeId || body.partnerInCharge
        ? resolveStaffUserId(pool, firmId, body.partnerInChargeId, body.partnerInCharge)
        : Promise.resolve({ id: null, name: null }),
      body.assignedArticleId || body.assignedArticle
        ? resolveStaffUserId(pool, firmId, body.assignedArticleId, body.assignedArticle)
        : Promise.resolve({ id: null, name: null }),
    ]);

    const upd = await pool.query(
      `UPDATE public.client_entities
       SET entity_name = $1, type = $2::entity_type, pan = $3, gstin = $4, turnover_cr = $5,
           primary_contact_name = $6, primary_contact_phone = $7, primary_contact_email = $8,
           primary_contact_designation = $9, cin = $10, tan = $11,
           partner_in_charge_id = COALESCE($12, partner_in_charge_id),
           assigned_article_id = COALESCE($13, assigned_article_id)
       WHERE id = $14 AND firm_id = $15
       RETURNING *`,
      [
        body.name?.trim() || ex.entity_name,
        body.type || ex.type,
        nextPan,
        nextGstin,
        body.turnoverCr !== undefined ? Number(body.turnoverCr) : ex.turnover_cr,
        body.primaryContact?.name?.trim() ?? ex.primary_contact_name,
        body.primaryContact?.phone?.trim() ?? ex.primary_contact_phone,
        body.primaryContact?.email?.trim() ?? ex.primary_contact_email,
        body.primaryContact?.designation?.trim() ?? ex.primary_contact_designation,
        nextCin,
        nextTan,
        resolvedPartner.id,
        resolvedArticle.id,
        clientId,
        firmId,
      ]
    );

    const { rows: staffRows } = await pool.query("SELECT id, full_name FROM public.users WHERE firm_id = $1", [firmId]);
    const staffNameById = new Map<string, string>(staffRows.map((u: any) => [u.id, u.full_name]));
    const updated = mapEntityRow(upd.rows[0], new Map(), staffNameById);

    const existingProfiles = await listWorkspaceRecords<any>(firmId, "GST_CLIENT_PROFILE", clientId);
    const existingProf = existingProfiles[0]?.payload || {};
    const hasOnboardingMetaUpdate =
      Array.isArray(body.gstinRecords) ||
      body.tradeName !== undefined ||
      body.gstFilingFrequency !== undefined ||
      body.onboardingMode !== undefined ||
      body.onboardingChecklist !== undefined ||
      Array.isArray(body.gstHistory) ||
      Array.isArray(body.serviceScope) ||
      body.cutoverDate !== undefined ||
      body.lastFiledPeriods !== undefined ||
      body.digitalTxnPct !== undefined ||
      body.registeredAddress !== undefined ||
      Array.isArray(body.directors) ||
      Array.isArray(body.bankAccounts) ||
      Array.isArray(body.complianceBaselines);

    if (hasOnboardingMetaUpdate) {
      const nextProfile = {
        entityId: clientId,
        tradeName: body.tradeName !== undefined ? body.tradeName : existingProf.tradeName,
        gstinRecords: Array.isArray(body.gstinRecords) ? body.gstinRecords : (existingProf.gstinRecords || []),
        gstFilingFrequency:
          body.gstFilingFrequency !== undefined ? body.gstFilingFrequency : existingProf.gstFilingFrequency,
        onboardingMode: body.onboardingMode !== undefined ? body.onboardingMode : existingProf.onboardingMode,
        onboardingChecklist:
          body.onboardingChecklist !== undefined ? body.onboardingChecklist : existingProf.onboardingChecklist,
        gstHistory: Array.isArray(body.gstHistory) ? body.gstHistory : existingProf.gstHistory,
        serviceScope: Array.isArray(body.serviceScope) ? body.serviceScope : existingProf.serviceScope,
        cutoverDate: body.cutoverDate !== undefined ? body.cutoverDate : existingProf.cutoverDate,
        lastFiledPeriods: body.lastFiledPeriods !== undefined ? body.lastFiledPeriods : existingProf.lastFiledPeriods,
        digitalTxnPct: body.digitalTxnPct !== undefined ? Number(body.digitalTxnPct) : existingProf.digitalTxnPct,
        registeredAddress: body.registeredAddress !== undefined ? body.registeredAddress : existingProf.registeredAddress,
        directors: Array.isArray(body.directors) ? body.directors : existingProf.directors,
        bankAccounts: Array.isArray(body.bankAccounts) ? body.bankAccounts : existingProf.bankAccounts,
        complianceBaselines: Array.isArray(body.complianceBaselines) ? body.complianceBaselines : existingProf.complianceBaselines,
        updatedAt: new Date().toISOString(),
      };
      await upsertWorkspaceRecord({
        firmId,
        entityId: clientId,
        recordType: "GST_CLIENT_PROFILE",
        matchKey: "entityId",
        matchValue: clientId,
        payload: nextProfile,
      });
      hydrateProfileFields(updated, nextProfile);

      // Also generate catch-up compliance tasks for any newly detected unfiled GST returns
      if (Array.isArray(body.gstHistory)) {
        const unfiled = body.gstHistory.filter((h: any) => !h?.arn || (h?.delayDays || 0) > 0);
        if (unfiled.length > 0) {
          const existingTasksRes = await pool.query(
            "SELECT title, period FROM public.compliance_tasks WHERE firm_id = $1 AND entity_id = $2",
            [firmId, clientId]
          );
          const existingKeys = new Set(
            existingTasksRes.rows.map((r: any) => `${String(r.title).toLowerCase()}::${String(r.period).toLowerCase()}`)
          );
          for (const h of unfiled.slice(0, 3)) {
            const retLabel = String(h.returnType || "GSTR_3B").replace("_", "-");
            const period = String(h.period || "Prior Period");
            const title = `Overdue Catch-Up: ${retLabel} (${period})`;
            const key = `${title.toLowerCase()}::${period.toLowerCase()}`;
            if (!existingKeys.has(key)) {
              existingKeys.add(key);
              await pool.query(
                `INSERT INTO public.compliance_tasks (
                  firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty, missing_docs_list
                ) VALUES ($1, $2, 'GST'::compliance_category, $3, $4, $5, 'DOCUMENTS_AWAITED'::workflow_status, 'CRITICAL'::task_priority, 5000, 50, $6::jsonb)`,
                [firmId, clientId, title, period, new Date().toISOString().split("T")[0], JSON.stringify([`Historical ${retLabel} data for ${period}`])]
              );
            }
          }
        }
      }
    } else {
      hydrateProfileFields(updated, existingProf);
    }

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Practice Staff",
      actorRole: auth.role || "PARTNER",
      entityId: clientId,
      entityName: updated.name,
      action: "Client Master Updated",
      details: `Updated profile & contact details for ${updated.name} (PAN: ${updated.pan}).`,
      category: "SYSTEM",
    });

    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    console.error("PATCH /api/clients error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update client." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Managing Partner privileges required to remove a client." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("id");
    if (!clientId || !UUID_REGEX.test(clientId)) {
      return NextResponse.json({ success: false, error: "Valid Client ID required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const del = await pool.query(
      "DELETE FROM public.client_entities WHERE id = $1 AND firm_id = $2 RETURNING entity_name, pan",
      [clientId, firmId]
    );

    if (del.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client not found." }, { status: 404 });
    }

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Managing Partner",
      actorRole: "PARTNER",
      entityName: del.rows[0].entity_name,
      action: "Client Archived / Removed",
      details: `Removed client entity ${del.rows[0].entity_name} (PAN: ${del.rows[0].pan}).`,
      category: "SYSTEM",
    });

    return NextResponse.json({ success: true, removedId: clientId });
  } catch (error: any) {
    console.error("DELETE /api/clients error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to remove client." }, { status: 500 });
  }
}
