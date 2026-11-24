import { ComplianceTask, StaffMember, CompetencyTier, StaffSpecialization } from "@/lib/types";
import { ensureDatabase, saveDatabase, logAuditEvent } from "@/lib/server/db";

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

/**
 * Map task statutory nature to corresponding CA Practice Tool
 */
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

/**
 * Determine required competency seniority level based on task category and statutory priority
 */
export function getRequiredTierForTask(task: ComplianceTask): CompetencyTier {
  const title = (task.title || "").toLowerCase();
  const category = task.category || "";

  // Level 4: Scrutiny, Appeals, High Court, Partner Review
  if (title.includes("scrutiny") || title.includes("148") || title.includes("appeal") || (task.priority === "CRITICAL" && category === "TAX_AUDIT")) {
    return 4;
  }

  // Level 3: Senior Associate (Tax Audit Form 3CD, Corporate ITR-6, MCA AOC-4/MGT-7)
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

  // Level 2: Senior Associate (GSTR-3B, TDS 26Q Quarterly, ITR-1 to 4)
  if (
    (category === "GST" && title.includes("3b")) ||
    (category === "TDS" && title.includes("26q")) ||
    title.includes("itr-") ||
    title.includes("form 8")
  ) {
    return 2;
  }

  // Level 1: Associate Routine (DIR-3 KYC, GSTR-1 Outward, Challan 281, Bank OCR, Bookkeeping)
  return 1;
}

/**
 * Map compliance category to staff specialization tag
 */
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

/**
 * In-Memory Auto-Assigner for Tasks
 * Reusable directly inside Autopilot sweeps and background crons without extra DB writes
 */
export function autoAssignTasksInMemory(
  tasks: ComplianceTask[],
  staffList: StaffMember[]
): {
  tasksEvaluated: number;
  tasksReassigned: number;
  breakdownByStaff: Record<string, { total: number; critical: number; tier: number }>;
  auditLog: AutonomousDispatchResult["auditLog"];
} {
  const activeStaff = staffList.filter((s) => s.status === "ACTIVE");
  if (activeStaff.length === 0) {
    return { tasksEvaluated: 0, tasksReassigned: 0, breakdownByStaff: {}, auditLog: [] };
  }

  // Active workload map to prevent overloading
  const assignedCounts = new Map<string, number>();
  const criticalCounts = new Map<string, number>();
  activeStaff.forEach((s) => {
    assignedCounts.set(s.id, 0);
    criticalCounts.set(s.id, 0);
  });

  // Client continuity map: Client Entity ID -> Previous Staff Name
  const clientAffinityMap = new Map<string, string>();
  tasks.forEach((t) => {
    if (t.status === "FILED_AND_COMPLETED" && t.assignedTo) {
      clientAffinityMap.set(t.entityId, t.assignedTo);
    }
  });

  const auditLog: AutonomousDispatchResult["auditLog"] = [];
  let tasksReassigned = 0;
  let tasksEvaluated = 0;

  // Filter tasks ready for execution (exclude already filed tasks)
  const candidateTasks = tasks.filter((t) => t.status !== "FILED_AND_COMPLETED");

  // Sort candidate tasks by Statutory Urgency (Critical first, then Due Date)
  candidateTasks.sort((a, b) => {
    if (a.priority === "CRITICAL" && b.priority !== "CRITICAL") return -1;
    if (b.priority === "CRITICAL" && a.priority !== "CRITICAL") return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  for (const task of candidateTasks) {
    tasksEvaluated++;
    const requiredTier = getRequiredTierForTask(task);
    const requiredTool = getRequiredToolForTask(task);
    const requiredSkill = mapCategoryToSpecialization(task.category);

    let bestStaff: StaffMember | null = null;
    let highestScore = -Infinity;
    let matchReason = "";

    for (const staff of activeStaff) {
      const currentLoad = assignedCounts.get(staff.id) || 0;
      const capacity = staff.maxDailyTaskCapacity || 10;

      // 1. Hard Gatekeeper: Do not exceed max capacity
      if (currentLoad >= capacity) {
        continue;
      }

      // 2. Practice Tool Gatekeeper: Must have CA permission for this practice tool
      if (
        requiredTool &&
        requiredTool !== "tasks" &&
        Array.isArray(staff.allowedTools) &&
        staff.allowedTools.length > 0 &&
        !staff.allowedTools.includes(requiredTool)
      ) {
        continue;
      }

      let score = 0;

      // Domain Skill Match (Weight: 40 points)
      const hasSkill = staff.specializations && staff.specializations.includes(requiredSkill);
      if (hasSkill) {
        score += 40;
      } else {
        score += 10; // Can still perform with supervision
      }

      // Seniority Level Alignment (Weight: 30 points)
      const tierDiff = staff.competencyTier - requiredTier;
      if (tierDiff === 0) {
        score += 30; // Perfect match
      } else if (tierDiff > 0) {
        score += Math.max(10, 30 - tierDiff * 10); // Over-qualified
      } else {
        score += Math.max(0, 30 - Math.abs(tierDiff) * 20); // Under-qualified penalty
      }

      // Available Capacity Headroom (Weight: 20 points)
      const headroomRatio = (capacity - currentLoad) / capacity;
      score += Math.round(headroomRatio * 20);

      // Client Continuity (Weight: 10 points)
      const prevHandler = clientAffinityMap.get(task.entityId);
      if (prevHandler && prevHandler.includes(staff.fullName.split(" ")[0])) {
        score += 10;
      }

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

      // If unassigned or needs re-allocation
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
      if (task.priority === "CRITICAL") {
        criticalCounts.set(bestStaff.id, (criticalCounts.get(bestStaff.id) || 0) + 1);
      }
    }
  }

  // Compute breakdown by staff and update staff active task counts
  const breakdownByStaff: AutonomousDispatchResult["breakdownByStaff"] = {};
  activeStaff.forEach((s) => {
    const total = assignedCounts.get(s.id) || 0;
    breakdownByStaff[s.fullName] = {
      total,
      critical: criticalCounts.get(s.id) || 0,
      tier: s.competencyTier,
    };
    s.activeOpenTasksCount = total;
  });

  return { tasksEvaluated, tasksReassigned, breakdownByStaff, auditLog };
}

/**
 * Autonomous Work Allocation Engine
 * Linear scoring algorithm O(T * S) balancing Competency, Skills, Capacity Headroom, and Client Continuity
 */
export async function executeAutonomousWorkDispatcher(firmId = "FRM-024310C"): Promise<AutonomousDispatchResult> {
  const db = ensureDatabase();
  const tasks = db.tasks || [];
  const staffList = (db.staff || []).filter((s) => s.status === "ACTIVE");

  if (staffList.length === 0) {
    throw new Error("No active staff members available in firm registry to allocate work.");
  }

  const result = autoAssignTasksInMemory(tasks, staffList);

  // Update tasks and staff in database
  await saveDatabase(db);

  await logAuditEvent(
    "Managing Partner",
    "PARTNER",
    "Firm Operations",
    "Autonomous Task Allocation Executed",
    `Evaluated ${result.tasksEvaluated} tasks, auto-assigned ${result.tasksReassigned} tasks across ${staffList.length} staff members.`,
    "COMPLIANCE"
  );

  return {
    success: true,
    tasksEvaluated: result.tasksEvaluated,
    tasksReassigned: result.tasksReassigned,
    breakdownByStaff: result.breakdownByStaff,
    auditLog: result.auditLog,
    timestamp: new Date().toISOString(),
  };
}
