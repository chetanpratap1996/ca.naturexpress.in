/**
 * Shared client-side helpers for GST Suite APIs, period/FY calculations, and statutory validations.
 */

export function getGstAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    try {
      const stored =
        localStorage.getItem("bt_enterprise_session_v4") ||
        localStorage.getItem("bt_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) {
          headers["Authorization"] = `Bearer ${parsed.token}`;
        }
      }
    } catch {}
  }
  return headers;
}

export async function gstFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getGstAuthHeaders(),
      ...(options?.headers || {}),
    },
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Returns the 12 monthly period labels ("April 2025" .. "March 2026") for an Indian FY ("2025-26").
 */
export function getPeriodsForFy(fy: string): string[] {
  const startYear = parseInt((fy || "").split("-")[0], 10);
  if (isNaN(startYear)) return [];
  const periods: string[] = [];
  for (let i = 0; i < 12; i++) {
    const monthIndex = (3 + i) % 12;
    const year = monthIndex >= 3 ? startYear : startYear + 1;
    periods.push(`${MONTH_NAMES[monthIndex]} ${year}`);
  }
  return periods;
}

/**
 * Converts a period label like "September 2026" to GSTN MMYYYY format ("092026").
 */
export function toGstnReturnPeriod(periodLabel: string): string {
  const parts = (periodLabel || "").trim().split(/\s+/);
  if (parts.length !== 2) return "";
  const idx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === parts[0].toLowerCase());
  const yr = parts[1];
  if (idx === -1 || !/^\d{4}$/.test(yr)) return "";
  return `${String(idx + 1).padStart(2, "0")}${yr}`;
}

/**
 * Derives Indian Financial Year ("2025-26") from a period label ("September 2025") or ISO date ("2025-09-14").
 */
export function deriveIndianFy(dateOrPeriod: string): string {
  if (!dateOrPeriod) return "2025-26";
  const iso = dateOrPeriod.match(/^(\d{4})-(\d{2})/);
  if (iso) {
    const y = parseInt(iso[1], 10);
    const m = parseInt(iso[2], 10);
    const sy = m >= 4 ? y : y - 1;
    return `${sy}-${String((sy + 1) % 100).padStart(2, "0")}`;
  }
  const parts = dateOrPeriod.trim().split(/\s+/);
  if (parts.length === 2) {
    const mIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === parts[0].toLowerCase());
    const y = parseInt(parts[1], 10);
    if (mIdx !== -1 && !isNaN(y)) {
      const sy = mIdx >= 3 ? y : y - 1;
      return `${sy}-${String((sy + 1) % 100).padStart(2, "0")}`;
    }
  }
  return "2025-26";
}

/**
 * Computes Rule 37A statutory 30th November reversal deadline of the subsequent FY.
 * E.g. FY "2024-25" -> "2025-11-30".
 */
export function getRule37aDeadlineForFy(fy: string): string {
  const clean = fy.replace(/^FY\s+/i, "").trim();
  const startYear = parseInt(clean.split("-")[0], 10);
  if (isNaN(startYear)) return "2026-11-30";
  return `${startYear + 1}-11-30`;
}

/**
 * QRMP Group A (22nd of following month) state codes vs Group B (24th).
 * Group A: CG(22), MP(23), GJ(24), MH(27), KA(29), GA(30), KL(32), TN(33), TS(36), AP(37), PY(34), AN(35), LD(31), DNH&DD(26)
 */
const QRMP_GROUP_A_STATES = new Set([
  "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37",
]);

export function getQrmpGroupForState(stateCode: string): "22ND" | "24TH" {
  return QRMP_GROUP_A_STATES.has(stateCode) ? "22ND" : "24TH";
}

/**
 * Validates Indian GST ARN format (typically 15 alphanumeric chars e.g. AA271026009182Z or MA2309261234567).
 */
export function isValidGstArn(arn: string): boolean {
  const clean = (arn || "").trim().toUpperCase();
  return /^[A-Z]{2}[0-9A-Z]{13}$/.test(clean);
}

/**
 * Computes Section 49B / Rule 88A optimal ITC set-off against Outward Tax Liability.
 * Statutory order:
 * 1. IGST credit -> IGST -> CGST -> SGST
 * 2. CGST credit -> CGST -> IGST
 * 3. SGST credit -> SGST -> IGST
 * 4. Cess credit -> Cess only
 */
export function computeRule88aSetOff(params: {
  liability: { igst: number; cgst: number; sgst: number; cess: number };
  itc: { igst: number; cgst: number; sgst: number; cess: number };
  rcmTax?: { igst: number; cgst: number; sgst: number; cess: number };
}) {
  let remLiabI = Math.max(0, params.liability.igst);
  let remLiabC = Math.max(0, params.liability.cgst);
  let remLiabS = Math.max(0, params.liability.sgst);
  let remLiabCess = Math.max(0, params.liability.cess);

  let remItcI = Math.max(0, params.itc.igst);
  let remItcC = Math.max(0, params.itc.cgst);
  let remItcS = Math.max(0, params.itc.sgst);
  let remItcCess = Math.max(0, params.itc.cess);

  // 1. IGST ITC -> IGST Liability
  const iOnI = Math.min(remItcI, remLiabI);
  remItcI -= iOnI;
  remLiabI -= iOnI;

  // 2. Remaining IGST ITC -> CGST then SGST
  const iOnC = Math.min(remItcI, remLiabC);
  remItcI -= iOnC;
  remLiabC -= iOnC;

  const iOnS = Math.min(remItcI, remLiabS);
  remItcI -= iOnS;
  remLiabS -= iOnS;

  // 3. CGST ITC -> CGST Liability, then IGST Liability
  const cOnC = Math.min(remItcC, remLiabC);
  remItcC -= cOnC;
  remLiabC -= cOnC;

  const cOnI = Math.min(remItcC, remLiabI);
  remItcC -= cOnI;
  remLiabI -= cOnI;

  // 4. SGST ITC -> SGST Liability, then IGST Liability
  const sOnS = Math.min(remItcS, remLiabS);
  remItcS -= sOnS;
  remLiabS -= sOnS;

  const sOnI = Math.min(remItcS, remLiabI);
  remItcS -= sOnI;
  remLiabI -= sOnI;

  // 5. Cess ITC -> Cess Liability
  const cessOnCess = Math.min(remItcCess, remLiabCess);
  remItcCess -= cessOnCess;
  remLiabCess -= cessOnCess;

  const rcmI = Math.max(0, params.rcmTax?.igst || 0);
  const rcmC = Math.max(0, params.rcmTax?.cgst || 0);
  const rcmS = Math.max(0, params.rcmTax?.sgst || 0);
  const rcmCess = Math.max(0, params.rcmTax?.cess || 0);

  // RCM MUST be paid in Cash (Sec 49(4))
  const cashPayable = {
    igst: Math.round((remLiabI + rcmI) * 100) / 100,
    cgst: Math.round((remLiabC + rcmC) * 100) / 100,
    sgst: Math.round((remLiabS + rcmS) * 100) / 100,
    cess: Math.round((remLiabCess + rcmCess) * 100) / 100,
  };

  return {
    itcUsed: {
      igst: Math.round((iOnI + iOnC + iOnS) * 100) / 100,
      cgst: Math.round((cOnC + cOnI) * 100) / 100,
      sgst: Math.round((sOnS + sOnI) * 100) / 100,
      cess: Math.round(cessOnCess * 100) / 100,
    },
    closingItcBalance: {
      igst: Math.round(remItcI * 100) / 100,
      cgst: Math.round(remItcC * 100) / 100,
      sgst: Math.round(remItcS * 100) / 100,
      cess: Math.round(remItcCess * 100) / 100,
    },
    cashPayable,
    totalCashPayable:
      Math.round((cashPayable.igst + cashPayable.cgst + cashPayable.sgst + cashPayable.cess) * 100) / 100,
  };
}
