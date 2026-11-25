import { getPostgresPool } from "@/lib/server/postgres";
import { appendPgAuditLog, listWorkspaceRecords, upsertWorkspaceRecord } from "@/lib/server/pgHelpers";
import {
  executePostgresAutopilotSweep,
  getPostgresAutopilotPosture,
  maybeDraftInvoiceForCompletedTask,
  recalculatePayToReleaseForEntity,
} from "@/lib/automation/postgresAutopilot";
import type {
  PracticeExceptionItem,
  PracticeHeartbeatState,
  PracticePulseEvent,
} from "@/lib/automation/autopilotTypes";

export type { PracticeExceptionItem, PracticeHeartbeatState, PracticePulseEvent };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPostgresHeartbeatState(firmId: string): Promise<PracticeHeartbeatState> {
  const posture = await getPostgresAutopilotPosture(firmId);
  return posture.heartbeat;
}

export async function executePostgresHeartbeatSweep(
  firmId: string,
  actorName?: string
): Promise<PracticeHeartbeatState> {
  const result = await executePostgresAutopilotSweep(firmId, actorName || "Partner Heartbeat Sweep");
  return result.heartbeat;
}

/**
 * Batch approves clean MANAGER_REVIEW / PARTNER_SIGN_OFF tasks whose entity has
 * approved documents and no unresolved Pay-to-Release lock.
 */
export async function batchApproveCleanFilingsPg(
  firmId: string,
  actorId?: string,
  actorName: string = "Managing Partner"
): Promise<{ approvedCount: number; invoicesDrafted: number; taskTitles: string[] }> {
  const pool = getPostgresPool();
  const [{ rows: candidateTasks }, { rows: docRows }, p2rRecs] = await Promise.all([
    pool.query(
      `SELECT t.*, ce.entity_name, ce.group_id
       FROM public.compliance_tasks t
       JOIN public.client_entities ce ON ce.id = t.entity_id
       WHERE t.firm_id = $1 AND t.status IN ('MANAGER_REVIEW', 'PARTNER_SIGN_OFF')`,
      [firmId]
    ),
    pool.query("SELECT entity_id, review_status FROM public.documents WHERE firm_id = $1", [firmId]),
    listWorkspaceRecords<{ entityId: string; isLocked: boolean }>(firmId, "PAY_TO_RELEASE_CONFIG"),
  ]);

  const lockedEntityIds = new Set(p2rRecs.filter((r) => r.payload?.isLocked).map((r) => r.payload.entityId));
  const entitiesWithRejectedDocs = new Set(
    docRows.filter((d: any) => d.review_status === "CORRECTION_NEEDED").map((d: any) => d.entity_id)
  );

  let approvedCount = 0;
  let invoicesDrafted = 0;
  const taskTitles: string[] = [];

  for (const task of candidateTasks) {
    if (lockedEntityIds.has(task.entity_id) || entitiesWithRejectedDocs.has(task.entity_id)) {
      continue;
    }

    const arn = task.arn_number || `AA${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
    await pool.query(
      `UPDATE public.compliance_tasks
       SET status = 'FILED_AND_COMPLETED'::workflow_status,
           arn_number = $1,
           filing_date = CURRENT_DATE,
           penalty_risk = 0,
           accruing_daily_penalty = 0,
           updated_at = now()
       WHERE id = $2 AND firm_id = $3`,
      [arn, task.id, firmId]
    );

    const drafted = await maybeDraftInvoiceForCompletedTask({
      firmId,
      taskRow: task,
      actorName,
    });
    if (drafted) invoicesDrafted++;

    await upsertWorkspaceRecord({
      firmId,
      entityId: task.entity_id,
      recordType: "NOTIFICATION",
      matchKey: "idKey",
      matchValue: `batch-filed-${task.id}`,
      payload: {
        id: `NOTIF-BATCH-${task.id}`,
        idKey: `batch-filed-${task.id}`,
        title: `Return Batch-Approved & Filed: ${task.title}`,
        message: `${task.title} (${task.period}) approved by ${actorName} (ARN: ${arn}).`,
        category: "COMPLIANCE",
        priority: "HIGH",
        recipientRole: "CLIENT",
        recipientEntityId: task.entity_id,
        targetTab: "vault",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });

    approvedCount++;
    taskTitles.push(`${task.entity_name}: ${task.title}`);
  }

  await appendPgAuditLog({
    firmId,
    actorId,
    actorName,
    actorRole: "PARTNER",
    entityName: "Batch Approval Queue",
    action: "Batch Approved Clean Filings",
    details: `Partner batch-filed ${approvedCount} clean return(s) and auto-drafted ${invoicesDrafted} SAC 9982 invoice(s).`,
    category: "COMPLIANCE",
  });

  return { approvedCount, invoicesDrafted, taskTitles };
}

/**
 * Executes real database/notification side-effects when a Partner resolves an exception.
 */
export async function resolvePartnerExceptionPg(params: {
  firmId: string;
  exceptionId: string;
  actorId?: string;
  actorName: string;
}): Promise<{ state: PracticeHeartbeatState; actionMessage: string }> {
  const { firmId, exceptionId, actorId, actorName } = params;
  const pool = getPostgresPool();
  const stateBefore = await getPostgresHeartbeatState(firmId);
  const target = stateBefore.exceptions.find((e) => e.id === exceptionId);
  const entityId = target?.entityId && UUID_REGEX.test(target.entityId) ? target.entityId : null;

  let actionMessage = `Exception ${exceptionId} marked resolved by ${actorName}.`;

  if (exceptionId.startsWith("EXC-UTR-")) {
    const invoiceId = exceptionId.replace("EXC-UTR-", "");
    if (UUID_REGEX.test(invoiceId)) {
      const actorUuid = actorId && UUID_REGEX.test(actorId) ? actorId : null;
      const upd = await pool.query(
        `UPDATE public.invoices
         SET status = 'PAID', reconciled_by_id = $1, reconciled_at = now()
         WHERE id = $2 AND firm_id = $3
         RETURNING entity_id, invoice_no`,
        [actorUuid, invoiceId, firmId]
      );
      if (upd.rows[0]) {
        await recalculatePayToReleaseForEntity({
          firmId,
          entityId: upd.rows[0].entity_id,
        });
        actionMessage = `Invoice #${upd.rows[0].invoice_no} reconciled as PAID and deliverable lock updated.`;
      }
    }
  } else if (exceptionId.startsWith("EXC-TASK-")) {
    const taskId = exceptionId.replace("EXC-TASK-", "");
    if (UUID_REGEX.test(taskId)) {
      const { rows } = await pool.query(
        "SELECT id, entity_id, title, status, period FROM public.compliance_tasks WHERE id = $1 AND firm_id = $2 LIMIT 1",
        [taskId, firmId]
      );
      const task = rows[0];
      if (task) {
        if (task.status === "DOCUMENTS_AWAITED") {
          await pool.query(
            "UPDATE public.compliance_tasks SET chase_count = COALESCE(chase_count, 0) + 1, last_chase_at = now() WHERE id = $1 AND firm_id = $2",
            [task.id, firmId]
          );
          await upsertWorkspaceRecord({
            firmId,
            entityId: task.entity_id,
            recordType: "NOTIFICATION",
            payload: {
              id: `NOTIF-CHASE-${Date.now()}`,
              title: `Priority Document Request: ${task.title}`,
              message: `Urgent partner follow-up for ${task.period}. Upload missing records immediately.`,
              category: "COMPLIANCE",
              priority: "CRITICAL",
              recipientRole: "CLIENT",
              recipientEntityId: task.entity_id,
              targetTab: "progress",
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          });
          actionMessage = `Priority client chase sent for "${task.title}".`;
        } else if (task.status === "PARTNER_SIGN_OFF") {
          const arn = `AA${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
          await pool.query(
            `UPDATE public.compliance_tasks
             SET status = 'FILED_AND_COMPLETED'::workflow_status, arn_number = $1, filing_date = CURRENT_DATE,
                 penalty_risk = 0, accruing_daily_penalty = 0, updated_at = now()
             WHERE id = $2 AND firm_id = $3`,
            [arn, task.id, firmId]
          );
          await maybeDraftInvoiceForCompletedTask({
            firmId,
            taskRow: { ...task, category: target?.moduleCode || "GST" },
            actorName,
          });
          actionMessage = `Partner approved "${task.title}" (ARN ${arn}) and queued WIP invoice.`;
        } else {
          await pool.query(
            "UPDATE public.compliance_tasks SET status = 'PARTNER_SIGN_OFF'::workflow_status, updated_at = now() WHERE id = $1 AND firm_id = $2",
            [task.id, firmId]
          );
          actionMessage = `Moved "${task.title}" directly to Partner Sign-Off.`;
        }
      }
    }
  } else if (entityId) {
    await upsertWorkspaceRecord({
      firmId,
      entityId,
      recordType: "NOTIFICATION",
      payload: {
        id: `NOTIF-EXC-${Date.now()}`,
        title: `Partner Action Dispatched: ${target?.title || exceptionId}`,
        message: target?.recommendedAction || "Action approved by Managing Partner.",
        category: target?.moduleCode === "BILLING" ? "BILLING" : "COMPLIANCE",
        priority: "HIGH",
        recipientRole: "ALL",
        recipientEntityId: entityId,
        targetTab: target?.moduleCode === "LITIGATION" || exceptionId.startsWith("EXC-DSC-") ? "director-risk" : "progress",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    });
  }

  await upsertWorkspaceRecord({
    firmId,
    entityId,
    recordType: "RESOLVED_EXCEPTION",
    matchKey: "exceptionId",
    matchValue: exceptionId,
    payload: {
      exceptionId,
      resolvedBy: actorName,
      resolvedAt: new Date().toISOString(),
      actionMessage,
    },
  });

  await appendPgAuditLog({
    firmId,
    actorId,
    actorName,
    actorRole: "PARTNER",
    entityId,
    entityName: target?.clientName || "Practice Exception",
    action: "Autopilot Exception Resolved",
    details: actionMessage,
    category: target?.moduleCode || "SYSTEM",
  });

  const nextState = await getPostgresHeartbeatState(firmId);
  return { state: nextState, actionMessage };
}
