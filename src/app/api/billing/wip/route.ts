import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog } from "@/lib/server/pgHelpers";
import { ensureBillingSchema, getIndianFyFromDate } from "@/lib/server/billingSchema";
import { WipJobItem } from "@/lib/types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_CATEGORY_FEE: Record<string, { fee: number; sac: string; hours: number }> = {
  TAX_AUDIT: { fee: 25000, sac: "998221", hours: 16 },
  INCOME_TAX: { fee: 12000, sac: "998222", hours: 8 },
  GST: { fee: 3500, sac: "998222", hours: 3 },
  TDS: { fee: 4000, sac: "998222", hours: 3 },
  ROC_MCA: { fee: 8500, sac: "998231", hours: 5 },
  TRANSFER_PRICING: { fee: 45000, sac: "998221", hours: 24 },
};

function mapWipRow(row: any): WipJobItem {
  return {
    id: row.id,
    entityId: row.entity_id,
    entityName: row.entity_name || "Client Entity",
    clientPan: row.pan || undefined,
    taskId: row.task_id || null,
    financialYear: row.financial_year,
    serviceTitle: row.service_title,
    sacCode: row.sac_code || "998231",
    assignedStaff: row.assigned_staff || "Practice Team",
    hoursSpent: Number(row.hours_spent || 0),
    estimatedFee: Number(row.estimated_fee || 0),
    completionDate: row.completion_date
      ? new Date(row.completion_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    status: row.status,
    invoiceId: row.invoice_id || null,
  };
}

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

    const sp = request.nextUrl.searchParams;
    const entityId = sp.get("entityId");
    const fy = sp.get("fy");
    const status = sp.get("status") || "READY_FOR_BILLING";
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(sp.get("limit") || "50", 10) || 50));
    const offset = (page - 1) * limit;

    // Auto-surface newly filed/completed compliance tasks as READY_FOR_BILLING WIP jobs (idempotent)
    const { rows: unlinkedTasks } = await pool.query(
      `SELECT t.id, t.entity_id, t.category, t.title, t.due_date, t.updated_at
       FROM public.compliance_tasks t
       LEFT JOIN public.wip_jobs w ON w.task_id = t.id AND w.firm_id = t.firm_id
       WHERE t.firm_id = $1
         AND t.status = 'FILED_AND_COMPLETED'
         AND w.id IS NULL
       LIMIT 200`,
      [firmId]
    );

    if (unlinkedTasks.length > 0) {
      for (const t of unlinkedTasks) {
        const defaults = DEFAULT_CATEGORY_FEE[t.category] || { fee: 5000, sac: "998231", hours: 4 };
        const compDate = t.updated_at || t.due_date || new Date();
        const taskFy = getIndianFyFromDate(compDate);
        await pool.query(
          `INSERT INTO public.wip_jobs (
            firm_id, entity_id, task_id, financial_year, service_title, sac_code,
            assigned_staff, hours_spent, estimated_fee, completion_date, status
          ) VALUES ($1, $2, $3, $4, $5, $6, 'Practice Team', $7, $8, $9::date, 'READY_FOR_BILLING')
          ON CONFLICT (firm_id, task_id) WHERE task_id IS NOT NULL DO NOTHING`,
          [
            firmId,
            t.entity_id,
            t.id,
            taskFy,
            t.title,
            defaults.sac,
            defaults.hours,
            defaults.fee,
            new Date(compDate).toISOString().split("T")[0],
          ]
        );
      }
    }

    const where: string[] = ["w.firm_id = $1"];
    const params: any[] = [firmId];
    let idx = 2;

    if (entityId && UUID_REGEX.test(entityId)) {
      where.push(`w.entity_id = $${idx++}`);
      params.push(entityId);
    }
    if (fy && /^\d{4}-\d{2}$/.test(fy)) {
      where.push(`w.financial_year = $${idx++}`);
      params.push(fy);
    }
    if (status && status !== "ALL") {
      where.push(`w.status = $${idx++}`);
      params.push(status);
    }

    const whereSql = where.join(" AND ");

    const [listRes, summaryRes] = await Promise.all([
      pool.query(
        `SELECT w.*, ce.entity_name, ce.pan
         FROM public.wip_jobs w
         JOIN public.client_entities ce ON ce.id = w.entity_id
         WHERE ${whereSql}
         ORDER BY w.completion_date DESC, w.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total_count,
           COALESCE(SUM(CASE WHEN w.status IN ('READY_FOR_BILLING', 'IN_PROGRESS') THEN w.estimated_fee ELSE 0 END), 0)::numeric AS unbilled_total,
           COUNT(*) FILTER (WHERE w.status IN ('READY_FOR_BILLING', 'IN_PROGRESS'))::int AS unbilled_count
         FROM public.wip_jobs w
         WHERE ${whereSql}`,
        params
      ),
    ]);

    const summaryRow = summaryRes.rows[0] || {};
    return NextResponse.json({
      success: true,
      jobs: listRes.rows.map(mapWipRow),
      pagination: {
        page,
        limit,
        total: Number(summaryRow.total_count || 0),
        totalPages: Math.max(1, Math.ceil(Number(summaryRow.total_count || 0) / limit)),
      },
      summary: {
        unbilledTotal: Number(summaryRow.unbilled_total || 0),
        unbilledCount: Number(summaryRow.unbilled_count || 0),
      },
    });
  } catch (error: any) {
    console.error("GET /api/billing/wip error:", error);
    return NextResponse.json({ success: false, error: "Failed to load WIP jobs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    if (body.action === "CONVERT_TO_INVOICE") {
      if (auth.role !== "PARTNER") {
        return NextResponse.json(
          { success: false, error: "Only firm partners can convert WIP into tax invoices." },
          { status: 403 }
        );
      }

      const wipIds: string[] = Array.isArray(body.wipIds)
        ? body.wipIds.filter((id: any) => UUID_REGEX.test(String(id)))
        : body.wipId && UUID_REGEX.test(String(body.wipId))
        ? [String(body.wipId)]
        : [];

      if (wipIds.length === 0) {
        return NextResponse.json({ success: false, error: "Valid wipId or wipIds required." }, { status: 400 });
      }

      const { rows: jobs } = await pool.query(
        `SELECT w.*, ce.entity_name, ce.group_id
         FROM public.wip_jobs w
         JOIN public.client_entities ce ON ce.id = w.entity_id
         WHERE w.firm_id = $1 AND w.id = ANY($2::uuid[]) AND w.status IN ('READY_FOR_BILLING', 'IN_PROGRESS')`,
        [firmId, wipIds]
      );

      if (jobs.length === 0) {
        return NextResponse.json({ success: false, error: "No eligible unbilled WIP jobs found." }, { status: 404 });
      }

      const createdInvoices = [];
      for (const job of jobs) {
        const taxable = Math.max(1, Math.round(Number(job.estimated_fee || 0)));
        const gst = Math.round(taxable * 0.18);
        const total = taxable + gst;
        const fy = job.financial_year || getIndianFyFromDate();
        const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];

        const countRes = await pool.query(
          "SELECT count(*)::int as cnt FROM public.invoices WHERE firm_id = $1",
          [firmId]
        );
        const invoiceNo = `BT/${fy}/${String((countRes.rows[0]?.cnt || 0) + 101)}`;

        const invRes = await pool.query(
          `INSERT INTO public.invoices (
            firm_id, entity_id, invoice_no, service_description, sac_code,
            taxable_amount, gst_rate, gst_amount, total_amount, due_date, status,
            financial_year, wip_job_id
          ) VALUES ($1, $2, $3, $4, $5, $6, 18, $7, $8, $9, 'PENDING', $10, $11)
          RETURNING *`,
          [
            firmId,
            job.entity_id,
            invoiceNo,
            job.service_title,
            job.sac_code || "998231",
            taxable,
            gst,
            total,
            dueDate,
            fy,
            job.id,
          ]
        );

        const invRow = invRes.rows[0];
        await pool.query(
          `UPDATE public.wip_jobs SET status = 'BILLED', invoice_id = $1, updated_at = now() WHERE id = $2 AND firm_id = $3`,
          [invRow.id, job.id, firmId]
        );

        createdInvoices.push({
          id: invRow.id,
          invoiceNo: invRow.invoice_no,
          entityId: job.entity_id,
          entityName: job.entity_name,
          amount: Number(invRow.total_amount),
        });
      }

      await appendPgAuditLog({
        firmId,
        actorId: auth.user?.id,
        actorName: auth.userName || "Firm Partner",
        actorRole: "PARTNER",
        entityId: jobs.length === 1 ? jobs[0].entity_id : null,
        entityName: jobs.length === 1 ? jobs[0].entity_name : `${jobs.length} Clients`,
        action: "WIP Converted to Tax Invoice",
        details: `Converted ${createdInvoices.length} WIP job(s) into tax invoice(s): ${createdInvoices.map((i) => i.invoiceNo).join(", ")}.`,
        category: "INVOICE",
      });

      return NextResponse.json({ success: true, invoices: createdInvoices });
    }

    // Create manual WIP job
    const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
    const serviceTitle = typeof body.serviceTitle === "string" ? body.serviceTitle.trim() : "";
    const estimatedFee = Number(body.estimatedFee || 0);
    const hoursSpent = Number(body.hoursSpent || 0);
    const sacCode = typeof body.sacCode === "string" && body.sacCode.trim() ? body.sacCode.trim() : "998231";
    const assignedStaff = typeof body.assignedStaff === "string" && body.assignedStaff.trim()
      ? body.assignedStaff.trim()
      : auth.userName || "Practice Team";
    const completionDate = typeof body.completionDate === "string" && body.completionDate
      ? body.completionDate
      : new Date().toISOString().split("T")[0];
    const fy = typeof body.financialYear === "string" && /^\d{4}-\d{2}$/.test(body.financialYear)
      ? body.financialYear
      : getIndianFyFromDate(completionDate);

    if (!UUID_REGEX.test(entityId) || !serviceTitle || !Number.isFinite(estimatedFee) || estimatedFee <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid entityId, serviceTitle, and positive estimatedFee are required." },
        { status: 400 }
      );
    }

    const ins = await pool.query(
      `INSERT INTO public.wip_jobs (
        firm_id, entity_id, financial_year, service_title, sac_code,
        assigned_staff, hours_spent, estimated_fee, completion_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, 'READY_FOR_BILLING')
      RETURNING *`,
      [firmId, entityId, fy, serviceTitle, sacCode, assignedStaff, hoursSpent, estimatedFee, completionDate]
    );

    const entRes = await pool.query(
      "SELECT entity_name, pan FROM public.client_entities WHERE id = $1 AND firm_id = $2 LIMIT 1",
      [entityId, firmId]
    );

    return NextResponse.json({
      success: true,
      job: mapWipRow({
        ...ins.rows[0],
        entity_name: entRes.rows[0]?.entity_name,
        pan: entRes.rows[0]?.pan,
      }),
    });
  } catch (error: any) {
    console.error("POST /api/billing/wip error:", error);
    return NextResponse.json({ success: false, error: "Failed to process WIP request." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { id, estimatedFee, hoursSpent, serviceTitle, sacCode, status } = body;
    if (!id || !UUID_REGEX.test(String(id))) {
      return NextResponse.json({ success: false, error: "Valid WIP id is required." }, { status: 400 });
    }

    const allowedStatuses = ["READY_FOR_BILLING", "IN_PROGRESS", "WRITTEN_OFF"];
    const nextStatus = status && allowedStatuses.includes(status) ? status : null;

    const upd = await pool.query(
      `UPDATE public.wip_jobs
       SET estimated_fee = COALESCE($1, estimated_fee),
           hours_spent = COALESCE($2, hours_spent),
           service_title = COALESCE(NULLIF($3, ''), service_title),
           sac_code = COALESCE(NULLIF($4, ''), sac_code),
           status = COALESCE($5, status),
           updated_at = now()
       WHERE id = $6 AND firm_id = $7
       RETURNING *`,
      [
        estimatedFee !== undefined ? Number(estimatedFee) : null,
        hoursSpent !== undefined ? Number(hoursSpent) : null,
        typeof serviceTitle === "string" ? serviceTitle.trim() : "",
        typeof sacCode === "string" ? sacCode.trim() : "",
        nextStatus,
        id,
        firmId,
      ]
    );

    if (upd.rows.length === 0) {
      return NextResponse.json({ success: false, error: "WIP job not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, job: mapWipRow(upd.rows[0]) });
  } catch (error: any) {
    console.error("PATCH /api/billing/wip error:", error);
    return NextResponse.json({ success: false, error: "Failed to update WIP job." }, { status: 500 });
  }
}
