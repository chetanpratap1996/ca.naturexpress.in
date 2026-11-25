import { NextRequest, NextResponse } from "next/server";
import { ComplianceTask } from "@/lib/types";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, appendPgAuditLog, upsertWorkspaceRecord, listWorkspaceRecords } from "@/lib/server/pgHelpers";
import { getAutopilotPolicy, maybeDraftInvoiceForCompletedTask } from "@/lib/automation/postgresAutopilot";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES = [
  "DOCUMENTS_AWAITED",
  "IN_PREPARATION",
  "MANAGER_REVIEW",
  "PARTNER_SIGN_OFF",
  "FILED_AND_COMPLETED",
];

function mapTaskRow(t: any, entityMap: Map<string, { name: string; groupId: string }>): ComplianceTask {
  const ent = entityMap.get(t.entity_id);
  return {
    id: t.id,
    entityId: t.entity_id,
    entityName: ent?.name || "Practice Client",
    groupId: ent?.groupId || "",
    category: t.category,
    title: t.title,
    period: t.period,
    dueDate: t.due_date ? new Date(t.due_date).toISOString().split("T")[0] : "2026-11-30",
    status: t.status,
    assignedTo: "Practice Team",
    reviewedBy: DEFAULT_FIRM_BRANDING.managingPartner,
    priority: t.priority,
    penaltyRisk: Number(t.penalty_risk || 0),
    accruingDailyPenalty: Number(t.accruing_daily_penalty || 0),
    missingDocumentsCount: Array.isArray(t.missing_docs_list) ? t.missing_docs_list.length : 0,
    missingDocumentsList: Array.isArray(t.missing_docs_list) ? t.missing_docs_list : [],
    chaseCount: t.chase_count || 0,
    arnNumber: t.arn_number || undefined,
    officialUdin: t.official_udin || undefined,
    udinGeneratedAt: t.udin_generated_at ? new Date(t.udin_generated_at).toISOString() : undefined,
    filingDate: t.filing_date ? new Date(t.filing_date).toISOString().split("T")[0] : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const [{ rows: entRows }, { rows: taskRows }, { rows: userRows }, gstMetaRecs] = await Promise.all([
      pool.query("SELECT id, entity_name, group_id FROM public.client_entities WHERE firm_id = $1", [firmId]),
      auth.role === "CLIENT" && auth.clientEntityId && UUID_REGEX.test(auth.clientEntityId)
        ? pool.query("SELECT * FROM public.compliance_tasks WHERE firm_id = $1 AND entity_id = $2 ORDER BY due_date ASC", [
            firmId,
            auth.clientEntityId,
          ])
        : pool.query("SELECT * FROM public.compliance_tasks WHERE firm_id = $1 ORDER BY due_date ASC", [firmId]),
      pool.query("SELECT id, full_name FROM public.users WHERE firm_id = $1", [firmId]),
      listWorkspaceRecords<any>(firmId, "GST_FILING_METADATA"),
    ]);

    const gstMetaByTask = new Map<string, any>();
    for (const r of gstMetaRecs) {
      if (r.payload?.taskId) gstMetaByTask.set(r.payload.taskId, r.payload);
    }

    const entityMap = new Map<string, { name: string; groupId: string }>();
    for (const e of entRows) {
      entityMap.set(e.id, { name: e.entity_name, groupId: e.group_id });
    }
    const staffNameById = new Map<string, string>(userRows.map((u: any) => [u.id, u.full_name]));

    let tasks = taskRows.map((t: any) => {
      const mapped = mapTaskRow(t, entityMap);
      const meta = gstMetaByTask.get(t.id);
      if (meta) {
        mapped.gstin = meta.gstin || mapped.gstin;
        mapped.challanCin = meta.challanCin;
        mapped.taxPayableAmount = meta.taxPayableAmount !== undefined ? Number(meta.taxPayableAmount) : mapped.taxPayableAmount;
        mapped.section50Interest = meta.section50Interest !== undefined ? Number(meta.section50Interest) : mapped.section50Interest;
        mapped.lateFeeAmount = meta.lateFeeAmount !== undefined ? Number(meta.lateFeeAmount) : mapped.lateFeeAmount;
        mapped.isNilReturn = meta.isNilReturn || false;
        mapped.outwardTaxBreakdown = meta.outwardTaxBreakdown;
        mapped.rcmTax = meta.rcmTax !== undefined ? Number(meta.rcmTax) : undefined;
        mapped.itcUtilized = meta.itcUtilized;
        mapped.closingCreditLedger = meta.closingCreditLedger;
        mapped.cashPaid = meta.cashPaid !== undefined ? Number(meta.cashPaid) : undefined;
      }
      if (t.assigned_to_id && staffNameById.has(t.assigned_to_id)) {
        mapped.assignedTo = staffNameById.get(t.assigned_to_id)!;
        mapped.assignedStaffId = t.assigned_to_id;
      } else {
        mapped.assignedTo = "Unassigned";
      }
      return mapped;
    });
    if (auth.role === "CLIENT") {
      tasks = tasks.filter(
        (t: ComplianceTask) =>
          (auth.clientEntityId && t.entityId === auth.clientEntityId) ||
          (!auth.clientEntityId && auth.clientGroupId && t.groupId === auth.clientGroupId)
      );
    }

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ success: false, error: "Failed to load compliance tasks." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Partner access required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await req.json();
    if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 200 || typeof body.entityId !== "string") {
      return NextResponse.json({ success: false, error: "A valid task title and entityId are required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    const entRes = UUID_REGEX.test(body.entityId)
      ? await pool.query("SELECT id, entity_name, group_id FROM public.client_entities WHERE id = $1 AND firm_id = $2 LIMIT 1", [
          body.entityId,
          firmId,
        ])
      : await pool.query(
          "SELECT id, entity_name, group_id FROM public.client_entities WHERE firm_id = $1 AND LOWER(entity_name) = LOWER($2) LIMIT 1",
          [firmId, body.entityName || ""]
        );

    if (entRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Client entity not found in your firm." }, { status: 404 });
    }
    const entity = entRes.rows[0];

    const dueDate = body.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];
    const status = VALID_STATUSES.includes(body.status) ? body.status : "DOCUMENTS_AWAITED";
    const priority = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(body.priority) ? body.priority : "HIGH";
    const category = ["GST", "INCOME_TAX", "TAX_AUDIT", "TDS", "ROC_MCA", "TRANSFER_PRICING"].includes(body.category)
      ? body.category
      : "GST";

    const ins = await pool.query(
      `INSERT INTO public.compliance_tasks (
        firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty, missing_docs_list, chase_count
      ) VALUES ($1, $2, $3::compliance_category, $4, $5, $6, $7::workflow_status, $8::task_priority, $9, $10, $11::jsonb, 0)
      RETURNING *`,
      [
        firmId,
        entity.id,
        category,
        body.title.trim(),
        body.period || "Current Period",
        dueDate,
        status,
        priority,
        Number(body.penaltyRisk) || 0,
        Number(body.accruingDailyPenalty) || 0,
        JSON.stringify(Array.isArray(body.missingDocumentsList) ? body.missingDocumentsList : []),
      ]
    );

    const row = ins.rows[0];
    const entityMap = new Map([[entity.id, { name: entity.entity_name, groupId: entity.group_id }]]);
    const newTask = mapTaskRow(row, entityMap);

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Firm Partner",
      actorRole: "PARTNER",
      entityId: entity.id,
      entityName: entity.entity_name,
      action: "Task Created",
      details: `Created ${newTask.title} (${newTask.period}) due ${newTask.dueDate}.`,
      category: "COMPLIANCE",
    });

    await upsertWorkspaceRecord({
      firmId,
      entityId: entity.id,
      recordType: "NOTIFICATION",
      payload: {
        id: `NOTIF-TSK-${row.id}`,
        title: `New Statutory Assignment: ${newTask.title}`,
        message: `Created for ${entity.entity_name}. Due Date: ${newTask.dueDate}.`,
        category: "COMPLIANCE",
        priority: newTask.priority === "CRITICAL" ? "URGENT" : "NORMAL",
        recipientRole: "ALL",
        recipientEntityId: entity.id,
        targetTab: "calendar",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, task: newTask });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create task." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff access required." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const body = await req.json();
    const {
      taskId, status, officialUdin, chaseCount, arnNumber, assignedStaffId, assignedTo, priority, dueDate,
      filingDate, gstin, challanCin, taxPayableAmount, section50Interest, lateFeeAmount, isNilReturn,
      outwardTaxBreakdown, rcmTax, itcUtilized, closingCreditLedger, cashPaid,
    } = body;

    if (!taskId || !UUID_REGEX.test(String(taskId))) {
      return NextResponse.json({ success: false, error: "Valid taskId is required." }, { status: 400 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const existingRes = await pool.query(
      `SELECT t.*, ce.entity_name, ce.group_id
       FROM public.compliance_tasks t
       JOIN public.client_entities ce ON ce.id = t.entity_id
       WHERE t.id = $1 AND t.firm_id = $2
       LIMIT 1`,
      [taskId, firmId]
    );
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const cur = existingRes.rows[0];

    if (officialUdin !== undefined) {
      if (auth.role !== "PARTNER" || !/^[0-9]{8}[A-Z0-9]{10}$/.test(String(officialUdin))) {
        return NextResponse.json(
          { success: false, error: "Only a partner can record a valid 18-character ICAI UDIN." },
          { status: 403 }
        );
      }
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid task workflow status." }, { status: 400 });
    }
    if (chaseCount !== undefined && (!Number.isInteger(chaseCount) || chaseCount < (cur.chase_count || 0))) {
      return NextResponse.json({ success: false, error: "Chase count must be a non-decreasing integer." }, { status: 400 });
    }

    const nextStatus = status || cur.status;
    const isCompleted = nextStatus === "FILED_AND_COMPLETED";
    const nextArn = arnNumber !== undefined ? (String(arnNumber).trim() || null) : cur.arn_number;
    const nextFilingDate = filingDate || (isCompleted ? cur.filing_date || new Date().toISOString().split("T")[0] : cur.filing_date);

    let resolvedStaffId: string | null = null;
    if (assignedStaffId && UUID_REGEX.test(String(assignedStaffId))) {
      resolvedStaffId = assignedStaffId;
    } else if (typeof assignedTo === "string" && assignedTo.trim()) {
      const cleanName = assignedTo.replace(/\s*\([^)]*\)\s*$/, "").trim();
      const sRes = await pool.query(
        "SELECT id FROM public.users WHERE firm_id = $1 AND LOWER(full_name) = LOWER($2) LIMIT 1",
        [firmId, cleanName]
      );
      if (sRes.rows[0]?.id) resolvedStaffId = sRes.rows[0].id;
    }

    const nextPriority = priority && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(priority) ? priority : null;

    const upd = await pool.query(
      `UPDATE public.compliance_tasks
       SET status = $1::workflow_status,
           official_udin = COALESCE($2, official_udin),
           udin_generated_at = CASE WHEN $2 IS NOT NULL THEN now() ELSE udin_generated_at END,
           chase_count = COALESCE($3, chase_count),
           last_chase_at = CASE WHEN $3 IS NOT NULL THEN now() ELSE last_chase_at END,
           arn_number = $4,
           filing_date = $5,
           assigned_to_id = COALESCE($6, assigned_to_id),
           priority = COALESCE($7::task_priority, priority),
           due_date = COALESCE($8::date, due_date),
           penalty_risk = CASE WHEN $1 = 'FILED_AND_COMPLETED' THEN 0 ELSE penalty_risk END,
           accruing_daily_penalty = CASE WHEN $1 = 'FILED_AND_COMPLETED' THEN 0 ELSE accruing_daily_penalty END,
           updated_at = now()
       WHERE id = $9 AND firm_id = $10
       RETURNING *`,
      [nextStatus, officialUdin || null, chaseCount ?? null, nextArn, nextFilingDate, resolvedStaffId, nextPriority, dueDate || null, taskId, firmId]
    );

    const updatedRow = upd.rows[0];

    if (
      gstin !== undefined ||
      challanCin !== undefined ||
      taxPayableAmount !== undefined ||
      section50Interest !== undefined ||
      lateFeeAmount !== undefined ||
      isNilReturn !== undefined ||
      outwardTaxBreakdown !== undefined ||
      rcmTax !== undefined ||
      itcUtilized !== undefined ||
      closingCreditLedger !== undefined ||
      cashPaid !== undefined
    ) {
      const existingMetaRecs = await listWorkspaceRecords<any>(firmId, "GST_FILING_METADATA", cur.entity_id);
      const prevMeta = existingMetaRecs.find((r) => r.payload?.taskId === taskId)?.payload || {};
      await upsertWorkspaceRecord({
        firmId,
        entityId: cur.entity_id,
        recordType: "GST_FILING_METADATA",
        matchKey: "taskId",
        matchValue: taskId,
        payload: {
          ...prevMeta,
          taskId,
          ...(gstin !== undefined ? { gstin } : {}),
          ...(challanCin !== undefined ? { challanCin } : {}),
          ...(taxPayableAmount !== undefined ? { taxPayableAmount } : {}),
          ...(section50Interest !== undefined ? { section50Interest } : {}),
          ...(lateFeeAmount !== undefined ? { lateFeeAmount } : {}),
          ...(isNilReturn !== undefined ? { isNilReturn } : {}),
          ...(outwardTaxBreakdown !== undefined ? { outwardTaxBreakdown } : {}),
          ...(rcmTax !== undefined ? { rcmTax } : {}),
          ...(itcUtilized !== undefined ? { itcUtilized } : {}),
          ...(closingCreditLedger !== undefined ? { closingCreditLedger } : {}),
          ...(cashPaid !== undefined ? { cashPaid } : {}),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    let autoDraftedInvoice: any = null;
    if (isCompleted && cur.status !== "FILED_AND_COMPLETED") {
      const ackName = `${cur.title.replace(/\s+/g, "_")}_Acknowledgment_${nextArn}.pdf`;
      const docCat = cur.category === "GST" ? "GST_INVOICES" : cur.category === "TDS" ? "CHALLAN" : "TAX_COMPUTATION";
      const actorUuid = auth.user?.id && UUID_REGEX.test(auth.user.id) ? auth.user.id : null;

      await pool.query(
        `INSERT INTO public.documents (
          firm_id, entity_id, task_id, category, file_name, file_size_bytes, financial_year, review_status, reviewed_by_id, reviewed_at
        ) VALUES ($1, $2, $3, $4::document_category, $5, 250880, $6, 'APPROVED', $7, now())`,
        [firmId, cur.entity_id, cur.id, docCat, ackName, cur.period || "FY 2026-27", actorUuid]
      );

      await upsertWorkspaceRecord({
        firmId,
        entityId: cur.entity_id,
        recordType: "NOTIFICATION",
        payload: {
          id: `NOTIF-FILED-${Date.now()}`,
          title: `Return Successfully Filed: ${cur.title}`,
          message: `Official return for ${cur.period} has been filed (ARN: ${nextArn}). Acknowledgment available in your Vault.`,
          category: "COMPLIANCE",
          priority: "HIGH",
          recipientRole: "CLIENT",
          recipientEntityId: cur.entity_id,
          targetTab: "vault",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      });

      const policy = await getAutopilotPolicy(firmId);
      if (policy.enabled && policy.autoDraftInvoices) {
        autoDraftedInvoice = await maybeDraftInvoiceForCompletedTask({
          firmId,
          taskRow: { ...updatedRow, entity_name: cur.entity_name, group_id: cur.group_id },
          actorName: auth.userName || "Practice Autopilot",
        }).catch(() => null);
      }
    }

    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Practice Staff",
      actorRole: auth.role || "ARTICLE",
      entityId: cur.entity_id,
      entityName: cur.entity_name,
      action: officialUdin ? "UDIN Recorded" : "Task Updated",
      details: officialUdin
        ? `Recorded ICAI UDIN ${officialUdin} for ${cur.title}.`
        : `Updated ${cur.title} status to ${nextStatus}.`,
      category: "COMPLIANCE",
    });

    const entityMap = new Map([[cur.entity_id, { name: cur.entity_name, groupId: cur.group_id }]]);
    return NextResponse.json({ success: true, task: mapTaskRow(updatedRow, entityMap), autoDraftedInvoice });
  } catch (error: any) {
    console.error("PATCH /api/tasks error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update task." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json(
        { success: false, error: "Partner access required to delete tasks." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("id");
    if (!taskId || !UUID_REGEX.test(taskId)) {
      return NextResponse.json({ success: false, error: "Valid task ID required." }, { status: 400 });
    }
    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const del = await pool.query(
      "DELETE FROM public.compliance_tasks WHERE id = $1 AND firm_id = $2 RETURNING entity_id, title",
      [taskId, firmId]
    );
    if (del.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }
    await appendPgAuditLog({
      firmId,
      actorId: auth.user?.id,
      actorName: auth.userName || "Firm Partner",
      actorRole: "PARTNER",
      entityId: del.rows[0].entity_id,
      entityName: del.rows[0].title,
      action: "Task Deleted",
      details: `Removed compliance task '${del.rows[0].title}'.`,
      category: "COMPLIANCE",
    });
    return NextResponse.json({ success: true, id: taskId });
  } catch (error: any) {
    console.error("DELETE /api/tasks error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete task." }, { status: 500 });
  }
}
