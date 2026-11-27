import { getPostgresPool } from "@/lib/server/postgres";
import { listWorkspaceRecords, upsertWorkspaceRecord } from "@/lib/server/pgHelpers";
import { lookupGstReturns } from "@/lib/gst/gstinApiClient";
import {
  buildGstTaskTitle,
  canonicalizeReturnKind,
  computeGstTaskPriority,
  computeSec47LateFee,
  getCurrentIndianFy,
  getExpectedReturnKindsForPeriod,
  getExpectedReturnPeriodsForFy,
  getStatutoryGstDueDate,
  resolveActiveGstCycle,
  taskMatchesGstin,
} from "@/lib/gst/gstComplianceEngine";
import { GstinRecordItem } from "@/lib/types";

const MONTH_MAP: Record<string, string> = {
  "01": "January", "02": "February", "03": "March", "04": "April",
  "05": "May", "06": "June", "07": "July", "08": "August",
  "09": "September", "10": "October", "11": "November", "12": "December",
};

export function normalizeGstnPeriodToLabel(rawPeriod: string): string {
  const s = (rawPeriod || "").trim();
  const mmyyyy = s.match(/^(\d{2})(\d{4})$/);
  if (mmyyyy && MONTH_MAP[mmyyyy[1]]) {
    return `${MONTH_MAP[mmyyyy[1]]} ${mmyyyy[2]}`;
  }
  return s;
}

function mapRawReturnType(rt: string): "GSTR1" | "GSTR3B" | "CMP08" | "GSTR9" | "OTHER" {
  const u = (rt || "").toUpperCase();
  if (u.includes("CMP") || u.includes("08")) return "CMP08";
  if (u.includes("9")) return "GSTR9";
  if (u.includes("3B")) return "GSTR3B";
  if (u.includes("1") || u.includes("IFF")) return "GSTR1";
  return "OTHER";
}

export interface ReconcileGstinsResult {
  syncedGstins: number;
  updatedTasks: number;
  createdBacklogTasks: number;
  errors: string[];
}

export async function reconcileGstinsWithPortal(params: {
  firmId: string;
  fy?: string;
  entityId?: string;
  targetGstin?: string;
  maxGstins?: number;
}): Promise<ReconcileGstinsResult> {
  const { firmId, entityId, targetGstin, maxGstins = 250 } = params;
  const now = new Date();
  const fy = params.fy || getCurrentIndianFy(now);
  const activeCycle = resolveActiveGstCycle(now);
  const cleanTargetGstin = targetGstin ? targetGstin.trim().toUpperCase() : "";
  const pool = getPostgresPool();

  const [{ rows: entRows }, { rows: taskRows }, gstProfileRecs, gstMetaRecs] = await Promise.all([
    entityId
      ? pool.query(
          "SELECT id, entity_name, gstin FROM public.client_entities WHERE firm_id = $1 AND id = $2",
          [firmId, entityId]
        )
      : pool.query("SELECT id, entity_name, gstin FROM public.client_entities WHERE firm_id = $1", [firmId]),
    entityId
      ? pool.query(
          "SELECT * FROM public.compliance_tasks WHERE firm_id = $1 AND entity_id = $2 AND category = 'GST'",
          [firmId, entityId]
        )
      : pool.query("SELECT * FROM public.compliance_tasks WHERE firm_id = $1 AND category = 'GST'", [firmId]),
    listWorkspaceRecords<any>(firmId, "GST_CLIENT_PROFILE"),
    listWorkspaceRecords<any>(firmId, "GST_FILING_METADATA"),
  ]);

  const profileMap = new Map<string, any>();
  for (const r of gstProfileRecs) {
    const eid = r.entity_id || r.payload?.entityId;
    if (eid) profileMap.set(eid, r.payload);
  }

  const metaGstinByTask = new Map<string, string>();
  for (const r of gstMetaRecs) {
    if (r.payload?.taskId && r.payload?.gstin) {
      metaGstinByTask.set(r.payload.taskId, String(r.payload.gstin).trim().toUpperCase());
    }
  }

  interface TargetGstinItem {
    entityId: string;
    entityName: string;
    primaryGstin: string | null;
    record: GstinRecordItem;
  }

  const targets: TargetGstinItem[] = [];
  for (const ent of entRows) {
    const prof = profileMap.get(ent.id);
    const recs: GstinRecordItem[] =
      Array.isArray(prof?.gstinRecords) && prof.gstinRecords.length > 0
        ? prof.gstinRecords
        : ent.gstin
        ? [
            {
              gstin: ent.gstin,
              stateCode: String(ent.gstin).substring(0, 2),
              stateName: "",
              tradeName: ent.entity_name,
              registrationType: prof?.gstFilingFrequency === "COMPOSITION" ? "COMPOSITION" : "REGULAR",
              filingFrequency: prof?.gstFilingFrequency === "QRMP" ? "QRMP" : "MONTHLY",
              qrmpStateGroup: "22ND",
              status: "ACTIVE",
              registrationDate: prof?.gstRegistrationDate,
            },
          ]
        : [];

    for (const r of recs) {
      if (r.status && r.status !== "ACTIVE") continue;
      const g = String(r.gstin || "").trim().toUpperCase();
      if (g.length !== 15) continue;
      if (cleanTargetGstin && g !== cleanTargetGstin) continue;
      targets.push({
        entityId: ent.id,
        entityName: ent.entity_name,
        primaryGstin: ent.gstin ? String(ent.gstin).trim().toUpperCase() : null,
        record: { ...r, gstin: g },
      });
    }
  }

  let syncedGstins = 0;
  let updatedTasks = 0;
  let createdBacklogTasks = 0;
  const errors: string[] = [];

  const cappedTargets = targets.slice(0, maxGstins);
  const BATCH_SIZE = 5;

  for (let b = 0; b < cappedTargets.length; b += BATCH_SIZE) {
    const batch = cappedTargets.slice(b, b + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (tgt) => ({
        tgt,
        retRes: await lookupGstReturns(tgt.record.gstin, fy).catch((e: any) => ({
          success: false,
          error: e?.message || "Lookup failed",
        })),
      }))
    );

    for (const { tgt, retRes } of batchResults) {
      if (!retRes?.success) {
        errors.push(`${tgt.record.gstin}: ${retRes?.error || "Lookup failed"}`);
        continue;
      }
      syncedGstins++;
      const returnsList: any[] = retRes.returns || retRes.data?.returns || retRes.EFiledlist || [];

      const filedMap = new Map<string, { arn: string; dof: string; periodLabel: string; kind: string }>();
      for (const r of returnsList) {
        const rKind = mapRawReturnType(String(r.returnType || r.rtntype || ""));
        const rStatus = String(r.filingStatus || r.status || "").toUpperCase();
        if (!rStatus.includes("FILED") || rKind === "OTHER") continue;

        const periodRaw = String(r.returnPeriod || r.ret_prd || "");
        const periodLabel = normalizeGstnPeriodToLabel(periodRaw);
        const arn = String(r.arn || "").trim();
        const dof = String(r.filingDate || r.dof || "").trim();

        filedMap.set(`${rKind}::${periodLabel.toLowerCase()}`, { arn, dof, periodLabel, kind: rKind });

        // Direction A: Mark matching existing pending task as FILED_AND_COMPLETED
        const matchedTask = taskRows.find((t: any) => {
          if (t.entity_id !== tgt.entityId) return false;
          if (t.status === "FILED_AND_COMPLETED") return false;
          if (!taskMatchesGstin({ gstin: metaGstinByTask.get(t.id), title: t.title }, tgt.record.gstin, tgt.primaryGstin)) {
            return false;
          }
          if (canonicalizeReturnKind(t.title) !== rKind) return false;
          return (
            String(t.period || "").toLowerCase() === periodLabel.toLowerCase() ||
            String(t.period || "").includes(periodRaw)
          );
        });

        if (matchedTask) {
          await pool.query(
            `UPDATE public.compliance_tasks
             SET status = 'FILED_AND_COMPLETED',
                 arn_number = COALESCE(NULLIF($1, ''), arn_number),
                 filing_date = COALESCE(NULLIF($2, '')::date, filing_date, CURRENT_DATE),
                 penalty_risk = 0,
                 accruing_daily_penalty = 0,
                 updated_at = now()
             WHERE id = $3 AND firm_id = $4`,
            [arn, dof, matchedTask.id, firmId]
          );
          matchedTask.status = "FILED_AND_COMPLETED";
          updatedTasks++;
        }
      }

      // Direction B: Backfill missing unfiled periods from max(FY start, regDate) up to activeCycle
      const isComposition = tgt.record.registrationType === "COMPOSITION";
      const expectedPeriods = getExpectedReturnPeriodsForFy(fy, now, tgt.record.registrationDate, isComposition);
      const newHistoryItems: any[] = [];

      for (const periodLabel of expectedPeriods) {
        const isPastPeriod = periodLabel.toLowerCase() !== activeCycle.periodLabel.toLowerCase();
        const expectedKinds = getExpectedReturnKindsForPeriod(tgt.record, periodLabel);
        for (const kind of expectedKinds) {
          const filedInfo = kind === "PMT06" ? undefined : filedMap.get(`${kind}::${periodLabel.toLowerCase()}`);
          if (filedInfo) {
            newHistoryItems.push({
              gstin: tgt.record.gstin,
              period: periodLabel,
              returnType: kind === "GSTR1" ? "GSTR_1" : kind === "GSTR3B" ? "GSTR_3B" : "CMP_08",
              arn: filedInfo.arn || "FILED",
              filingDate: filedInfo.dof || "",
              taxLiabilityCash: 0,
              itcClaimed: 0,
              delayDays: 0,
              lateFeePaid: 0,
            });
            continue;
          }

          // Not filed on GSTN -> check if task already exists for this (entityId, gstin, kind, period)
          const exists = taskRows.some((t: any) => {
            if (t.entity_id !== tgt.entityId) return false;
            if (!taskMatchesGstin({ gstin: metaGstinByTask.get(t.id), title: t.title }, tgt.record.gstin, tgt.primaryGstin)) {
              return false;
            }
            if (canonicalizeReturnKind(t.title) !== kind) return false;
            return String(t.period || "").toLowerCase() === periodLabel.toLowerCase();
          });

          const dueDate = getStatutoryGstDueDate(periodLabel, kind, tgt.record);
          const fee = computeSec47LateFee(dueDate, now);

          if (kind !== "PMT06") {
            newHistoryItems.push({
              gstin: tgt.record.gstin,
              period: periodLabel,
              returnType: kind === "GSTR1" ? "GSTR_1" : kind === "GSTR3B" ? "GSTR_3B" : "CMP_08",
              arn: "",
              filingDate: "",
              taxLiabilityCash: 0,
              itcClaimed: 0,
              delayDays: Math.max(1, fee.daysLate),
              lateFeePaid: 0,
            });
          }

          if (!exists) {
            const title = buildGstTaskTitle(kind, tgt.record, isPastPeriod && fee.daysLate > 0);
            const priority = computeGstTaskPriority(dueDate, now);
            const missingDocs =
              kind === "GSTR1"
                ? ["B2B Sales Invoices & E-way Bill Summary"]
                : kind === "PMT06"
                ? ["35% Fixed-Sum / Self-Assessment Challan Check"]
                : kind === "CMP08"
                ? ["Quarterly Turnover Summary & Exempt Sales Split"]
                : [`Bank Statement (${periodLabel})`, "Purchase Register & GSTR-2B ITC Match"];

            const ins = await pool.query(
              `INSERT INTO public.compliance_tasks (
                firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty, missing_docs_list, chase_count
              ) VALUES ($1, $2, 'GST'::compliance_category, $3, $4, $5, 'DOCUMENTS_AWAITED'::workflow_status, $6::task_priority, $7, $8, $9::jsonb, 0)
              RETURNING *`,
              [firmId, tgt.entityId, title, periodLabel, dueDate, priority, fee.lateFee, fee.dailyRate, JSON.stringify(missingDocs)]
            );
            const insertedRow = ins.rows[0];
            if (insertedRow) {
              await upsertWorkspaceRecord({
                firmId,
                entityId: tgt.entityId,
                recordType: "GST_FILING_METADATA",
                matchKey: "taskId",
                matchValue: insertedRow.id,
                payload: {
                  taskId: insertedRow.id,
                  gstin: tgt.record.gstin,
                },
              });
              taskRows.push(insertedRow);
              metaGstinByTask.set(insertedRow.id, tgt.record.gstin);
              createdBacklogTasks++;
            }
          }
        }
      }

      // Merge per-GSTIN history into GST_CLIENT_PROFILE so FY Matrix Grid has full ARN trail
      const existingProf = profileMap.get(tgt.entityId) || {};
      const prevHist: any[] = Array.isArray(existingProf.gstHistory) ? existingProf.gstHistory : [];
      const otherGstinHist = prevHist.filter((h) => {
        const hg = (h.gstin || "").trim().toUpperCase();
        return hg && hg !== tgt.record.gstin;
      });
      const mergedHist = [...otherGstinHist, ...newHistoryItems];
      await upsertWorkspaceRecord({
        firmId,
        entityId: tgt.entityId,
        recordType: "GST_CLIENT_PROFILE",
        matchKey: "entityId",
        matchValue: tgt.entityId,
        payload: {
          ...existingProf,
          entityId: tgt.entityId,
          gstHistory: mergedHist,
        },
      });
      profileMap.set(tgt.entityId, { ...existingProf, entityId: tgt.entityId, gstHistory: mergedHist });
    }
  }

  return { syncedGstins, updatedTasks, createdBacklogTasks, errors };
}
