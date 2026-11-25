import { ComplianceTask, StaffMember, CompetencyTier, StaffSpecialization } from "@/lib/types";
import { getPostgresPool } from "@/lib/server/postgres";
import { appendPgAuditLog, listWorkspaceRecords } from "@/lib/server/pgHelpers";

export interface AutonomousDispatchResult {
  success: boolean;
  tasksEvaluated: number;
  tasksReassigned: number;
  breakdownByStaff: Record<string, { total: number; critical: number; tier: number }>;
  auditLog: {
    taskId: string;
    taskTitle: string;
    entityName: string;
    previousAssigned: string;
    newAssigned: string;
    reason: string;
  }[];
  timestamp: string;
}

export function getRequiredToolForTask(task: ComplianceTask): string {
  const title = (task.title || "").toLowerCase();
  const category = (task.category || "").toUpperCase();

  if (
    title.includes("notice") ||
    title.includes("scrutiny") ||
    title.includes("148") ||
    title.includes("asmt") ||
    title.includes("drc") ||
    title.includes("udin")
  ) {
    return "notices-udin";
  }
  if (category === "GST" || title.includes("gstr")) {
    return "gst";
  }
  if (
    category === "INCOME_TAX" ||
    category === "TAX_AUDIT" ||
    category === "TDS" ||
    title.includes("3cd") ||
    title.includes("itr") ||
    title.includes("tax") ||
    title.includes("challan 28")
  ) {
    return "tax-audit";
  }
  if (category === "ROC_MCA" || title.includes("dir-3") || title.includes("mca") || title.includes("aoc-4")) {
    return "tax-audit";
  }
  return "tasks";
}

export function getRequiredTierForTask(task: ComplianceTask): CompetencyTier {
  const title = (task.title || "").toLowerCase();
  const category = task.category || "";

  if (title.includes("scrutiny") || title.includes("148") || title.includes("appeal") || (task.priority === "CRITICAL" && category === "TAX_AUDIT")) {
    return 4;
  }
  if (
    category === "TAX_AUDIT" ||
    title.includes("form 3cd") ||
    title.includes("itr-6") ||
    title.includes("aoc-4") ||
    title.includes("mgt-7") ||
    title.includes("advance tax q3")
  ) {
    return 3;
  }
  if (
    (category === "GST" && title.includes("3b")) ||
    (category === "TDS" && title.includes("26q")) ||
    title.includes("itr-") ||
    title.includes("form 8")
  ) {
    return 2;
  }
  return 1;
}

export function mapCategoryToSpecialization(category: string): StaffSpecialization {
  switch (category) {
    case "GST":
      return "GST";
    case "INCOME_TAX":
      return "INCOME_TAX";
    case "TAX_AUDIT":
      return "TAX_AUDIT";
    case "ROC_MCA":
      return "MCA_ROC";
    case "TDS":
      return "TDS";
    default:
      return "BOOKKEEPING";
  }
}

export function autoAssignTasksInMemory(
  tasks: ComplianceTask[],
  staffList: StaffMember[]
): {
  tasksEvaluated: number;
  tasksReassigned: number;
  breakdownByStaff: AutonomousDispatchResult["breakdownByStaff"];
  auditLog: AutonomousDispatchResult["auditLog"];
} {
  const activeStaff = (staffList || []).filter((s) => s.status === "ACTIVE");
  if (activeStaff.length === 0) {
    return { tasksEvaluated: 0, tasksReassigned: 0, breakdownByStaff: {}, auditLog: [] };
  }

  const assignedCounts = new Map<string, number>();
  const criticalCounts = new Map<string, number>();
  activeStaff.forEach((s) => {
    assignedCounts.set(s.id, 0);
    criticalCounts.set(s.id, 0);
  });

  const clientAffinityMap = new Map<string, string>();
  tasks.forEach((t) => {
    if (t.entityId && t.assignedTo && t.assignedTo !== "Unassigned") {
      clientAffinityMap.set(t.entityId, t.assignedTo);
    }
  });

  const openTasks = tasks
    .filter((t) => t.status !== "FILED_AND_COMPLETED")
    .sort((a, b) => {
      const pWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const diff = (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0);
      if (diff !== 0) return diff;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const auditLog: AutonomousDispatchResult["auditLog"] = [];
  let tasksReassigned = 0;
  const tasksEvaluated = openTasks.length;

  for (const task of openTasks) {
    const requiredTier = getRequiredTierForTask(task);
    const requiredSkill = mapCategoryToSpecialization(task.category);
    const requiredTool = getRequiredToolForTask(task);

    let bestStaff: StaffMember | null = null;
    let highestScore = -1;
    let matchReason = "";

    for (const staff of activeStaff) {
      const staffTools = staff.allowedTools || ["tasks", "gst"];
      if (staff.role !== "MANAGING_PARTNER" && !staffTools.includes(requiredTool)) continue;

      const capacity = staff.maxDailyTaskCapacity || 12;
      const currentLoad = assignedCounts.get(staff.id) || 0;
      if (currentLoad >= capacity) continue;

      let score = 0;
      const hasSkill = staff.specializations && staff.specializations.includes(requiredSkill);
      score += hasSkill ? 40 : 10;

      const tierDiff = staff.competencyTier - requiredTier;
      if (tierDiff === 0) score += 30;
      else if (tierDiff > 0) score += Math.max(10, 30 - tierDiff * 10);
      else score += Math.max(0, 30 - Math.abs(tierDiff) * 20);

      const headroomRatio = (capacity - currentLoad) / capacity;
      score += Math.round(headroomRatio * 20);

      const prevHandler = clientAffinityMap.get(task.entityId);
      if (prevHandler && prevHandler.includes(staff.fullName.split(" ")[0])) score += 10;

      if (score > highestScore) {
        highestScore = score;
        bestStaff = staff;
        const candidateRole =
          staff.role === "MANAGING_PARTNER"
            ? "Partner"
            : staff.role === "PAID_CHARTERED_ACCOUNTANT"
            ? "Qualified CA"
            : staff.competencyTier >= 3
            ? "Senior Associate"
            : "Associate";
        matchReason = `${candidateRole} (${hasSkill ? requiredSkill : "General"}), ${Math.round(headroomRatio * 100)}% capacity free`;
      }
    }

    if (bestStaff) {
      const roleLabel =
        bestStaff.role === "MANAGING_PARTNER"
          ? "Partner"
          : bestStaff.role === "PAID_CHARTERED_ACCOUNTANT"
          ? "Qualified CA"
          : bestStaff.competencyTier >= 3
          ? "Senior Associate"
          : "Associate";
      const newAssignedFormatted = `${bestStaff.fullName} (${roleLabel})`;
      const prevAssigned = task.assignedTo || "Unassigned";

      if (!prevAssigned || prevAssigned === "Unassigned" || !prevAssigned.includes(bestStaff.fullName.split(" ")[0])) {
        auditLog.push({
          taskId: task.id,
          taskTitle: task.title,
          entityName: task.entityName,
          previousAssigned: prevAssigned,
          newAssigned: newAssignedFormatted,
          reason: matchReason,
        });
        task.assignedTo = newAssignedFormatted;
        task.assignedStaffId = bestStaff.id;
        tasksReassigned++;
      }

      assignedCounts.set(bestStaff.id, (assignedCounts.get(bestStaff.id) || 0) + 1);
      if (task.priority === "CRITICAL") criticalCounts.set(bestStaff.id, (criticalCounts.get(bestStaff.id) || 0) + 1);
    }
  }

  const breakdownByStaff: AutonomousDispatchResult["breakdownByStaff"] = {};
  activeStaff.forEach((s) => {
    const total = assignedCounts.get(s.id) || 0;
    breakdownByStaff[s.fullName] = { total, critical: criticalCounts.get(s.id) || 0, tier: s.competencyTier };
    s.activeOpenTasksCount = total;
  });

  return { tasksEvaluated, tasksReassigned, breakdownByStaff, auditLog };
}

/**
 * PostgreSQL-backed Autonomous Work Allocation Engine
 */
export async function executeAutonomousWorkDispatcher(
  firmId: string,
  actorId?: string,
  actorName = "Managing Partner"
): Promise<AutonomousDispatchResult> {
  const pool = getPostgresPool();
  const [{ rows: userRows }, { rows: taskRows }, { rows: entRows }, metaRecs] = await Promise.all([
    pool.query(
      `SELECT id, firm_id, email, phone, full_name, role, is_active
       FROM public.users
       WHERE firm_id = $1 AND is_active = TRUE AND role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE')`,
      [firmId]
    ),
    pool.query("SELECT * FROM public.compliance_tasks WHERE firm_id = $1", [firmId]),
    pool.query("SELECT id, entity_name, group_id FROM public.client_entities WHERE firm_id = $1", [firmId]),
    listWorkspaceRecords<Partial<StaffMember>>(firmId, "STAFF_PROFILE"),
  ]);

  const metaById = new Map<string, Partial<StaffMember>>();
  for (const r of metaRecs) {
    if (r.payload?.id) metaById.set(r.payload.id, r.payload);
  }

  const staffList: StaffMember[] = userRows.map((u: any) => {
    const meta = metaById.get(u.id) || {};
    const role =
      u.role === "PARTNER" || u.role === "SUPER_ADMIN"
        ? "MANAGING_PARTNER"
        : u.role === "PAID_CA_MANAGER"
        ? "PAID_CHARTERED_ACCOUNTANT"
        : "ARTICLE_TRAINEE";
    return {
      id: u.id,
      firmId: u.firm_id,
      fullName: u.full_name,
      email: u.email,
      phone: u.phone || "",
      role,
      competencyTier: meta.competencyTier || (role === "MANAGING_PARTNER" ? 4 : 2),
      specializations: meta.specializations || ["GST", "INCOME_TAX", "TAX_AUDIT", "TDS", "MCA_ROC"],
      allowedTools: meta.allowedTools || ["tasks", "gst", "tax-audit", "notices-udin", "billing-wip", "client-master"],
      maxDailyTaskCapacity: meta.maxDailyTaskCapacity || 16,
      status: "ACTIVE",
      joinedDate: new Date().toISOString().split("T")[0],
      activeOpenTasksCount: 0,
      completedTasksThisMonth: 0,
      averageVelocityMinutes: 60,
    };
  });

  if (staffList.length === 0) {
    throw new Error("No active staff members available in firm registry to allocate work.");
  }

  const entMap = new Map(entRows.map((e: any) => [e.id, e]));
  const staffById = new Map(staffList.map((s) => [s.id, s]));

  const tasks: ComplianceTask[] = taskRows.map((t: any) => {
    const ent: any = entMap.get(t.entity_id);
    const assignedStaff = t.assigned_to_id ? staffById.get(t.assigned_to_id) : undefined;
    return {
      id: t.id,
      entityId: t.entity_id,
      entityName: ent?.entity_name || "Practice Client",
      groupId: ent?.group_id || "",
      category: t.category,
      title: t.title,
      period: t.period,
      dueDate: t.due_date ? new Date(t.due_date).toISOString().split("T")[0] : "2026-11-30",
      status: t.status,
      assignedTo: assignedStaff ? assignedStaff.fullName : "Unassigned",
      assignedStaffId: t.assigned_to_id || undefined,
      reviewedBy: actorName,
      priority: t.priority,
      penaltyRisk: Number(t.penalty_risk || 0),
      accruingDailyPenalty: Number(t.accruing_daily_penalty || 0),
      missingDocumentsCount: 0,
      chaseCount: t.chase_count || 0,
    };
  });

  const result = autoAssignTasksInMemory(tasks, staffList);

  for (const t of tasks) {
    if (t.assignedStaffId) {
      await pool.query(
        "UPDATE public.compliance_tasks SET assigned_to_id = $1, updated_at = now() WHERE id = $2 AND firm_id = $3",
        [t.assignedStaffId, t.id, firmId]
      );
    }
  }

  await appendPgAuditLog({
    firmId,
    actorId,
    actorName,
    actorRole: "PARTNER",
    entityName: "Firm Operations",
    action: "Autonomous Task Allocation Executed",
    details: `Evaluated ${result.tasksEvaluated} tasks, assigned ${result.tasksReassigned} tasks across ${staffList.length} staff members.`,
    category: "COMPLIANCE",
  });

  return {
    success: true,
    tasksEvaluated: result.tasksEvaluated,
    tasksReassigned: result.tasksReassigned,
    breakdownByStaff: result.breakdownByStaff,
    auditLog: result.auditLog,
    timestamp: new Date().toISOString(),
  };
}
