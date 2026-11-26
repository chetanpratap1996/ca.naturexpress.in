import {
  ClientEntity,
  DscRecord,
  EntityType,
  GstComplianceHistoryItem,
  GstFilingFrequency,
  GstinRecordItem,
  OnboardingMode,
  PortalCredential,
  PortalType,
  ServiceScopeKey,
} from "@/lib/types";
import { GST_STATE_CODES, inferConstitutionFromPan } from "@/lib/config/entityDna";
import { validateGstinDetailed } from "@/lib/gst/gstinChecksum";
import { isValidPan } from "@/lib/utils";

export interface ClientArchetypeBlueprint {
  type: EntityType;
  label: string;
  shortLabel: string;
  typicalAssetsOnDay1: string[];
  usuallyMissingOnDay1: string[];
  requiredPortals: PortalType[];
  optionalPortals: PortalType[];
  requiresDsc: boolean;
  requiresTanByDefault: boolean;
  requiresCinOrLlpin: boolean;
  documentChecklist: Array<{
    id: string;
    label: string;
    category: "KYC" | "PAST_FILINGS" | "BOOKS_BANK" | "NOTICES";
    takeoverOnly?: boolean;
    gstOnly?: boolean;
  }>;
  activeSuites: string[];
}

export const CLIENT_ARCHETYPE_BLUEPRINTS: Record<EntityType, ClientArchetypeBlueprint> = {
  PVT_LTD: {
    type: "PVT_LTD",
    label: "Private Limited Company",
    shortLabel: "Pvt Ltd",
    typicalAssetsOnDay1: [
      "CIN, Company PAN & TAN",
      "MOA / AOA & Incorporation Certificate",
      "1+ GSTINs & E-Invoice credentials (if >= ₹5 Cr)",
      "Director DINs & Class-3 USB DSCs",
      "TallyPrime / Zoho Books data",
    ],
    usuallyMissingOnDay1: [
      "MCA V3 Business User Login / Linked Director ID",
      "Past ITR-6 / Form 3CD JSON & Depreciation Block WDV",
      "Unresolved ASMT-10 / DRC-01 / 143(1) Notice PDFs",
    ],
    requiredPortals: ["GST", "INCOME_TAX", "MCA_V3", "TRACES"],
    optionalPortals: ["EPFO", "ESIC", "ICEGATE"],
    requiresDsc: true,
    requiresTanByDefault: true,
    requiresCinOrLlpin: true,
    documentChecklist: [
      { id: "kyc_coi", label: "COI, MOA/AOA, PAN & TAN Allotment Letter", category: "KYC" },
      { id: "kyc_dir", label: "Directors PAN, Aadhaar, DIN & DIR-3 KYC Status", category: "KYC" },
      { id: "dsc_usb", label: "Active Class-3 USB DSC Tokens & Passwords", category: "KYC" },
      { id: "past_itr_3cd", label: "Last 2 Years Audited Balance Sheet, ITR-6 & Form 3CD", category: "PAST_FILINGS", takeoverOnly: true },
      { id: "past_roc", label: "Last Filed AOC-4, MGT-7 & DPT-3 SRN/Challans", category: "PAST_FILINGS", takeoverOnly: true },
      { id: "past_gst", label: "Filed GSTR-1 / 3B / 9 & E-Credit Ledger Balance", category: "PAST_FILINGS", gstOnly: true },
      { id: "books_tally", label: "TallyPrime Company Backup / Trial Balance XML", category: "BOOKS_BANK" },
      { id: "books_bank", label: "All Current Account Statements (Apr-Till Date) + PDF Passwords", category: "BOOKS_BANK" },
      { id: "notices_hist", label: "Pending ITD 2.0 e-Proceedings & GST ASMT-10/DRC-01 Notices", category: "NOTICES", takeoverOnly: true },
    ],
    activeSuites: ["GST Suite", "ITR-6 & 3CD", "Schedule III & CARO", "MCA V3", "TDS/TRACES", "Notice Defense", "DSC Vault"],
  },

  PUBLIC_LTD: {
    type: "PUBLIC_LTD",
    label: "Public Limited Company",
    shortLabel: "Public Ltd",
    typicalAssetsOnDay1: ["CIN, PAN, TAN", "Multi-state GSTINs", "Secretarial & Statutory Audit Records", "Class-3 DSCs"],
    usuallyMissingOnDay1: ["XBRL Taxonomy Tagging History", "Related Party 40A(2)(b) / AOC-2 Registers", "Open Litigation Appeals"],
    requiredPortals: ["GST", "INCOME_TAX", "MCA_V3", "TRACES"],
    optionalPortals: ["EPFO", "ESIC", "ICEGATE"],
    requiresDsc: true,
    requiresTanByDefault: true,
    requiresCinOrLlpin: true,
    documentChecklist: [
      { id: "kyc_coi", label: "COI, MOA/AOA, Secretarial MR-3 & Board Registers", category: "KYC" },
      { id: "past_itr_3cd", label: "Last 3 Years Audited XBRL Financials, ITR-6 & 3CD", category: "PAST_FILINGS", takeoverOnly: true },
      { id: "past_gst", label: "Multi-State GSTIN Credentials & GSTR-9/9C Filings", category: "PAST_FILINGS", gstOnly: true },
      { id: "books_tally", label: "ERP / Tally Trial Balance & Fixed Asset Register", category: "BOOKS_BANK" },
      { id: "notices_hist", label: "ITBA / CIT(A) / GST Adjudication Dockets", category: "NOTICES", takeoverOnly: true },
    ],
    activeSuites: ["GST Multi-GSTIN", "ITR-6 & 3CD", "Schedule III XBRL", "MCA V3", "TDS/TRACES", "Notice Defense"],
  },

  LLP: {
    type: "LLP",
    label: "Limited Liability Partnership (LLP)",
    shortLabel: "LLP",
    typicalAssetsOnDay1: ["LLPIN & Firm PAN", "LLP Agreement & Supplementals", "Designated Partner DPINs & DSCs", "GSTIN (if registered)"],
    usuallyMissingOnDay1: ["MCA V3 LLP Login", "Form 8 & Form 11 Filing History", "Partner Capital & Profit Ratio Schedule"],
    requiredPortals: ["INCOME_TAX", "MCA_V3", "GST"],
    optionalPortals: ["TRACES"],
    requiresDsc: true,
    requiresTanByDefault: false,
    requiresCinOrLlpin: true,
    documentChecklist: [
      { id: "kyc_llp", label: "LLP Certificate, Stamped LLP Agreement & Amendments", category: "KYC" },
      { id: "dsc_dp", label: "Designated Partners DPINs & Class-3 DSC Tokens", category: "KYC" },
      { id: "past_llp", label: "Last Filed Form 11, Form 8 & ITR-5 Acknowledgement", category: "PAST_FILINGS", takeoverOnly: true },
      { id: "past_gst", label: "GST Portal Login & Past GSTR-1/3B Summary", category: "PAST_FILINGS", gstOnly: true },
      { id: "books_bank", label: "Current Account Statements + Tally / Capital Ledger", category: "BOOKS_BANK" },
      { id: "notices_hist", label: "Pending ITD / GST / MCA Notices", category: "NOTICES", takeoverOnly: true },
    ],
    activeSuites: ["GST Suite", "ITR-5", "MCA LLP (Form 8/11)", "Notice Defense", "DSC Vault"],
  },

  PARTNERSHIP: {
    type: "PARTNERSHIP",
    label: "Partnership Firm",
    shortLabel: "Partnership",
    typicalAssetsOnDay1: ["Firm PAN (4th char 'F')", "Notarized Partnership Deed", "Partner PANs & Bank Statements", "GSTIN (often QRMP/Monthly)"],
    usuallyMissingOnDay1: ["Partner Interest (12%) & 40(b) Remuneration Working", "Closing Capital Balances from Previous CA", "ITD / GST Passwords"],
    requiredPortals: ["INCOME_TAX", "GST"],
    optionalPortals: ["TRACES"],
    requiresDsc: false,
    requiresTanByDefault: false,
    requiresCinOrLlpin: false,
    documentChecklist: [
      { id: "kyc_deed", label: "Notarized Partnership Deed & RoF Registration (if any)", category: "KYC" },
      { id: "past_itr5", label: "Last Year ITR-5, Partner Capital A/c & Balance Sheet", category: "PAST_FILINGS", takeoverOnly: true },
      { id: "past_gst", label: "GST Portal Login & Purchase/Sales Register", category: "PAST_FILINGS", gstOnly: true },
      { id: "books_bank", label: "Firm Bank Statements + PDF Passwords & Tally Backup", category: "BOOKS_BANK" },
      { id: "notices_hist", label: "Any Pending ITD 143(1)/148 or GST ASMT-10 Notices", category: "NOTICES", takeoverOnly: true },
    ],
    activeSuites: ["GST Suite", "ITR-5 & Sec 40(b)", "Tax Audit 3CD (if applicable)", "Notice Defense"],
  },

  PROPRIETORSHIP: {
    type: "PROPRIETORSHIP",
    label: "Sole Proprietorship Enterprise",
    shortLabel: "Proprietorship",
    typicalAssetsOnDay1: ["Proprietor PAN & Aadhaar", "GSTIN (Regular / QRMP / Composition)", "Udyam Certificate", "Current/Savings Bank Statements"],
    usuallyMissingOnDay1: ["Forgotten ITD / GST Portal Password", "Personal vs Business Bank Segregation", "Opening Capital / Balance Sheet"],
    requiredPortals: ["INCOME_TAX", "GST"],
    optionalPortals: ["TRACES"],
    requiresDsc: false,
    requiresTanByDefault: false,
    requiresCinOrLlpin: false,
    documentChecklist: [
      { id: "kyc_prop", label: "Proprietor PAN, Aadhaar & Udyam Registration", category: "KYC" },
      { id: "past_itr3", label: "Last Year ITR-3 / ITR-4 & AIS/26AS JSON", category: "PAST_FILINGS", takeoverOnly: true },
      { id: "past_gst", label: "GST Login + Sales/Purchase Bills or Tally/Busy Excel", category: "PAST_FILINGS", gstOnly: true },
      { id: "books_bank", label: "12-Month Bank Statement PDFs + Passwords", category: "BOOKS_BANK" },
      { id: "notices_hist", label: "Any GST Portal Notices (ASMT-10/REG-17) or ITD Demands", category: "NOTICES", takeoverOnly: true },
    ],
    activeSuites: ["GST Suite (1/3B/CMP-08)", "ITR-3 / 44AD", "AIS/26AS", "Bank Statement OCR", "Notice Defense"],
  },

  INDIVIDUAL_HNI: {
    type: "INDIVIDUAL_HNI",
    label: "Individual / Salaried / HNI",
    shortLabel: "Individual / HNI",
    typicalAssetsOnDay1: ["PAN & Aadhaar (OTP Linked)", "Form 16 / Salary Slips", "Zerodha / Groww / CAMS Mutual Fund P&L", "Savings & Demat Bank Statements"],
    usuallyMissingOnDay1: ["ITD e-Filing Password", "AIS / TIS JSON Export", "Foreign ESOP / Schedule FA Details (if applicable)"],
    requiredPortals: ["INCOME_TAX"],
    optionalPortals: [],
    requiresDsc: false,
    requiresTanByDefault: false,
    requiresCinOrLlpin: false,
    documentChecklist: [
      { id: "kyc_ind", label: "PAN, Aadhaar & ITD Portal Password (or Aadhaar OTP)", category: "KYC" },
      { id: "past_itr_ais", label: "Last Year ITR Ack, Form 16 & AIS/TIS JSON", category: "PAST_FILINGS" },
      { id: "cap_gains", label: "Broker Tax P&L (Zerodha/Groww) & CAMS/KFintech Statement", category: "BOOKS_BANK" },
      { id: "books_bank", label: "All Savings/FD Bank Statements + Interest Certificates", category: "BOOKS_BANK" },
      { id: "notices_hist", label: "Outstanding 143(1) Demand / 148A Notices (if any)", category: "NOTICES", takeoverOnly: true },
    ],
    activeSuites: ["ITR-1/2/3 & 115BAC", "AIS / 26AS Inspector", "Capital Gains 111A/112A", "Schedule FA", "Notice Defense"],
  },

  TRUST_NGO: {
    type: "TRUST_NGO",
    label: "Charitable Trust / Section 8 NGO",
    shortLabel: "Trust / NGO",
    typicalAssetsOnDay1: ["Trust PAN (4th char 'T')", "12AB & 80G Form 10AC/10AD Orders", "Trust Deed / Sec 8 COI", "Donor Register for Form 10BD"],
    usuallyMissingOnDay1: ["Clean Donor PAN/Address CSV for 10BD", "Project Utilization Working (85% Application)", "FCRA FC-4 History (if foreign grants)"],
    requiredPortals: ["INCOME_TAX"],
    optionalPortals: ["GST", "TRACES", "MCA_V3"],
    requiresDsc: true,
    requiresTanByDefault: false,
    requiresCinOrLlpin: false,
    documentChecklist: [
      { id: "kyc_trust", label: "Trust Deed, 12AB & 80G Final Orders (Form 10AC/10AD)", category: "KYC" },
      { id: "past_10b", label: "Last Year Form 10B/10BB, ITR-7 & Form 10BD Filing", category: "PAST_FILINGS", takeoverOnly: true },
      { id: "donor_csv", label: "Donor Register with PAN, Address & Donation Mode", category: "BOOKS_BANK" },
      { id: "books_bank", label: "Trust Bank Statements & Grant Utilization Vouchers", category: "BOOKS_BANK" },
      { id: "notices_hist", label: "Exemptions Wing / CPC 143(1) Notices (if any)", category: "NOTICES", takeoverOnly: true },
    ],
    activeSuites: ["ITR-7 & 10B/10BB", "Form 10BD Donations", "TDS/TRACES", "Notice Defense"],
  },
};

export interface ClientReadinessReport {
  score: number;
  maxScore: number;
  pct: number;
  missingItems: string[];
  hasGst: boolean;
  gstHistorySynced: boolean;
  unfiledGstCount: number;
  requiredPortalsCount: number;
  savedPortalsCount: number;
  missingPortals: PortalType[];
  dscCount: number;
  noticesCount: number;
}

export const SERVICE_SCOPE_OPTIONS: Array<{ key: ServiceScopeKey; label: string; shortLabel: string }> = [
  { key: "GST", label: "GST Returns & 2B/IMS", shortLabel: "GST" },
  { key: "INCOME_TAX", label: "Income Tax & Advance Tax", shortLabel: "ITR" },
  { key: "TAX_AUDIT", label: "Tax Audit (Form 3CD)", shortLabel: "3CD Audit" },
  { key: "TDS", label: "TDS / TRACES (24Q/26Q)", shortLabel: "TDS" },
  { key: "ROC_MCA", label: "MCA V3 / ROC Secretarial", shortLabel: "MCA / ROC" },
  { key: "VCFO", label: "Virtual CFO & Advisory", shortLabel: "vCFO" },
];

export function deriveDefaultServiceScope(params: {
  type: EntityType;
  hasGst?: boolean;
  turnoverCr?: number;
  hasTan?: boolean;
  digitalTxnPct?: number;
}): ServiceScopeKey[] {
  const { type, hasGst = false, turnoverCr = 0, hasTan = false, digitalTxnPct = 95 } = params;
  const scope: ServiceScopeKey[] = ["INCOME_TAX"];
  if (hasGst) scope.push("GST");
  const auditThreshold = digitalTxnPct >= 95 ? 10 : 1;
  if (turnoverCr > 0 && turnoverCr >= auditThreshold) scope.push("TAX_AUDIT");
  if (hasTan || type === "PVT_LTD" || type === "PUBLIC_LTD") scope.push("TDS");
  if (type === "PVT_LTD" || type === "PUBLIC_LTD" || type === "LLP") scope.push("ROC_MCA");
  return scope;
}

export function buildGstinRecordFromLookup(params: {
  gstin: string;
  legalName?: string;
  tradeName?: string;
  status?: string;
  taxpayerType?: string;
  registrationDate?: string;
  cancellationDate?: string | null;
  address?: string;
  filingFrequency?: GstFilingFrequency;
  turnoverCr?: number;
  authorizedSignatory?: string;
  otpMobile?: string;
}): GstinRecordItem | null {
  const check = validateGstinDetailed(params.gstin);
  if (!check.isValid) return null;
  const sc = check.stateCode || check.cleanGstin.substring(0, 2);
  const stateNum = parseInt(sc, 10);
  const qrmpGroup24 = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 38]);
  const qrmpStateGroup: "22ND" | "24TH" = qrmpGroup24.has(stateNum) ? "24TH" : "22ND";

  const rawType = String(params.taxpayerType || "").toUpperCase();
  const registrationType: GstinRecordItem["registrationType"] = rawType.includes("COMP")
    ? "COMPOSITION"
    : rawType.includes("ISD")
      ? "ISD"
      : rawType.includes("SEZ")
        ? "SEZ"
        : rawType.includes("CASUAL")
          ? "CASUAL"
          : "REGULAR";

  const rawStatus = String(params.status || "ACTIVE").toUpperCase();
  const status: GstinRecordItem["status"] = rawStatus.includes("CANCEL")
    ? "CANCELLED"
    : rawStatus.includes("SUSPEND")
      ? "SUSPENDED"
      : "ACTIVE";

  const filingFrequency: GstinRecordItem["filingFrequency"] = params.filingFrequency === "QRMP" ? "QRMP" : "MONTHLY";

  return {
    gstin: check.cleanGstin,
    stateCode: sc,
    stateName: check.stateName || GST_STATE_CODES[sc] || "India",
    tradeName: params.tradeName?.trim() || params.legalName?.trim() || "",
    legalName: params.legalName?.trim() || undefined,
    registrationType,
    filingFrequency,
    qrmpStateGroup,
    status,
    registrationDate: params.registrationDate || undefined,
    cancellationDate: params.cancellationDate || undefined,
    principalAddress: params.address || undefined,
    eWayBillEnabled: true,
    eInvoiceApplicable: (params.turnoverCr || 0) >= 5,
    isdEnabled: registrationType === "ISD",
    authorizedSignatory: params.authorizedSignatory || undefined,
    otpMobile: params.otpMobile || undefined,
    lastGstnVerifiedAt: new Date().toISOString(),
  };
}

/**
 * Evaluates Day-1 readiness for a registered client across Client Master, Keys Vault,
 * GST Return History, DSC Custody, and Notice Center.
 */
export function evaluateClientOnboardingReadiness(params: {
  client: ClientEntity;
  credentials?: PortalCredential[];
  dscTokens?: DscRecord[];
  noticesCount?: number;
}): ClientReadinessReport {
  const { client, credentials = [], dscTokens = [], noticesCount = 0 } = params;
  const blueprint = CLIENT_ARCHETYPE_BLUEPRINTS[client.type] || CLIENT_ARCHETYPE_BLUEPRINTS.PVT_LTD;
  const scopeSet = Array.isArray(client.serviceScope) && client.serviceScope.length > 0 ? new Set(client.serviceScope) : null;
  const hasGst =
    Boolean(client.gstin && client.gstin.trim().length === 15) &&
    client.gstFilingFrequency !== "UNREGISTERED" &&
    (!scopeSet || scopeSet.has("GST"));

  const requiredPortals = blueprint.requiredPortals.filter((p) => {
    if (p === "GST") return hasGst;
    if (p === "INCOME_TAX" && scopeSet) return scopeSet.has("INCOME_TAX") || scopeSet.has("TAX_AUDIT");
    if (p === "MCA_V3" && scopeSet) return scopeSet.has("ROC_MCA");
    if (p === "TRACES" && scopeSet) return scopeSet.has("TDS") || Boolean(client.tan);
    return true;
  });
  const clientCreds = credentials.filter(
    (c) =>
      c.entityId === client.id ||
      c.entityName.toLowerCase() === client.name.toLowerCase() ||
      (client.pan && c.secondaryIdentifier?.toUpperCase() === client.pan.toUpperCase())
  );
  const coveredPortals = new Set(clientCreds.map((c) => c.portalType));
  const missingPortals = requiredPortals.filter((p) => !coveredPortals.has(p));

  const clientDscs = dscTokens.filter(
    (d) =>
      d.entityId === client.id ||
      d.entityName.toLowerCase() === client.name.toLowerCase() ||
      (client.pan && d.pan?.toUpperCase() === client.pan.toUpperCase())
  );

  const gstHistory = client.gstHistory || [];
  const gstHistorySynced = hasGst && gstHistory.length > 0;
  const unfiledGstCount = gstHistory.filter((h) => h.delayDays > 0 || !h.arn).length;

  let score = 0;
  let maxScore = 0;
  const missingItems: string[] = [];

  // 1. Core Identity & Contact (PAN + Phone) -> 25 pts
  maxScore += 25;
  const hasPhone = Boolean(client.primaryContact?.phone && client.primaryContact.phone.replace(/\D/g, "").length >= 10);
  if (isValidPan(client.pan) && hasPhone) {
    score += 25;
  } else {
    if (!isValidPan(client.pan)) missingItems.push("Valid 10-char PAN");
    if (!hasPhone) missingItems.push("Valid 10-digit WhatsApp Mobile");
  }

  // 2. Statutory Registration Identifiers (CIN/LLPIN or TAN if applicable) -> 15 pts
  if (blueprint.requiresCinOrLlpin || blueprint.requiresTanByDefault) {
    maxScore += 15;
    const hasCin = !blueprint.requiresCinOrLlpin || Boolean(client.cin);
    const hasTan = !blueprint.requiresTanByDefault || Boolean(client.tan);
    if (hasCin && hasTan) score += 15;
    else if (hasCin || hasTan) score += 8;
    if (!hasCin) missingItems.push(client.type === "LLP" ? "LLPIN" : "CIN");
    if (!hasTan) missingItems.push("TAN");
  }

  // 3. Portal Credentials Coverage -> 30 pts
  if (requiredPortals.length > 0) {
    maxScore += 30;
    const ratio = (requiredPortals.length - missingPortals.length) / requiredPortals.length;
    score += Math.round(30 * ratio);
    if (missingPortals.length > 0) {
      missingItems.push(`Portal Logins (${missingPortals.join(", ")})`);
    }
  }

  // 4. GST History Sync (if GST registered) -> 15 pts
  if (hasGst) {
    maxScore += 15;
    if (gstHistorySynced) {
      score += 15;
    } else {
      missingItems.push("Past GST Filing History Sync");
    }
  }

  // 5. DSC Custody (if required) -> 15 pts
  if (blueprint.requiresDsc) {
    maxScore += 15;
    if (clientDscs.length > 0) {
      score += 15;
    } else {
      missingItems.push("Class-3 DSC Token Record");
    }
  }

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;

  return {
    score,
    maxScore,
    pct,
    missingItems,
    hasGst,
    gstHistorySynced,
    unfiledGstCount,
    requiredPortalsCount: requiredPortals.length,
    savedPortalsCount: requiredPortals.length - missingPortals.length,
    missingPortals,
    dscCount: clientDscs.length,
    noticesCount,
  };
}

/**
 * Normalizes raw GST returns response into typed GstComplianceHistoryItem[]
 */
export function normalizeGstApiReturns(
  returnsList: Array<{
    returnType?: string;
    rtntype?: string;
    returnPeriod?: string;
    ret_prd?: string;
    filingStatus?: string;
    status?: string;
    filingDate?: string;
    dof?: string;
    arn?: string;
  }>
): GstComplianceHistoryItem[] {
  return (returnsList || []).map((r) => {
    const rawType = String(r.returnType || r.rtntype || "GSTR-3B").toUpperCase();
    const returnType: "GSTR_1" | "GSTR_3B" = rawType.includes("1") ? "GSTR_1" : "GSTR_3B";
    const statusStr = String(r.filingStatus || r.status || "").trim().toUpperCase();
    const isFiled =
      statusStr === "FILED" ||
      (statusStr.includes("FILED") &&
        !statusStr.includes("NOT") &&
        !statusStr.includes("UNFILED") &&
        !statusStr.includes("PENDING"));
    return {
      period: String(r.returnPeriod || r.ret_prd || ""),
      returnType,
      arn: isFiled ? String(r.arn || "FILED") : "",
      filingDate: String(r.filingDate || r.dof || ""),
      taxLiabilityCash: 0,
      itcClaimed: 0,
      delayDays: isFiled ? 0 : 1,
      lateFeePaid: 0,
    };
  });
}

/**
 * RFC-4180 compliant single CSV line splitter that preserves empty cells (e.g. `,,`)
 * and handles quoted strings containing commas or escaped quotes (`""`).
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export interface ParsedCsvClientPreviewRow {
  rowNumber: number;
  name: string;
  type: EntityType;
  pan: string;
  gstin?: string;
  tan?: string;
  cin?: string;
  gstFilingFrequency?: GstFilingFrequency;
  onboardingMode?: OnboardingMode;
  serviceScope?: ServiceScopeKey[];
  groupName?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  turnoverCr: number;
  assignedArticle: string;
  isValid: boolean;
  isDuplicatePan: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_ENTITY_TYPES = new Set<EntityType>([
  "PVT_LTD",
  "PUBLIC_LTD",
  "LLP",
  "PARTNERSHIP",
  "PROPRIETORSHIP",
  "INDIVIDUAL_HNI",
  "TRUST_NGO",
]);

/**
 * Parses and validates a 100+ client CSV payload before hitting /api/clients,
 * automatically inferring legal type from PAN 4th character when omitted and checking GSTIN Mod-36 checksums.
 */
export function parseAndValidateBulkClientCsv(
  csvText: string,
  existingClients: ClientEntity[] = [],
  defaultArticle: string = "Practice Team"
): ParsedCsvClientPreviewRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const headerCols = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ""));
  const colIdx = (aliases: string[], fallback: number) => {
    const found = headerCols.findIndex((h) => aliases.includes(h));
    return found !== -1 ? found : fallback;
  };

  const idxName = colIdx(["entity_name", "name", "company_name", "client_name"], 0);
  const idxType = colIdx(["legal_type", "type", "entity_type", "constitution"], 1);
  const idxPan = colIdx(["pan", "pan_no", "pan_number"], 2);
  const idxGstin = colIdx(["gstin", "gst", "gst_no"], 3);
  const idxContact = colIdx(["contact_name", "signatory", "director", "promoter"], 4);
  const idxPhone = colIdx(["contact_phone", "phone", "mobile", "whatsapp"], 5);
  const idxEmail = colIdx(["contact_email", "email"], 6);
  const idxTurnover = colIdx(["turnover_cr", "turnover"], 7);
  const idxArticle = colIdx(["assigned_article", "article", "staff"], 8);
  const idxTan = colIdx(["tan", "tan_no"], 9);
  const idxCin = colIdx(["cin", "llpin", "cin_llpin"], 10);
  const idxFreq = colIdx(["gst_frequency", "gst_scheme", "filing_frequency"], 11);
  const idxMode = colIdx(["onboarding_mode", "acquisition_type", "onboarding_track"], 12);
  const idxServices = colIdx(["services", "service_scope", "retained_services"], 13);
  const idxGroup = colIdx(["group_name", "promoter_group", "group"], 14);

  const existingPans = new Set(existingClients.map((c) => c.pan.toUpperCase()));
  const seenPansInCsv = new Set<string>();
  const rows: ParsedCsvClientPreviewRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.every((c) => !c)) continue;

    const name = (cols[idxName] || "").trim();
    const rawGstin = (cols[idxGstin] || "").toUpperCase().trim();
    let pan = (cols[idxPan] || "").toUpperCase().trim();
    if (!pan && rawGstin.length >= 12) {
      pan = rawGstin.substring(2, 12);
    }

    const panInfo = inferConstitutionFromPan(pan);
    const rawType = (cols[idxType] || "").toUpperCase().trim() as EntityType;
    const type: EntityType = VALID_ENTITY_TYPES.has(rawType) ? rawType : panInfo.isValid ? panInfo.entityType : "PVT_LTD";

    const contactName = (cols[idxContact] || "").trim() || "Authorized Signatory";
    const contactPhone = (cols[idxPhone] || "").trim();
    const contactEmail = (cols[idxEmail] || "").trim();
    const parsedTurnover = parseFloat(cols[idxTurnover] || "");
    const turnoverCr = Number.isFinite(parsedTurnover) && parsedTurnover >= 0 ? parsedTurnover : 0;
    const assignedArticle = (cols[idxArticle] || "").trim() || defaultArticle;
    const tan = (cols[idxTan] || "").toUpperCase().trim() || undefined;
    const cin = (cols[idxCin] || "").toUpperCase().trim() || undefined;

    const rawFreq = (cols[idxFreq] || "").toUpperCase().trim();
    const gstFilingFrequency: GstFilingFrequency | undefined =
      rawFreq === "QRMP" || rawFreq === "COMPOSITION" || rawFreq === "MONTHLY" || rawFreq === "UNREGISTERED"
        ? (rawFreq as GstFilingFrequency)
        : rawGstin
        ? "MONTHLY"
        : "UNREGISTERED";

    const rawMode = (cols[idxMode] || "").toUpperCase().trim();
    const onboardingMode: OnboardingMode =
      rawMode === "CA_TAKEOVER" || rawMode === "TAKEOVER"
        ? "CA_TAKEOVER"
        : rawMode === "NEW_BUSINESS" || rawMode === "NEW_INCORP" || rawMode === "FRESH"
          ? "NEW_BUSINESS"
          : "EXISTING_CLIENT";

    const rawServices = (cols[idxServices] || "").toUpperCase().trim();
    const validScopes = new Set<ServiceScopeKey>(["GST", "INCOME_TAX", "TAX_AUDIT", "TDS", "ROC_MCA", "VCFO"]);
    const parsedScopes = rawServices
      ? rawServices
          .split(/[|,;/]+/)
          .map((s) => s.trim() as ServiceScopeKey)
          .filter((s) => validScopes.has(s))
      : [];
    const serviceScope =
      parsedScopes.length > 0
        ? parsedScopes
        : deriveDefaultServiceScope({
            type,
            hasGst: Boolean(rawGstin) && gstFilingFrequency !== "UNREGISTERED",
            turnoverCr,
            hasTan: Boolean(tan),
          });
    const groupName = (cols[idxGroup] || "").trim() || undefined;

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name) errors.push("Missing Entity Name");
    if (!pan) errors.push("Missing PAN");
    else if (!isValidPan(pan)) errors.push(`Invalid PAN (${pan})`);

    if (rawGstin) {
      const gCheck = validateGstinDetailed(rawGstin);
      if (!gCheck.isValid) {
        errors.push(`Invalid GSTIN: ${gCheck.error || rawGstin}`);
      } else if (pan && gCheck.pan && gCheck.pan !== pan) {
        errors.push(`GSTIN PAN (${gCheck.pan}) differs from PAN (${pan})`);
      }
    }

    const phoneDigits = contactPhone.replace(/\D/g, "");
    if (!phoneDigits || phoneDigits.length < 10) {
      warnings.push("No 10-digit WhatsApp mobile (PIN fallback needed)");
    }

    const isDuplicatePan = Boolean(pan && (existingPans.has(pan) || seenPansInCsv.has(pan)));
    if (existingPans.has(pan)) {
      warnings.push("PAN already in directory (will update)");
    } else if (seenPansInCsv.has(pan)) {
      warnings.push("Duplicate PAN inside CSV");
    }
    if (pan) seenPansInCsv.add(pan);

    rows.push({
      rowNumber: i + 1,
      name,
      type,
      pan,
      gstin: rawGstin || undefined,
      tan,
      cin,
      gstFilingFrequency,
      onboardingMode,
      serviceScope,
      groupName,
      contactName,
      contactPhone,
      contactEmail,
      turnoverCr,
      assignedArticle,
      isValid: errors.length === 0,
      isDuplicatePan,
      errors,
      warnings,
    });
  }

  return rows;
}
