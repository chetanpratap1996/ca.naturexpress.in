import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog } from "@/lib/server/pgHelpers";
import {
  ensureBillingSchema,
  getIndianFyFromDate,
  allocateNextDocumentNumber,
} from "@/lib/server/billingSchema";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    await ensureBillingSchema(pool);

    const entityId = request.nextUrl.searchParams.get("entityId");
    const hasEntity = Boolean(entityId && UUID_REGEX.test(entityId));

    const [retainersRes, rateCardsRes] = await Promise.all([
      hasEntity
        ? pool.query(
            `SELECT r.*, ce.entity_name
             FROM public.retainer_schedules r
             JOIN public.client_entities ce ON ce.id = r.entity_id
             WHERE r.firm_id = $1 AND r.entity_id = $2
             ORDER BY r.next_run_date ASC`,
            [firmId, entityId]
          )
        : pool.query(
            `SELECT r.*, ce.entity_name
             FROM public.retainer_schedules r
             JOIN public.client_entities ce ON ce.id = r.entity_id
             WHERE r.firm_id = $1
             ORDER BY r.next_run_date ASC`,
            [firmId]
          ),
      pool.query(
        `SELECT rc.*, ce.entity_name
         FROM public.client_rate_cards rc
         LEFT JOIN public.client_entities ce ON ce.id = rc.entity_id
         WHERE rc.firm_id = $1
         ORDER BY rc.created_at DESC`,
        [firmId]
      ),
    ]);

    return NextResponse.json({
      success: true,
      retainers: retainersRes.rows.map((r: any) => ({
        id: r.id,
        entityId: r.entity_id,
        entityName: r.entity_name,
        title: r.title,
        sacCode: r.sac_code,
        billingCycle: r.billing_cycle,
        baseFee: Number(r.base_fee || 0),
        autoIssue: Boolean(r.auto_issue),
        autoDispatch: Boolean(r.auto_dispatch),
        nextRunDate: r.next_run_date ? new Date(r.next_run_date).toISOString().split("T")[0] : "",
        lastRunDate: r.last_run_date ? new Date(r.last_run_date).toISOString().split("T")[0] : null,
        maxMonthlyInvoices: Number(r.max_monthly_invoices || 100),
        maxTurnoverCr: Number(r.max_turnover_cr || 5),
        isActive: Boolean(r.is_active),
      })),
      rateCards: rateCardsRes.rows.map((rc: any) => ({
        id: rc.id,
        entityId: rc.entity_id || null,
        entityName: rc.entity_name || undefined,
        entityType: rc.entity_type || null,
        turnoverMinCr: Number(rc.turnover_min_cr || 0),
        turnoverMaxCr: Number(rc.turnover_max_cr || 99999),
        serviceCategory: rc.service_category,
        sacCode: rc.sac_code,
        standardFee: Number(rc.standard_fee || 0),
        defaultHours: Number(rc.default_hours || 4),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/billing/autopilot error:", error);
    return NextResponse.json({ success: false, error: "Failed to load autopilot rules." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Partner authorization required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    await ensureBillingSchema(pool);

    const body = await request.json();
    const { action } = body;

    if (action === "SAVE_RATE_CARD") {
      const { entityId, entityType, turnoverMinCr, turnoverMaxCr, serviceCategory, sacCode, standardFee, defaultHours } = body;
      if (!serviceCategory || !Number(standardFee)) {
        return NextResponse.json({ success: false, error: "serviceCategory and positive standardFee required." }, { status: 400 });
      }
      const ins = await pool.query(
        `INSERT INTO public.client_rate_cards (
          firm_id, entity_id, entity_type, turnover_min_cr, turnover_max_cr,
          service_category, sac_code, standard_fee, default_hours
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          firmId,
          entityId && UUID_REGEX.test(entityId) ? entityId : null,
          entityType || null,
          Number(turnoverMinCr || 0),
          Number(turnoverMaxCr || 99999),
          String(serviceCategory),
          String(sacCode || "998231"),
          Number(standardFee),
          Number(defaultHours || 4),
        ]
      );
      return NextResponse.json({ success: true, rateCard: ins.rows[0] });
    }

    if (action === "SAVE_RETAINER") {
      const {
        id,
        entityId,
        title,
        sacCode,
        billingCycle,
        baseFee,
        autoIssue,
        autoDispatch,
        nextRunDate,
        maxMonthlyInvoices,
        maxTurnoverCr,
        isActive,
      } = body;

      if (!entityId || !UUID_REGEX.test(entityId) || !title || !Number(baseFee)) {
        return NextResponse.json({ success: false, error: "Valid entityId, title, and baseFee required." }, { status: 400 });
      }

      if (id && UUID_REGEX.test(id)) {
        const upd = await pool.query(
          `UPDATE public.retainer_schedules
           SET title = $1, sac_code = $2, billing_cycle = $3, base_fee = $4,
               auto_issue = $5, auto_dispatch = $6, next_run_date = $7::date,
               max_monthly_invoices = $8, max_turnover_cr = $9, is_active = $10, updated_at = now()
           WHERE id = $11 AND firm_id = $12
           RETURNING *`,
          [
            title,
            sacCode || "998231",
            billingCycle || "MONTHLY",
            Number(baseFee),
            autoIssue !== false,
            autoDispatch !== false,
            nextRunDate || new Date().toISOString().split("T")[0],
            Number(maxMonthlyInvoices || 100),
            Number(maxTurnoverCr || 5),
            isActive !== false,
            id,
            firmId,
          ]
        );
        return NextResponse.json({ success: true, retainer: upd.rows[0] });
      }

      const ins = await pool.query(
        `INSERT INTO public.retainer_schedules (
          firm_id, entity_id, title, sac_code, billing_cycle, base_fee,
          auto_issue, auto_dispatch, next_run_date, max_monthly_invoices, max_turnover_cr, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10, $11, TRUE)
        RETURNING *`,
        [
          firmId,
          entityId,
          title,
          sacCode || "998231",
          billingCycle || "MONTHLY",
          Number(baseFee),
          autoIssue !== false,
          autoDispatch !== false,
          nextRunDate || new Date().toISOString().split("T")[0],
          Number(maxMonthlyInvoices || 100),
          Number(maxTurnoverCr || 5),
        ]
      );
      return NextResponse.json({ success: true, retainer: ins.rows[0] });
    }

    if (action === "RUN_RETAINER_BATCH") {
      const { rows: dueRetainers } = await pool.query(
        `SELECT r.*, ce.entity_name, ce.gstin
         FROM public.retainer_schedules r
         JOIN public.client_entities ce ON ce.id = r.entity_id
         WHERE r.firm_id = $1 AND r.is_active = TRUE AND r.next_run_date <= CURRENT_DATE`,
        [firmId]
      );

      const generated: Array<{ invoiceNo: string; clientName: string; amount: number }> = [];
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
          [firmId, ret.entity_id, invoiceNo, docType, `${ret.title} (${ret.billing_cycle} Retainer)`, ret.sac_code || "998231", taxable, gst, total, dueDate, fy]
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

        generated.push({ invoiceNo, clientName: ret.entity_name, amount: total });
      }

      if (generated.length > 0) {
        await appendPgAuditLog({
          firmId,
          actorId: auth.user?.id,
          actorName: auth.userName || "Autopilot",
          actorRole: "PARTNER",
          entityName: `${generated.length} Retainer Clients`,
          action: "Retainer Autopilot Batch Run",
          details: `Auto-generated ${generated.length} recurring retainer invoice(s).`,
          category: "INVOICE",
        });
      }

      return NextResponse.json({ success: true, generatedCount: generated.length, generated });
    }

    if (action === "CONSOLIDATE_WIP") {
      const { entityId } = body;
      if (!entityId || !UUID_REGEX.test(entityId)) {
        return NextResponse.json({ success: false, error: "Valid entityId required." }, { status: 400 });
      }

      const { rows: jobs } = await pool.query(
        `SELECT w.*, ce.entity_name
         FROM public.wip_jobs w
         JOIN public.client_entities ce ON ce.id = w.entity_id
         WHERE w.firm_id = $1 AND w.entity_id = $2 AND w.status IN ('READY_FOR_BILLING', 'IN_PROGRESS')`,
        [firmId, entityId]
      );

      if (jobs.length === 0) {
        return NextResponse.json({ success: false, error: "No unbilled WIP jobs for this client." }, { status: 404 });
      }

      const lineItems = jobs.map((j: any) => {
        const fee = Math.round(Number(j.estimated_fee || 0));
        const gst = Math.round(fee * 0.18);
        return {
          id: j.id,
          description: j.service_title,
          sacCode: j.sac_code || "998231",
          quantity: 1,
          unitRate: fee,
          discount: 0,
          isPureAgent: false,
          taxableValue: fee,
          gstRate: 18,
          gstAmount: gst,
          lineTotal: fee + gst,
        };
      });

      const taxable = lineItems.reduce((s, l) => s + l.taxableValue, 0);
      const gst = lineItems.reduce((s, l) => s + l.gstAmount, 0);
      const total = taxable + gst;
      const fy = getIndianFyFromDate();
      const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];
      const invoiceNo = await allocateNextDocumentNumber(pool, firmId, "TAX_INVOICE", fy);

      const ins = await pool.query(
        `INSERT INTO public.invoices (
          firm_id, entity_id, invoice_no, document_type, service_description, sac_code,
          line_items, taxable_amount, gst_rate, gst_amount, total_amount, due_date, status, financial_year
        ) VALUES ($1, $2, $3, 'TAX_INVOICE', $4, $5, $6::jsonb, $7, 18, $8, $9, $10, 'PENDING', $11)
        RETURNING *`,
        [
          firmId,
          entityId,
          invoiceNo,
          `Consolidated Monthly Services (${jobs.length} Engagements)`,
          jobs[0].sac_code || "998231",
          JSON.stringify(lineItems),
          taxable,
          gst,
          total,
          dueDate,
          fy,
        ]
      );

      const jobIds = jobs.map((j: any) => j.id);
      await pool.query(
        `UPDATE public.wip_jobs SET status = 'BILLED', invoice_id = $1, updated_at = now() WHERE firm_id = $2 AND id = ANY($3::uuid[])`,
        [ins.rows[0].id, firmId, jobIds]
      );

      return NextResponse.json({ success: true, invoice: ins.rows[0], consolidatedCount: jobs.length });
    }

    return NextResponse.json({ success: false, error: "Invalid autopilot action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/billing/autopilot error:", error);
    return NextResponse.json({ success: false, error: "Failed to process autopilot action." }, { status: 500 });
  }
}
