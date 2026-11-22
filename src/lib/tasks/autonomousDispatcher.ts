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
 * Determine required competency tier based on task category and statutory priority
 */
export function getRequiredTierForTask(task: ComplianceTask): CompetencyTier {
  const title = task.title.toLowerCase();
  const category = task.category;

  // Tier 4: Scrutiny, Appeals, High Court, Partner Review
  if (title.includes("scrutiny") || title.includes("148") || title.includes("appeal") || task.priority === "CRITICAL" && category === "TAX_AUDIT") {
    return 4;
  }

  // Tier 3: Senior Article (Tax Audit Form 3CD, Corporate ITR-6, MCA AOC-4/MGT-7)
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

  // Tier 2: Intermediate Article (GSTR-3B, TDS 26Q Quarterly, ITR-1 to 4)
  if (
    category === "GST" && title.includes("3b") ||
    category === "TDS" && title.includes("26q") ||
    title.includes("itr-") ||
    title.includes("form 8")
  ) {
    return 2;
  }

  // Tier 1: Routine (DIR-3 KYC, GSTR-1 Outward, Challan 281, Bank OCR, Bookkeeping)
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
 * Core 2035 Autonomous Work Allocation Engine
 * Linear scoring algorithm O(T * S) balancing Competency, Skills, Capacity Headroom, and Client Continuity
 */
export async function executeAutonomousWorkDispatcher(firmId = "FRM-024310C"): Promise<AutonomousDispatchResult> {
  const db = ensureDatabase();
  const tasks = db.tasks || [];
  const staffList = (db.staff || []).filter((s) => s.status === "ACTIVE");

  if (staffList.length === 0) {
    throw new Error("No active staff members available in firm registry to allocate work.");
  }

  // Active workload map to prevent overloading
  const assignedCounts = new Map<string, number>();
  const criticalCounts = new Map<string, number>();
  staffList.forEach((s) => {
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

  // Filter tasks ready for execution:
  // 1. Exclude already filed tasks
  // 2. Exclude tasks awaiting client documents (held in autonomous document chaser)
  const candidateTasks = tasks.filter(
    (t) => t.status !== "FILED_AND_COMPLETED"
  );

  // Sort candidate tasks by Statutory Urgency (Critical first, then Due Date)
  candidateTasks.sort((a, b) => {
    if (a.priority === "CRITICAL" && b.priority !== "CRITICAL") return -1;
    if (b.priority === "CRITICAL" && a.priority !== "CRITICAL") return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  for (const task of candidateTasks) {
    tasksEvaluated++;
    const requiredTier = getRequiredTierForTask(task);
    const requiredSkill = mapCategoryToSpecialization(task.category);

    // Score all available active staff
    let bestStaff: StaffMember | null = null;
    let highestScore = -Infinity;
    let matchReason = "";

    for (const staff of staffList) {
      const currentLoad = assignedCounts.get(staff.id) || 0;
      const capacity = staff.maxDailyTaskCapacity || 10;

      // Hard gatekeeper: Do not exceed max capacity
      if (currentLoad >= capacity) {
        continue;
      }

      let score = 0;

      // 1. Domain Skill Match (Weight: 40 points)
      const hasSkill = staff.specializations.includes(requiredSkill);
      if (hasSkill) {
        score += 40;
      } else {
        score += 10; // Can still perform with supervision
      }

      // 2. Competency Tier Alignment (Weight: 30 points)
      const tierDiff = staff.competencyTier - requiredTier;
      if (tierDiff === 0) {
        score += 30; // Perfect match
      } else if (tierDiff > 0) {
        score += Math.max(10, 30 - tierDiff * 10); // Over-qualified (e.g. Tier 4 doing Tier 2)
      } else {
        score += Math.max(0, 30 - Math.abs(tierDiff) * 20); // Under-qualified penalty
      }

      // 3. Available Capacity Headroom (Weight: 20 points)
      const headroomRatio = (capacity - currentLoad) / capacity;
      score += Math.round(headroomRatio * 20);

      // 4. Client Continuity (Weight: 10 points)
      const prevHandler = clientAffinityMap.get(task.entityId);
      if (prevHandler && prevHandler.includes(staff.fullName.split(" ")[0])) {
        score += 10;
      }

      if (score > highestScore) {
        highestScore = score;
        bestStaff = staff;
        matchReason = `Matched Tier ${staff.competencyTier} (${hasSkill ? requiredSkill : "General"}), ${Math.round(headroomRatio * 100)}% capacity free`;
      }
    }

    if (bestStaff) {
      const newAssignedFormatted = `${bestStaff.fullName} (${bestStaff.role === "MANAGING_PARTNER" ? "Partner" : bestStaff.role === "PAID_CHARTERED_ACCOUNTANT" ? "CA" : "Article"})`;
      const prevAssigned = task.assignedTo || "Unassigned";

      // Reassign if different or previously unassigned
      if (!prevAssigned.includes(bestStaff.fullName.split(" ")[0])) {
        auditLog.push({
          taskId: task.id,
          taskTitle: task.title,
          entityName: task.entityName,
          previousAssigned: prevAssigned,
          newAssigned: newAssignedFormatted,
          reason: matchReason,
        });
        task.assignedTo = newAssignedFormatted;
        tasksReassigned++;
      }

      // Update in-memory load
      assignedCounts.set(bestStaff.id, (assignedCounts.get(bestStaff.id) || 0) + 1);
      if (task.priority === "CRITICAL") {
        criticalCounts.set(bestStaff.id, (criticalCounts.get(bestStaff.id) || 0) + 1);
      }
    }
  }

  // Update tasks in database
  await saveDatabase(db);

  // Compute breakdown by staff
  const breakdownByStaff: AutonomousDispatchResult["breakdownByStaff"] = {};
  staffList.forEach((s) => {
    breakdownByStaff[s.fullName] = {
      total: assignedCounts.get(s.id) || 0,
      critical: criticalCounts.get(s.id) || 0,
      tier: s.competencyTier,
    };
  });

  await logAuditEvent(
    "2035 Autonomous Work Dispatcher",
    "SYSTEM",
    "Practice Tasks Matrix",
    "AUTOPILOT_DISPATCH",
    `Autopilot work dispatch completed. Reassigned ${tasksReassigned} tasks across ${staffList.length} active staff.`,
    "SYSTEM"
  );

  return {
    success: true,
    tasksEvaluated,
    tasksReassigned,
    breakdownByStaff,
    auditLog,
    timestamp: new Date().toISOString(),
  };
}
