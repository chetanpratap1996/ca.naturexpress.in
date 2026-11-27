import { Pool } from "pg";
import {
  ensureBillingSchema,
  getIndianFyFromDate,
  allocateNextDocumentNumber,
} from "@/lib/server/billingSchema";
import { appendPgAuditLog, listWorkspaceRecords, upsertWorkspaceRecord } from "@/lib/server/pgHelpers";
import { PayToReleaseConfig } from "@/lib/types";

export interface BillingAutopilotSummary {
  retainersGenerated: number;
  dunningQueued: number;
  expiredOverridesRelocked: number;
  staleWipAlerts: number;
}

/**
 * Hands-free billing autopilot executed by /api/cron/practice-sweep:
 * 1. Issues due recurring retainer invoices
 * 2. Runs T-3 / T+1 / MSME-15 / PAY-GATE-30 / MSME-45 dunning escalation
 * 3. Re-locks Pay-to-Release configs whose Partner Emergency Override expired
 * 4. Alerts partner on Unbilled WIP > 30 days
 */
export async function runBillingAutopilotForFirm(
  pool: Pool,
  firmId: string,
  actorName: string
): Promise<BillingAutopilotSummary> {
  await ensureBillingSchema(pool);
  let retainersGenerated = 0;
  let dunningQueued = 0;
  let expiredOverridesRelocked = 0;
  let staleWipAlerts = 0;

  // 1. Due Retainers
  const { rows: dueRetainers } = await pool.query(
    `SELECT r.*, ce.entity_name
     FROM public.retainer_schedules r
     JOIN public.client_entities ce ON ce.id = r.entity_id
     WHERE r.firm_id = $1 AND r.is_active = TRUE AND r.next_run_date <= CURRENT_DATE`,
    [firmId]
  );

  for (const ret of dueRetainers) {
    const taxable = Math.round(Number(ret.base_fee || 0));
    if (taxable <= 0) continue;
    const gst = Math.round(taxable * 0.18);
    const total = taxable + gst;
    const fy = getIndianFyFromDate();
    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];
    const docType = ret.auto_issue ? "TAX_INVOICE" : "PROFORMA";
    const invoiceNo = await allocateNextDocumentNumber(pool, firmId, docType, fy);

    await pool.query(
      `INSERT INTO public.invoices (
        firm_id, entity_id, invoice_no, document_type, service_description, sac_code,
        taxable_amount, gst_rate, gst_amount, total_amount, due_date, status, financial_year
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 18, $8, $9, $10, 'PENDING', $11)`,
      [
        firmId,
        ret.entity_id,
        invoiceNo,
        docType,
        `${ret.title} (${ret.billing_cycle} Retainer)`,
        ret.sac_code || "998231",
        taxable,
        gst,
        total,
        dueDate,
        fy,
      ]
    );

    const intervalSql =
      ret.billing_cycle === "ANNUAL"
        ? "INTERVAL '1 year'"
        : ret.billing_cycle === "QUARTERLY"
        ? "INTERVAL '3 months'"
        : "INTERVAL '1 month'";

    await pool.query(
      `UPDATE public.retainer_schedules
       SET last_run_date = CURRENT_DATE,
           next_run_date = (next_run_date + ${intervalSql})::date,
           updated_at = now()
       WHERE id = $1`,
      [ret.id]
    );
    retainersGenerated++;
  }

  // 2. Dunning Escalation Sweep
  const { rows: openInvs } = await pool.query(
    `SELECT i.*, ce.entity_name, ce.primary_contact_phone, ce.primary_contact_email
     FROM public.invoices i
     JOIN public.client_entities ce ON ce.id = i.entity_id
     WHERE i.firm_id = $1
       AND i.status IN ('PENDING', 'OVERDUE')
       AND COALESCE(i.dunning_paused, FALSE) = FALSE
       AND (i.promissory_date IS NULL OR i.promissory_date < CURRENT_DATE)`,
    [firmId]
  );

  const nowMs = Date.now();
  for (const inv of openInvs) {
    const daysDiff = Math.floor((nowMs - new Date(inv.due_date).getTime()) / 86400000);
    let stage = "";
    if (daysDiff >= 45) stage = "MSME_45_DEMAND";
    else if (daysDiff >= 30) stage = "PAY_GATE_30";
    else if (daysDiff >= 15) stage = "MSME_15_WARN";
    else if (daysDiff >= 1) stage = "T_PLUS_1";
    else if (daysDiff >= -3) stage = "T_MINUS_3";
    if (!stage || inv.last_dunning_stage === stage) continue;

    await pool.query(
      `INSERT INTO public.dunning_logs (firm_id, entity_id, invoice_id, stage, channel, recipient, status, message_preview)
       VALUES ($1, $2, $3, $4, 'WHATSAPP', $5, 'QUEUED', $6)`,
      [
        firmId,
        inv.entity_id,
        inv.id,
        stage,
        inv.primary_contact_phone || inv.primary_contact_email || "Client",
        `[${stage}] Automated reminder for ${inv.invoice_no}`,
      ]
    );
    await pool.query(
      `UPDATE public.invoices SET last_dunning_stage = $1, last_dunning_at = now() WHERE id = $2`,
      [stage, inv.id]
    );
    dunningQueued++;
  }

  // 3. Auto-relock expired Partner Emergency Overrides if unpaid balance > 0
  const cfgs = await listWorkspaceRecords<PayToReleaseConfig>(firmId, "PAY_TO_RELEASE_CONFIG");
  for (const rec of cfgs) {
    const cfg = rec.payload;
    if (cfg?.partnerOverrideUntil && new Date(cfg.partnerOverrideUntil).getTime() <= nowMs && !cfg.isLocked) {
      const remRes = await pool.query(
        `SELECT COALESCE(SUM(total_amount - COALESCE(paid_amount, 0) - COALESCE(tds_claimed_amount, 0)), 0)::numeric AS rem
         FROM public.invoices WHERE firm_id = $1 AND entity_id = $2 AND status <> 'PAID'`,
        [firmId, cfg.entityId]
      );
      const rem = Number(remRes.rows[0]?.rem || 0);
      if (rem > 0) {
        await upsertWorkspaceRecord({
          firmId,
          entityId: cfg.entityId,
          recordType: "PAY_TO_RELEASE_CONFIG",
          matchKey: "entityId",
          matchValue: cfg.entityId,
          payload: {
            ...cfg,
            isLocked: true,
            totalOutstandingAmount: rem,
            partnerOverrideUntil: null,
            lockReason: "Partner emergency waiver expired with unpaid balance. Auto-relocked.",
          },
        });
        expiredOverridesRelocked++;
      }
    }
  }

  // 4. Stale Unbilled WIP > 30 days alert
  const staleRes = await pool.query(
    `SELECT COUNT(*)::int AS cnt, COALESCE(SUM(estimated_fee), 0)::numeric AS amt
     FROM public.wip_jobs
     WHERE firm_id = $1 AND status IN ('READY_FOR_BILLING', 'IN_PROGRESS')
       AND completion_date < CURRENT_DATE - INTERVAL '30 days'`,
    [firmId]
  );
  staleWipAlerts = Number(staleRes.rows[0]?.cnt || 0);
  if (staleWipAlerts > 0) {
    await upsertWorkspaceRecord({
      firmId,
      recordType: "NOTIFICATION",
      matchKey: "id",
      matchValue: `NOTIF-STALE-WIP-${new Date().toISOString().split("T")[0]}`,
      payload: {
        id: `NOTIF-STALE-WIP-${new Date().toISOString().split("T")[0]}`,
        title: `Revenue Leakage Alert: ${staleWipAlerts} Unbilled WIP Jobs > 30 Days`,
        message: `₹${Number(staleRes.rows[0]?.amt || 0).toLocaleString("en-IN")} of completed work is unbilled for >30 days.`,
        category: "BILLING",
        priority: "HIGH",
        recipientRole: "PARTNER",
        targetTab: "billing-matrix",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });
  }

  if (retainersGenerated > 0 || dunningQueued > 0 || expiredOverridesRelocked > 0) {
    await appendPgAuditLog({
      firmId,
      actorName,
      actorRole: "SYSTEM",
      entityName: "Billing Autopilot",
      action: "Scheduled Billing Sweep",
      details: `Retainers: ${retainersGenerated}, Dunning: ${dunningQueued}, Re-locked: ${expiredOverridesRelocked}, Stale WIP: ${staleWipAlerts}`,
      category: "INVOICE",
    });
  }

  return { retainersGenerated, dunningQueued, expiredOverridesRelocked, staleWipAlerts };
}
