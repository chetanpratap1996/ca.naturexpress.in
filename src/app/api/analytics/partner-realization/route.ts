import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid } from "@/lib/server/pgHelpers";
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
    const [{ rows: firmRows }, { rows: invRows }, { rows: taskRows }, { rows: groupRows }, { rows: entityRows }] =
      await Promise.all([
        pool.query("SELECT * FROM public.firms WHERE id = $1 LIMIT 1", [firmId]),
        pool.query("SELECT status, total_amount FROM public.invoices WHERE firm_id = $1", [firmId]),
        pool.query("SELECT status, priority, penalty_risk FROM public.compliance_tasks WHERE firm_id = $1", [firmId]),
        pool.query("SELECT unbilled_wip_total, overdue_fees_total FROM public.client_groups WHERE firm_id = $1", [firmId]),
        pool.query("SELECT count(*)::int as cnt FROM public.client_entities WHERE firm_id = $1", [firmId]),
      ]);

    const firm = firmRows[0];
    const realized = invRows
      .filter((i: any) => i.status === "PAID")
      .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
    const pending = invRows
      .filter((i: any) => i.status !== "PAID")
      .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
    const unbilledWip = groupRows.reduce((s: number, g: any) => s + Number(g.unbilled_wip_total || 0), 0);

    return NextResponse.json({
      success: true,
      partnerMetrics: [
        {
          partnerName: auth.userName || DEFAULT_FIRM_BRANDING.managingPartner,
          totalRealizedInr: realized,
          pendingReceivablesInr: pending,
          unbilledWipInr: unbilledWip,
          completedTasks: taskRows.filter((t: any) => t.status === "FILED_AND_COMPLETED").length,
          openTasks: taskRows.filter((t: any) => t.status !== "FILED_AND_COMPLETED").length,
        },
      ],
      securityLogs: [],
      firmMetrics: {
        name: firm?.firm_name || DEFAULT_FIRM_BRANDING.firmName,
        frn: firm?.frn || DEFAULT_FIRM_BRANDING.frn,
        totalClients: entityRows[0]?.cnt || 0,
        pendingCollections: pending,
        unbilledWipAmount: unbilledWip,
        criticalDeadlinesNext72h: taskRows.filter(
          (t: any) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED"
        ).length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/analytics/partner-realization error:", error);
    return NextResponse.json({ success: false, error: "Failed to load realization analytics." }, { status: 500 });
  }
}
