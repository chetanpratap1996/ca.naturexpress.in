import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid } from "@/lib/server/pgHelpers";
import { ensureBillingSchema } from "@/lib/server/billingSchema";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

export async function GET(request: NextRequest) {
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

    const fy = request.nextUrl.searchParams.get("fy");
    const entityId = request.nextUrl.searchParams.get("entityId");
    const hasFy = Boolean(fy && /^\d{4}-\d{2}$/.test(fy));
    const hasEntity = Boolean(entityId && /^[0-9a-f-]{36}$/i.test(entityId));

    const invParams: any[] = [firmId];
    let invWhere = "firm_id = $1";
    if (hasFy) {
      invParams.push(fy);
      invWhere += ` AND financial_year = $${invParams.length}`;
    }
    if (hasEntity) {
      invParams.push(entityId);
      invWhere += ` AND entity_id = $${invParams.length}`;
    }

    const wipParams: any[] = [firmId];
    let wipWhere = "firm_id = $1 AND status IN ('READY_FOR_BILLING', 'IN_PROGRESS')";
    if (hasFy) {
      wipParams.push(fy);
      wipWhere += ` AND financial_year = $${wipParams.length}`;
    }
    if (hasEntity) {
      wipParams.push(entityId);
      wipWhere += ` AND entity_id = $${wipParams.length}`;
    }

    const [
      { rows: firmRows },
      { rows: invAgg },
      { rows: wipAgg },
      { rows: taskAgg },
      { rows: entityAgg },
      { rows: auditRows },
      { rows: serviceMixRows },
      { rows: retainerForecastRows },
    ] = await Promise.all([
      pool.query("SELECT * FROM public.firms WHERE id = $1 LIMIT 1", [firmId]),
      pool.query(
        `SELECT
           COALESCE(SUM(total_amount), 0)::numeric AS total_billed,
           COALESCE(SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END), 0)::numeric AS realized,
           COALESCE(SUM(CASE WHEN status <> 'PAID' THEN total_amount ELSE 0 END), 0)::numeric AS pending,
           COALESCE(SUM(CASE WHEN status <> 'PAID' AND (CURRENT_DATE - due_date) <= 15 THEN total_amount ELSE 0 END), 0)::numeric AS bucket_0_15,
           COALESCE(SUM(CASE WHEN status <> 'PAID' AND (CURRENT_DATE - due_date) BETWEEN 16 AND 30 THEN total_amount ELSE 0 END), 0)::numeric AS bucket_16_30,
           COALESCE(SUM(CASE WHEN status <> 'PAID' AND (CURRENT_DATE - due_date) BETWEEN 31 AND 45 THEN total_amount ELSE 0 END), 0)::numeric AS bucket_31_45,
           COALESCE(SUM(CASE WHEN status <> 'PAID' AND (CURRENT_DATE - due_date) > 45 THEN total_amount ELSE 0 END), 0)::numeric AS bucket_45_plus,
           COALESCE(SUM(CASE WHEN status <> 'PAID' AND (CURRENT_DATE - due_date) > 90 THEN total_amount ELSE 0 END), 0)::numeric AS aging_90_plus
         FROM public.invoices
         WHERE ${invWhere}`,
        invParams
      ),
      pool.query(
        `SELECT COALESCE(SUM(estimated_fee), 0)::numeric AS unbilled_wip, COALESCE(SUM(hours_spent), 0)::numeric AS total_hours
         FROM public.wip_jobs WHERE ${wipWhere}`,
        wipParams
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'FILED_AND_COMPLETED')::int AS completed_tasks,
           COUNT(*) FILTER (WHERE status <> 'FILED_AND_COMPLETED')::int AS open_tasks,
           COUNT(*) FILTER (WHERE priority = 'CRITICAL' AND status <> 'FILED_AND_COMPLETED')::int AS critical_tasks
         FROM public.compliance_tasks WHERE firm_id = $1`,
        [firmId]
      ),
      pool.query("SELECT COUNT(*)::int AS cnt FROM public.client_entities WHERE firm_id = $1", [firmId]),
      pool.query(
        `SELECT id, actor_name, actor_role, entity_name, action, details, category, ip_address, created_at
         FROM public.audit_logs
         WHERE firm_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [firmId]
      ),
      pool.query(
        `SELECT COALESCE(sac_code, '998231') AS sac_code, COALESCE(SUM(total_amount), 0)::numeric AS amount, COUNT(*)::int AS cnt
         FROM public.invoices WHERE ${invWhere}
         GROUP BY COALESCE(sac_code, '998231')
         ORDER BY amount DESC`,
        invParams
      ),
      pool.query(
        `SELECT COALESCE(SUM(base_fee * 1.18), 0)::numeric AS scheduled_30d
         FROM public.retainer_schedules
         WHERE firm_id = $1 AND is_active = TRUE AND next_run_date <= CURRENT_DATE + INTERVAL '30 days'`,
        [firmId]
      ),
    ]);

    const firm = firmRows[0];
    const inv = invAgg[0] || {};
    const wip = wipAgg[0] || {};
    const tsk = taskAgg[0] || {};
    const totalBilled = Number(inv.total_billed || 0);
    const realized = Number(inv.realized || 0);
    const pending = Number(inv.pending || 0);
    const unbilledWip = Number(wip.unbilled_wip || 0);

    return NextResponse.json({
      success: true,
      partnerMetrics: [
        {
          partnerName: auth.userName || DEFAULT_FIRM_BRANDING.managingPartner,
          assignedClientsCount: entityAgg[0]?.cnt || 0,
          billableHoursThisMonth: Number(wip.total_hours || 0),
          unbilledWipAmount: unbilledWip,
          billedThisMonth: totalBilled,
          recoveredThisMonth: realized,
          realizationPercentage: totalBilled > 0 ? Number(((realized / totalBilled) * 100).toFixed(1)) : 0,
          agingAbove90DaysAmount: Number(inv.aging_90_plus || 0),
          atRiskPenaltyClients: Number(tsk.critical_tasks || 0),
          completedTasks: Number(tsk.completed_tasks || 0),
          openTasks: Number(tsk.open_tasks || 0),
        },
      ],
      agingBuckets: {
        bucket0to15: Number(inv.bucket_0_15 || 0),
        bucket16to30: Number(inv.bucket_16_30 || 0),
        bucket31to45: Number(inv.bucket_31_45 || 0),
        bucket45Plus: Number(inv.bucket_45_plus || 0),
      },
      cashflowForecast30d: {
        openReceivablesDue30d: Number(inv.bucket_0_15 || 0) + Number(inv.bucket_16_30 || 0),
        scheduledRetainers30d: Number(retainerForecastRows[0]?.scheduled_30d || 0),
        projectedInflow30d:
          Math.round((Number(inv.bucket_0_15 || 0) + Number(inv.bucket_16_30 || 0)) * 0.78) +
          Number(retainerForecastRows[0]?.scheduled_30d || 0),
      },
      serviceMix: serviceMixRows.map((r: any) => ({
        sacCode: r.sac_code,
        amount: Number(r.amount || 0),
        count: Number(r.cnt || 0),
      })),
      securityLogs: auditRows.map((r: any) => ({
        id: r.id,
        timestamp: new Date(r.created_at).toLocaleString("en-IN"),
        staffName: r.actor_name,
        staffRole: r.actor_role,
        action: r.action,
        entityName: r.entity_name,
        ipAddress: r.ip_address || "Internal",
        status: "VERIFIED",
        details: r.details,
      })),
      firmMetrics: {
        name: firm?.firm_name || DEFAULT_FIRM_BRANDING.firmName,
        frn: firm?.frn || DEFAULT_FIRM_BRANDING.frn,
        totalClients: entityAgg[0]?.cnt || 0,
        pendingCollections: pending,
        unbilledWipAmount: unbilledWip,
        criticalDeadlinesNext72h: Number(tsk.critical_tasks || 0),
      },
    });
  } catch (error: any) {
    console.error("GET /api/analytics/partner-realization error:", error);
    return NextResponse.json({ success: false, error: "Failed to load realization analytics." }, { status: 500 });
  }
}
