import { NextRequest, NextResponse } from "next/server";
import { lookupGstReturns } from "@/lib/gst/gstinApiClient";
import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";

export type FilingStatus = "FILED_ON_TIME" | "FILED_LATE" | "NOT_FILED" | "FUTURE" | "NOT_APPLICABLE";

export interface GstReturnMonth {
  period: string;        // "MMM YYYY" e.g. "Oct 2024"
  periodKey: string;     // "MMYYYY" e.g. "102024"
  gstr1Status: FilingStatus;
  gstr3bStatus: FilingStatus;
  gstr1FilingDate?: string;
  gstr3bFilingDate?: string;
  gstr1Arn?: string;
  gstr3bArn?: string;
  delayDaysGstr1: number;
  delayDaysGstr3b: number;
  lateFeeRisk: "NIL" | "LOW" | "HIGH";
}

export interface GstTimelineResponse {
  success: boolean;
  gstin: string;
  timeline: GstReturnMonth[];
  // Aggregate analytics
  totalMonths: number;
  filedOnTime: number;
  filedLate: number;
  notFiled: number;
  futureMonths: number;
  complianceScore: number;      // 0–100
  healthBand: "EXCELLENT" | "GOOD" | "MODERATE" | "POOR" | "CRITICAL";
  consecutiveDefaultMonths: number;
  lastFiledPeriod: string | null;
  estimatedLateFeeExposure: string;
  // Forward plan
  nextDueDates: Array<{ returnType: string; period: string; dueDate: string; daysLeft: number; isOverdue: boolean }>;
  error?: string;
}

// GST due dates by return type (monthly)
const GST_DUE_DAY: Record<string, number> = {
  GSTR1: 11,
  GSTR3B: 20,
};

function getMonthLabel(month: number, year: number): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[month - 1]} ${year}`;
}

function getPeriodKey(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}${year}`;
}

function parsePeriodToMonthYear(period: string): { month: number; year: number } | null {
  // period can be "MMYYYY" or "MMYYYY" format from API
  if (!period || period.length < 6) return null;
  const m = parseInt(period.substring(0, 2), 10);
  const y = parseInt(period.substring(2, 6), 10);
  if (isNaN(m) || isNaN(y) || m < 1 || m > 12) return null;
  return { month: m, year: y };
}

function computeDelayDays(returnType: "GSTR1" | "GSTR3B", filingDateStr: string, month: number, year: number): number {
  if (!filingDateStr) return 0;
  const dueDay = GST_DUE_DAY[returnType];
  // Due date is next month's due day (filing for period M is due on M+1/dueDay)
  const dueMonth = month === 12 ? 1 : month + 1;
  const dueYear = month === 12 ? year + 1 : year;
  const dueDate = new Date(dueYear, dueMonth - 1, dueDay);
  let filedDate: Date;
  try {
    // API returns dates like "2024-10-11" or "11/10/2024"
    if (filingDateStr.includes("-")) {
      filedDate = new Date(filingDateStr);
    } else {
      const parts = filingDateStr.split("/");
      filedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  } catch {
    return 0;
  }
  if (isNaN(filedDate.getTime())) return 0;
  const diffMs = filedDate.getTime() - dueDate.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function computeLateFeeRisk(delayG1: number, delayG3b: number): "NIL" | "LOW" | "HIGH" {
  const maxDelay = Math.max(delayG1, delayG3b);
  if (maxDelay === 0) return "NIL";
  if (maxDelay <= 30) return "LOW";
  return "HIGH";
}

function computeHealthBand(score: number): "EXCELLENT" | "GOOD" | "MODERATE" | "POOR" | "CRITICAL" {
  if (score >= 90) return "EXCELLENT";
  if (score >= 75) return "GOOD";
  if (score >= 55) return "MODERATE";
  if (score >= 35) return "POOR";
  return "CRITICAL";
}

function computeNextDueDates(now: Date): Array<{ returnType: string; period: string; dueDate: string; daysLeft: number; isOverdue: boolean }> {
  const result = [];
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Calculate for current and next 2 months
  for (let offset = -1; offset <= 2; offset++) {
    let m = currentMonth + offset;
    let y = currentYear;
    if (m <= 0) { m += 12; y -= 1; }
    if (m > 12) { m -= 12; y += 1; }
    
    const periodLabel = getMonthLabel(m, y);
    
    for (const [returnType, dueDay] of Object.entries(GST_DUE_DAY)) {
      // Filing period M is due on M+1/dueDay
      let dueM = m + 1;
      let dueY = y;
      if (dueM > 12) { dueM -= 12; dueY += 1; }
      
      const dueDate = new Date(dueY, dueM - 1, dueDay);
      const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysLeft < 0;
      
      // Only include recent past (last 30d) and future 60d
      if (daysLeft >= -30 && daysLeft <= 60) {
        result.push({
          returnType,
          period: periodLabel,
          dueDate: dueDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          daysLeft,
          isOverdue,
        });
      }
    }
  }
  
  return result.sort((a, b) => a.daysLeft - b.daysLeft);
}

export async function POST(request: NextRequest) {
  let body: { gstin: string; months?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  const { gstin, months = 24 } = body;
  if (!gstin) {
    return NextResponse.json({ success: false, error: "gstin is required." }, { status: 400 });
  }

  const cleanGstin = gstin.trim().toUpperCase();
  const validation = validateGstinDetailed(cleanGstin);
  if (!validation.isValid) {
    return NextResponse.json({ success: false, error: `Invalid GSTIN: ${validation.error}` }, { status: 400 });
  }

  // Determine FY range covering requested months
  const now = new Date();
  const currentFY = now.getMonth() >= 3
    ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}`
    : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`;
  
  const prevFY = (() => {
    const y = parseInt(currentFY.split("-")[0]);
    return `${y - 1}-${String(y).slice(-2)}`;
  })();

  // Fetch returns for current + previous FY
  const [currentYearData, prevYearData] = await Promise.all([
    lookupGstReturns(cleanGstin, currentFY),
    lookupGstReturns(cleanGstin, prevFY),
  ]);

  if (currentYearData?.success === false && prevYearData?.success === false) {
    return NextResponse.json(
      {
        success: false,
        returnsUnavailable: true,
        error: currentYearData?.error || "GST return filing history is unavailable on the current API plan.",
      },
      { status: 200 }
    );
  }

  // Normalize all returns into a flat map keyed by periodKey+returnType
  const filedMap = new Map<string, { filingDate: string; arn: string; status: string }>();
  
  const processReturns = (data: any) => {
    const returns = data?.returns || data?.data?.returns || [];
    for (const r of returns) {
      const rawPeriod = String(r.returnPeriod || r.ret_prd || r.return_period || "").trim();
      if (!rawPeriod) continue;
      // Normalize period to MMYYYY
      let normalizedPeriod = rawPeriod.replace(/[^0-9]/g, "");
      if (normalizedPeriod.length !== 6) {
        normalizedPeriod = rawPeriod;
      }
      const rawType = String(r.returnType || r.rtntype || r.return_type || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!rawType) continue;
      const key = `${rawType}__${normalizedPeriod}`;
      filedMap.set(key, {
        filingDate: String(r.filingDate || r.dof || r.filing_date || ""),
        arn: String(r.arn || ""),
        status: String(r.filingStatus || r.status || r.filing_status || "").toUpperCase(),
      });
    }
  };
  processReturns(currentYearData);
  processReturns(prevYearData);

  // Build timeline for last N months (excluding future months)
  const timeline: GstReturnMonth[] = [];
  let filedOnTime = 0;
  let filedLate = 0;
  let notFiled = 0;
  let futureCount = 0;
  let consecutiveDefault = 0;
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  let lastFiledPeriod: string | null = null;

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const periodKey = getPeriodKey(month, year);
    const period = getMonthLabel(month, year);

    // Due dates for this period's filings
    const dueMonth = month === 12 ? 1 : month + 1;
    const dueYear = month === 12 ? year + 1 : year;
    const gstr3bDue = new Date(dueYear, dueMonth - 1, GST_DUE_DAY.GSTR3B);
    const isFuture = now < gstr3bDue;

    const g1Key = `GSTR1__${periodKey}`;
    const g3bKey = `GSTR3B__${periodKey}`;
    const g1Data = filedMap.get(g1Key);
    const g3bData = filedMap.get(g3bKey);

    let gstr1Status: FilingStatus;
    let gstr3bStatus: FilingStatus;
    let delayG1 = 0;
    let delayG3b = 0;

    if (isFuture) {
      gstr1Status = "FUTURE";
      gstr3bStatus = "FUTURE";
      futureCount++;
    } else {
      // GSTR-1
      if (g1Data && g1Data.arn && g1Data.status !== "NOT_FILED") {
        delayG1 = computeDelayDays("GSTR1", g1Data.filingDate, month, year);
        gstr1Status = delayG1 === 0 ? "FILED_ON_TIME" : "FILED_LATE";
      } else {
        gstr1Status = "NOT_FILED";
      }

      // GSTR-3B
      if (g3bData && g3bData.arn && g3bData.status !== "NOT_FILED") {
        delayG3b = computeDelayDays("GSTR3B", g3bData.filingDate, month, year);
        gstr3bStatus = delayG3b === 0 ? "FILED_ON_TIME" : "FILED_LATE";
        lastFiledPeriod = period;
      } else {
        gstr3bStatus = "NOT_FILED";
      }

      // Tallies (use 3B as primary health signal)
      if (gstr3bStatus === "FILED_ON_TIME") { filedOnTime++; currentConsecutive = 0; }
      else if (gstr3bStatus === "FILED_LATE") { filedLate++; currentConsecutive = 0; }
      else { notFiled++; currentConsecutive++; maxConsecutive = Math.max(maxConsecutive, currentConsecutive); }
    }

    timeline.push({
      period,
      periodKey,
      gstr1Status,
      gstr3bStatus,
      gstr1FilingDate: g1Data?.filingDate,
      gstr3bFilingDate: g3bData?.filingDate,
      gstr1Arn: g1Data?.arn,
      gstr3bArn: g3bData?.arn,
      delayDaysGstr1: delayG1,
      delayDaysGstr3b: delayG3b,
      lateFeeRisk: computeLateFeeRisk(delayG1, delayG3b),
    });
  }

  // Compliance score: weighted by on-time (100%), late (50%), not-filed (0%)
  const assessed = filedOnTime + filedLate + notFiled;
  const complianceScore = assessed > 0
    ? Math.round(((filedOnTime * 100 + filedLate * 50) / (assessed * 100)) * 100)
    : 0;

  // Late fee estimate (₹50/day for GSTR-3B; ₹200/day cap normally)
  const lateFeeEstimate = filedLate * 500 + notFiled * 10000; // rough INR estimate
  const estimatedLateFeeExposure = notFiled > 0 || filedLate > 0
    ? `~₹${lateFeeEstimate.toLocaleString("en-IN")} (rough estimate)`
    : "NIL";

  const response: GstTimelineResponse = {
    success: true,
    gstin: cleanGstin,
    timeline,
    totalMonths: months,
    filedOnTime,
    filedLate,
    notFiled,
    futureMonths: futureCount,
    complianceScore,
    healthBand: computeHealthBand(complianceScore),
    consecutiveDefaultMonths: maxConsecutive,
    lastFiledPeriod,
    estimatedLateFeeExposure,
    nextDueDates: computeNextDueDates(now),
  };

  return NextResponse.json(response, { status: 200 });
}
