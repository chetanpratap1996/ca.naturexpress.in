import { ClientEntity, ComplianceTask, GstinRecordItem } from "@/lib/types";
import { deriveIndianFy, getPeriodsForFy } from "@/lib/gst/gstClientFetch";

function computeStatutoryDueDate(periodLabel: string, dayOfMonth: number): string {
  const parsed = parsePeriodLabel(periodLabel);
  if (!parsed) return new Date().toISOString().split("T")[0];
  const next = new Date(parsed.year, parsed.monthIndex0 + 1, dayOfMonth);
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${mm}-${dd}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// QRMP Group A (22nd of following month) state codes
const QRMP_GROUP_A_STATES = new Set([
  "22", "23", "24", "26", "27", "29", "30", "31", "32", "33", "34", "35", "36", "37",
]);

export type CanonicalReturnKind = "GSTR1" | "GSTR3B" | "CMP08" | "PMT06" | "GSTR9" | "GSTR10" | "OTHER";

export function isQuarterEndMonth(periodLabel: string): boolean {
  const parsed = parsePeriodLabel(periodLabel);
  if (!parsed) return false;
  return [2, 5, 8, 11].includes(parsed.monthIndex0);
}

/**
 * Returns cancelled GSTIN records for GSTR-10 Final Return generation (Sec 45 CGST Act).
 */
export function resolveCancelledGstinsForClient(client: ClientEntity): GstinRecordItem[] {
  if (!Array.isArray(client.gstinRecords)) return [];
  return client.gstinRecords.filter(
    (g) => g.status === "CANCELLED" && g.gstin && g.gstin.trim().length === 15
  );
}

/**
 * GSTR-10 Final Return is due within 3 months of cancellation date or order date (Sec 45).
 */
export function getGstr10DueDate(cancellationDate?: string | null, referenceDate: Date = new Date()): string {
  const base = cancellationDate ? new Date(cancellationDate) : referenceDate;
  const d = isNaN(base.getTime()) ? referenceDate : base;
  const due = new Date(d.getFullYear(), d.getMonth() + 3, d.getDate());
  return due.toISOString().split("T")[0];
}

/**
 * Resolves the active statutory return period dynamically from referenceDate.
 * Before the 21st of a month, the active GST return period is the prior month;
 * from the 21st onward, obligations roll forward to the current month's cycle.
 */
export function resolveActiveGstCycle(referenceDate: Date = new Date()): {
  periodLabel: string;
  periodKey: string;
  year: number;
  monthIndex0: number;
  fy: string;
} {
  const day = referenceDate.getDate();
  const baseMonth = referenceDate.getMonth();
  const baseYear = referenceDate.getFullYear();
  const periodDate = day <= 20 ? new Date(baseYear, baseMonth - 1, 1) : new Date(baseYear, baseMonth, 1);
  const y = periodDate.getFullYear();
  const m0 = periodDate.getMonth();
  const periodLabel = `${MONTH_NAMES[m0]} ${y}`;
  const periodKey = `${y}${String(m0 + 1).padStart(2, "0")}`;
  const fyStart = m0 >= 3 ? y : y - 1;
  const fy = `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`;
  return { periodLabel, periodKey, year: y, monthIndex0: m0, fy };
}

/**
 * Parses a period label like "November 2026" into { year, monthIndex0 } or null.
 */
export function parsePeriodLabel(periodLabel: string): { year: number; monthIndex0: number } | null {
  const parts = (periodLabel || "").trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const m0 = MONTH_NAMES.findIndex((m) => m.toLowerCase() === parts[0].toLowerCase());
  const y = parseInt(parts[1], 10);
  if (m0 === -1 || isNaN(y)) return null;
  return { year: y, monthIndex0: m0 };
}

/**
 * Chronological sort key (YYYYMM) for a period label like "November 2026".
 */
export function periodSortKey(periodLabel: string): number {
  const parsed = parsePeriodLabel(periodLabel);
  if (!parsed) return 0;
  return parsed.year * 100 + (parsed.monthIndex0 + 1);
}

/**
 * Resolves all active GSTIN records for an entity, falling back to primary client.gstin
 * when gstinRecords is not populated.
 */
export function resolveActiveGstinsForClient(client: ClientEntity): GstinRecordItem[] {
  if (Array.isArray(client.gstinRecords) && client.gstinRecords.length > 0) {
    return client.gstinRecords.filter((g) => g.status === "ACTIVE" && g.gstin && g.gstin.trim().length === 15);
  }
  const gstin = (client.gstin || "").trim().toUpperCase();
  if (gstin.length !== 15 || client.gstFilingFrequency === "UNREGISTERED") {
    return [];
  }
  const stateCode = gstin.substring(0, 2);
  return [
    {
      gstin,
      stateCode,
      stateName: (client as any).stateName || "",
      tradeName: client.tradeName || client.name,
      registrationType: client.gstFilingFrequency === "COMPOSITION" ? "COMPOSITION" : "REGULAR",
      filingFrequency: client.gstFilingFrequency === "QRMP" ? "QRMP" : "MONTHLY",
      qrmpStateGroup: QRMP_GROUP_A_STATES.has(stateCode) ? "22ND" : "24TH",
      status: "ACTIVE",
      registrationDate: (client as any).gstRegistrationDate,
      cancellationDate: (client as any).gstCancellationDate || undefined,
    },
  ];
}

/**
 * Normalizes any task title into a canonical GST return kind.
 */
export function canonicalizeReturnKind(title: string): CanonicalReturnKind {
  const t = (title || "").toUpperCase();
  if (t.includes("GSTR-10") || t.includes("GSTR10") || t.includes("FINAL RETURN")) return "GSTR10";
  if (t.includes("PMT-06") || t.includes("PMT06")) return "PMT06";
  if (t.includes("CMP-08") || t.includes("CMP08")) return "CMP08";
  if (t.includes("GSTR-9") || t.includes("GSTR9")) return "GSTR9";
  if (t.includes("GSTR-3B") || t.includes("GSTR3B")) return "GSTR3B";
  if (t.includes("GSTR-1") || t.includes("GSTR1") || /\bIFF\b/.test(t)) return "GSTR1";
  return "OTHER";
}

/**
 * Extracts an embedded 15-character GSTIN from a task title if present.
 */
export function extractGstinFromTitle(title: string): string | null {
  const match = (title || "").toUpperCase().match(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/);
  return match ? match[1] : null;
}

/**
 * Checks whether a task belongs to a specific GSTIN without cross-contaminating multi-GSTIN entities.
 */
export function taskMatchesGstin(
  task: { gstin?: string | null; title?: string | null },
  targetGstin: string,
  primaryClientGstin?: string | null
): boolean {
  const tgt = (targetGstin || "").trim().toUpperCase();
  if (!tgt) return false;
  const taskGstin = (task.gstin || "").trim().toUpperCase();
  if (taskGstin) {
    // If task.gstin was populated from fallback ent.gstin, still check title for an explicit different GSTIN
    const titleGstin = extractGstinFromTitle(task.title || "");
    if (titleGstin && titleGstin !== taskGstin) {
      return titleGstin === tgt;
    }
    return taskGstin === tgt;
  }
  const titleGstin = extractGstinFromTitle(task.title || "");
  if (titleGstin) {
    return titleGstin === tgt;
  }
  const primary = (primaryClientGstin || "").trim().toUpperCase();
  return Boolean(primary && primary === tgt);
}

/**
 * Computes exact statutory due date (YYYY-MM-DD) for a return kind and period.
 */
export function getStatutoryGstDueDate(
  periodLabel: string,
  kind: "GSTR1" | "GSTR3B" | "CMP08" | "PMT06",
  gstinRecord?: Pick<GstinRecordItem, "filingFrequency" | "qrmpStateGroup" | "stateCode">
): string {
  const isQrmp = gstinRecord?.filingFrequency === "QRMP";
  if (kind === "PMT06") return computeStatutoryDueDate(periodLabel, 25);
  if (kind === "CMP08") return computeStatutoryDueDate(periodLabel, 18);
  if (kind === "GSTR1") return computeStatutoryDueDate(periodLabel, isQrmp ? 13 : 11);
  if (isQrmp) {
    const group = gstinRecord?.qrmpStateGroup || (QRMP_GROUP_A_STATES.has(gstinRecord?.stateCode || "") ? "22ND" : "24TH");
    return computeStatutoryDueDate(periodLabel, group === "24TH" ? 24 : 22);
  }
  return computeStatutoryDueDate(periodLabel, 20);
}

/**
 * Computes Sec 47 late fee estimate as of referenceDate.
 */
export function computeSec47LateFee(
  dueDateIso: string,
  referenceDate: Date = new Date(),
  isNil: boolean = false
): { daysLate: number; lateFee: number; dailyRate: number } {
  if (!dueDateIso) return { daysLate: 0, lateFee: 0, dailyRate: 0 };
  const due = new Date(`${dueDateIso}T23:59:59`);
  const diffMs = referenceDate.getTime() - due.getTime();
  if (isNaN(diffMs) || diffMs <= 0) {
    return { daysLate: 0, lateFee: 0, dailyRate: 0 };
  }
  const daysLate = Math.floor(diffMs / 86400000);
  if (daysLate <= 0) return { daysLate: 0, lateFee: 0, dailyRate: 0 };
  const dailyRate = isNil ? 20 : 50;
  const maxCap = isNil ? 500 : 10000;
  return {
    daysLate,
    lateFee: Math.min(daysLate * dailyRate, maxCap),
    dailyRate,
  };
}

/**
 * Computes task priority from due date relative to referenceDate.
 */
export function computeGstTaskPriority(
  dueDateIso: string,
  referenceDate: Date = new Date()
): "CRITICAL" | "HIGH" | "MEDIUM" {
  const due = new Date(`${dueDateIso}T23:59:59`);
  const diffDays = Math.ceil((due.getTime() - referenceDate.getTime()) / 86400000);
  if (diffDays <= 7) return "CRITICAL";
  if (diffDays <= 20) return "HIGH";
  return "MEDIUM";
}

/**
 * Returns the canonical task title for a GSTIN + return kind.
 */
export function buildGstTaskTitle(
  kind: "GSTR1" | "GSTR3B" | "CMP08" | "PMT06" | "GSTR10",
  gstinRecord: Pick<GstinRecordItem, "gstin" | "filingFrequency">,
  isBacklog: boolean = false
): string {
  const isQrmp = gstinRecord.filingFrequency === "QRMP";
  const prefix = isBacklog ? "Overdue Catch-Up: " : "";
  if (kind === "GSTR10") return `${prefix}GSTR-10 Final Return (${gstinRecord.gstin})`;
  if (kind === "PMT06") return `${prefix}QRMP PMT-06 Challan / IFF (${gstinRecord.gstin})`;
  if (kind === "CMP08") return `${prefix}CMP-08 Quarterly Statement (${gstinRecord.gstin})`;
  if (kind === "GSTR1") {
    return isQrmp
      ? `${prefix}IFF / GSTR-1 (QRMP - ${gstinRecord.gstin})`
      : `${prefix}GSTR-1 Monthly Outward (${gstinRecord.gstin})`;
  }
  return isQrmp
    ? `${prefix}GSTR-3B Quarterly (${gstinRecord.gstin})`
    : `${prefix}GSTR-3B Monthly Return (${gstinRecord.gstin})`;
}

/**
 * Returns the statutory return kinds expected for a GSTIN in a specific period,
 * handling Monthly, Composition (quarterly CMP-08), and QRMP (M1/M2 PMT-06, M3 GSTR-1+3B).
 */
export function getExpectedReturnKindsForPeriod(
  gstinRecord: Pick<GstinRecordItem, "registrationType" | "filingFrequency">,
  periodLabel: string
): Array<"GSTR1" | "GSTR3B" | "CMP08" | "PMT06"> {
  if (gstinRecord.registrationType === "COMPOSITION") {
    return isQuarterEndMonth(periodLabel) ? ["CMP08"] : [];
  }
  if (gstinRecord.filingFrequency === "QRMP") {
    return isQuarterEndMonth(periodLabel) ? ["GSTR1", "GSTR3B"] : ["PMT06"];
  }
  return ["GSTR1", "GSTR3B"];
}

/**
 * Returns all expected return periods in an FY from max(FY start, registrationDate)
 * up to the current active GST cycle (inclusive), respecting Monthly vs QRMP/Composition.
 */
export function getExpectedReturnPeriodsForFy(
  fy: string,
  referenceDate: Date = new Date(),
  registrationDate?: string,
  isQuarterly: boolean = false
): string[] {
  const allFyPeriods = getPeriodsForFy(fy);
  const activeCycle = resolveActiveGstCycle(referenceDate);
  const activeKey = periodSortKey(activeCycle.periodLabel);

  let regKey = 0;
  if (registrationDate) {
    const m = registrationDate.match(/^(\d{4})-(\d{2})/);
    if (m) {
      regKey = parseInt(m[1], 10) * 100 + parseInt(m[2], 10);
    }
  }

  return allFyPeriods.filter((p) => {
    const pk = periodSortKey(p);
    if (pk === 0 || pk > activeKey) return false;
    if (regKey > 0 && pk < regKey) return false;
    if (isQuarterly) {
      // Quarter-end months: June (6), September (9), December (12), March (3)
      const parsed = parsePeriodLabel(p);
      if (!parsed) return false;
      return [2, 5, 8, 11].includes(parsed.monthIndex0);
    }
    return true;
  });
}

/**
 * Computes sequential GST filing blockers (Sec 37(4) & Sec 39(10) CGST Act)
 * for all pending GST tasks, keyed by task.id.
 */
export function computeSequentialBlockers(
  tasks: ComplianceTask[],
  clients: ClientEntity[]
): Map<string, string> {
  const blockers = new Map<string, string>();
  const clientById = new Map(clients.map((c) => [c.id, c]));

  // Group GST tasks by entityId::resolvedGstin
  const groups = new Map<string, ComplianceTask[]>();
  for (const t of tasks) {
    if (t.category !== "GST") continue;
    const client = clientById.get(t.entityId);
    const resolvedGstin =
      (t.gstin && t.gstin.trim().toUpperCase()) ||
      extractGstinFromTitle(t.title) ||
      (client?.gstin && client.gstin.trim().toUpperCase()) ||
      "PRIMARY";
    const key = `${t.entityId}::${resolvedGstin}`;
    const arr = groups.get(key) || [];
    arr.push(t);
    groups.set(key, arr);
  }

  for (const groupTasks of groups.values()) {
    const gstr1Tasks = groupTasks
      .filter((t) => canonicalizeReturnKind(t.title) === "GSTR1")
      .sort((a, b) => periodSortKey(a.period) - periodSortKey(b.period));

    const gstr3bTasks = groupTasks
      .filter((t) => canonicalizeReturnKind(t.title) === "GSTR3B")
      .sort((a, b) => periodSortKey(a.period) - periodSortKey(b.period));

    // Sec 37(4): Cannot file GSTR-1 if prior month GSTR-1 is unfiled
    let firstUnfiledGstr1Period: string | null = null;
    for (const t of gstr1Tasks) {
      if (t.status === "FILED_AND_COMPLETED") continue;
      if (firstUnfiledGstr1Period && periodSortKey(t.period) > periodSortKey(firstUnfiledGstr1Period)) {
        blockers.set(t.id, `Blocked: File ${firstUnfiledGstr1Period} GSTR-1 first (Sec 37(4))`);
      } else if (!firstUnfiledGstr1Period) {
        firstUnfiledGstr1Period = t.period;
      }
    }

    // Sec 39(10): Cannot file GSTR-3B if prior month GSTR-3B OR same-month GSTR-1 is unfiled
    let firstUnfiled3bPeriod: string | null = null;
    for (const t of gstr3bTasks) {
      if (t.status === "FILED_AND_COMPLETED") continue;
      if (firstUnfiled3bPeriod && periodSortKey(t.period) > periodSortKey(firstUnfiled3bPeriod)) {
        blockers.set(t.id, `Blocked: File ${firstUnfiled3bPeriod} GSTR-3B first (Sec 39(10))`);
      } else {
        const samePeriod1 = gstr1Tasks.find(
          (g1) => periodSortKey(g1.period) === periodSortKey(t.period) && g1.status !== "FILED_AND_COMPLETED"
        );
        if (samePeriod1) {
          blockers.set(t.id, `Waiting on ${t.period} GSTR-1`);
        }
        if (!firstUnfiled3bPeriod) {
          firstUnfiled3bPeriod = t.period;
        }
      }
    }
  }

  return blockers;
}

/**
 * Derives current Indian FY string ("2026-27") from referenceDate.
 */
export function getCurrentIndianFy(referenceDate: Date = new Date()): string {
  return deriveIndianFy(referenceDate.toISOString().split("T")[0]);
}
