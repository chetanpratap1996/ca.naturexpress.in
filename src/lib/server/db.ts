import fs from "fs";
import path from "path";
import { cookies, headers } from "next/headers";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { 
  ClientGroup, 
  ClientEntity, 
  ComplianceTask, 
  NoticeRecord, 
  InvoiceItem, 
  DscRecord, 
  DocumentItem, 
  AuditTrailLog,
  ClientPasswordVault,
  ParsedBankStatement,
  PayToReleaseConfig,
  GovtPortalSyncProfile,
  Msme43BhClauseItem,
  Section40A2bSampleItem,
  StaffDataSecurityAudit,
  PartnerRealizationMetrics,
  PilotScorecard
} from "@/lib/types";
import { 
  INITIAL_GROUPS, 
  INITIAL_CLIENTS, 
  INITIAL_TASKS, 
  INITIAL_NOTICES, 
  INITIAL_INVOICES, 
  INITIAL_DSC_TOKENS, 
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_TRAIL,
  FIRM_METRICS,
  INITIAL_PASSWORD_VAULTS,
  INITIAL_PARSED_STATEMENTS,
  INITIAL_PAY_TO_RELEASE_CONFIGS,
  INITIAL_PORTAL_SYNC_PROFILES,
  INITIAL_MSME_43BH_RECORDS,
  INITIAL_SECTION_40A2B_SAMPLES,
  INITIAL_STAFF_SECURITY_LOGS,
  INITIAL_PARTNER_METRICS
} from "@/lib/data/mockData";

export interface DatabaseSchema {
  firmMetrics: typeof FIRM_METRICS;
  groups: ClientGroup[];
  clients: ClientEntity[];
  tasks: ComplianceTask[];
  notices: NoticeRecord[];
  invoices: InvoiceItem[];
  dscTokens: DscRecord[];
  documents: DocumentItem[];
  auditTrail: AuditTrailLog[];
  passwordVaults: ClientPasswordVault[];
  parsedStatements: ParsedBankStatement[];
  payToReleaseConfigs: PayToReleaseConfig[];
  portalSyncProfiles: GovtPortalSyncProfile[];
  msmeRecords: Msme43BhClauseItem[];
  section40a2bSamples: Section40A2bSampleItem[];
  staffSecurityLogs: StaffDataSecurityAudit[];
  partnerMetrics: PartnerRealizationMetrics[];
  pilotScorecard?: PilotScorecard;
  lastUpdated: string;
  /** Optimistic concurrency version. Stored alongside the JSONB row, not in it. */
  revision?: number;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
async function getPersistentSupabaseClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(cookieStore);
}

async function getCurrentFirmId(): Promise<string> {
  const requestHeaders = await headers();
  const firmId = requestHeaders.get("x-workspace-firm-id");
  if (!firmId) throw new Error("Authenticated workspace context is required.");
  return firmId;
}

// Simple Mutex for Atomic File Operations
let isWriting = false;
const writeQueue: (() => void)[] = [];

function acquireLock(): Promise<void> {
  return new Promise((resolve) => {
    if (!isWriting) {
      isWriting = true;
      resolve();
    } else {
      writeQueue.push(() => {
        isWriting = true;
        resolve();
      });
    }
  });
}

function releaseLock(): void {
  isWriting = false;
  if (writeQueue.length > 0) {
    const next = writeQueue.shift();
    if (next) next();
  }
}

function createInitialDatabaseData(firmProfile: { name?: string; frn?: string } = {}): DatabaseSchema {
  return {
    firmMetrics: {
      ...FIRM_METRICS,
      name: firmProfile.name || "",
      companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "",
      frn: firmProfile.frn || "",
      peerReviewStatus: "",
      partnersCount: 0,
      articleTrainees: 0,
      complianceHealthScore: 0,
      firmUpiVpa: "",
      firmBankDetails: { bankName: "", branch: "", accountNumber: "", accountName: "", ifsc: "" },
    },
    groups: [], clients: [], tasks: [], notices: [], invoices: [], dscTokens: [], documents: [],
    auditTrail: [], passwordVaults: [], parsedStatements: [], payToReleaseConfigs: [],
    portalSyncProfiles: [], msmeRecords: [], section40a2bSamples: [], staffSecurityLogs: [],
    partnerMetrics: [], lastUpdated: new Date().toISOString(),
    pilotScorecard: { baseline: null, review: null, updatedAt: null },
  };
}

/**
 * Ensure database file and uploads directory exist
 */
function ensureLocalDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const createDefaultData = (): DatabaseSchema => ({
    firmMetrics: process.env.NODE_ENV === "production"
      ? {
          ...FIRM_METRICS,
          name: process.env.NEXT_PUBLIC_FIRM_NAME || "",
          companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "",
          frn: process.env.NEXT_PUBLIC_FIRM_FRN || "",
          peerReviewStatus: "",
          partnersCount: 0,
          articleTrainees: 0,
          complianceHealthScore: 0,
          firmUpiVpa: process.env.NEXT_PUBLIC_FIRM_UPI_VPA || "",
          firmBankDetails: { bankName: "", branch: "", accountNumber: "", accountName: "", ifsc: "" },
        }
      : FIRM_METRICS,
    groups: process.env.NODE_ENV === "production" ? [] : INITIAL_GROUPS,
    clients: process.env.NODE_ENV === "production" ? [] : INITIAL_CLIENTS,
    tasks: process.env.NODE_ENV === "production" ? [] : INITIAL_TASKS,
    notices: process.env.NODE_ENV === "production" ? [] : INITIAL_NOTICES,
    invoices: process.env.NODE_ENV === "production" ? [] : INITIAL_INVOICES,
    dscTokens: process.env.NODE_ENV === "production" ? [] : INITIAL_DSC_TOKENS,
    documents: process.env.NODE_ENV === "production" ? [] : INITIAL_DOCUMENTS,
    auditTrail: process.env.NODE_ENV === "production" ? [] : INITIAL_AUDIT_TRAIL,
    passwordVaults: process.env.NODE_ENV === "production" ? [] : INITIAL_PASSWORD_VAULTS,
    parsedStatements: process.env.NODE_ENV === "production" ? [] : INITIAL_PARSED_STATEMENTS as any,
    payToReleaseConfigs: process.env.NODE_ENV === "production" ? [] : INITIAL_PAY_TO_RELEASE_CONFIGS as any,
    portalSyncProfiles: process.env.NODE_ENV === "production" ? [] : INITIAL_PORTAL_SYNC_PROFILES as any,
    msmeRecords: process.env.NODE_ENV === "production" ? [] : INITIAL_MSME_43BH_RECORDS as any,
    section40a2bSamples: process.env.NODE_ENV === "production" ? [] : INITIAL_SECTION_40A2B_SAMPLES as any,
    staffSecurityLogs: process.env.NODE_ENV === "production" ? [] : INITIAL_STAFF_SECURITY_LOGS as any,
    partnerMetrics: process.env.NODE_ENV === "production" ? [] : INITIAL_PARTNER_METRICS as any,
    pilotScorecard: { baseline: null, review: null, updatedAt: null },
    lastUpdated: new Date().toISOString(),
  });

  if (!fs.existsSync(DB_FILE)) {
    const initialData = createDefaultData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }

  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content) as DatabaseSchema;
    
    // Auto-migrate missing enterprise fields if reading from older snapshot
    let modified = false;
    if (!parsed.passwordVaults) { parsed.passwordVaults = INITIAL_PASSWORD_VAULTS; modified = true; }
    if (!parsed.parsedStatements) { parsed.parsedStatements = INITIAL_PARSED_STATEMENTS as any; modified = true; }
    if (!parsed.payToReleaseConfigs) { parsed.payToReleaseConfigs = INITIAL_PAY_TO_RELEASE_CONFIGS as any; modified = true; }
    if (!parsed.portalSyncProfiles) { parsed.portalSyncProfiles = INITIAL_PORTAL_SYNC_PROFILES as any; modified = true; }
    if (!parsed.msmeRecords) { parsed.msmeRecords = INITIAL_MSME_43BH_RECORDS as any; modified = true; }
    if (!parsed.section40a2bSamples) { parsed.section40a2bSamples = INITIAL_SECTION_40A2B_SAMPLES as any; modified = true; }
    if (!parsed.staffSecurityLogs) { parsed.staffSecurityLogs = INITIAL_STAFF_SECURITY_LOGS as any; modified = true; }
    if (!parsed.partnerMetrics) { parsed.partnerMetrics = INITIAL_PARTNER_METRICS as any; modified = true; }

    if (modified) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    }

    return parsed;
  } catch (error) {
    console.error("Error reading database, creating fresh backup:", error);
    const initialData = createDefaultData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
}

/**
 * Atomically save database state
 */
export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  if (process.env.NODE_ENV === "production") {
    if (data.revision === undefined) throw new Error("Cannot save without a database revision; reload the firm data.");
    const { revision, ...persistedData } = data;
    const supabase = await getPersistentSupabaseClient();
    const { data: updatedRevision, error } = await supabase.rpc("save_firm_app_state", {
      p_data: persistedData,
      p_expected_revision: revision,
    });
    if (error) {
      if (error.code === "40001") throw new Error("Firm data changed in another session. Refresh and retry your update.");
      throw new Error("Firm data and its scoped records could not be saved.");
    }
    if (updatedRevision === null || updatedRevision === undefined) {
      throw new Error("Firm data and its scoped records could not be saved.");
    }
    data.revision = Number(updatedRevision);
    return;
  }

  await acquireLock();
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } finally {
    releaseLock();
  }
}

/**
 * Log an audit trail event
 */
export async function logAuditEvent(
  actorName: string,
  actorRole: "PARTNER" | "MANAGER" | "ARTICLE" | "CLIENT" | "SYSTEM",
  entityName: string,
  action: string,
  details: string,
  category: AuditTrailLog["category"],
  database?: DatabaseSchema
): Promise<AuditTrailLog> {
  const db = database || await ensureDatabase();
  if (process.env.NODE_ENV === "production" && actorRole !== "SYSTEM") {
    const requestHeaders = await headers();
    const trustedRole = requestHeaders.get("x-workspace-user-role");
    const trustedActorRole: AuditTrailLog["actorRole"] = trustedRole === "ARTICLE_TRAINEE"
      ? "ARTICLE"
      : trustedRole === "PAID_CA_MANAGER"
        ? "MANAGER"
        : trustedRole === "CLIENT_PROMOTER" || trustedRole === "CLIENT_ACCOUNTANT"
          ? "CLIENT"
          : "PARTNER";
    actorName = requestHeaders.get("x-workspace-user-name") || "Firm user";
    actorRole = trustedActorRole;
  } else if (process.env.NODE_ENV === "production") {
    actorName = "System";
  }
  const newLog: AuditTrailLog = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actorName,
    actorRole,
    entityName,
    action,
    details,
    category,
  };
  db.auditTrail.unshift(newLog);
  if (!database) await saveDatabase(db);
  return newLog;
}

async function ensurePersistentDatabase(): Promise<DatabaseSchema> {
  const firmId = await getCurrentFirmId();
  const requestHeaders = await headers();
  const supabase = await getPersistentSupabaseClient();
  const loadRow = () => supabase
    .from("firm_app_state")
    .select("data,revision")
    .eq("firm_id", firmId)
    .maybeSingle();
  let { data: row, error } = await loadRow();
  if (error) throw new Error("Firm data could not be loaded.");
  if (!row) {
    const { error: insertError } = await supabase.from("firm_app_state").insert({
      firm_id: firmId,
      data: createInitialDatabaseData({
        name: requestHeaders.get("x-workspace-firm-name") || "",
        frn: requestHeaders.get("x-workspace-firm-frn") || "",
      }),
    });
    if (insertError && insertError.code !== "23505") throw new Error("Firm data store could not be initialized.");
    const loaded = await loadRow();
    row = loaded.data;
    error = loaded.error;
  }
  if (error || !row) throw new Error("Firm data store could not be initialized.");

  const { data: auditRows, error: auditError } = await supabase
    .from("audit_logs")
    .select("id,actor_name,actor_role,entity_name,action,details,category,created_at")
    .eq("firm_id", firmId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (auditError) throw new Error("Firm security activity could not be loaded.");

  const normalizedAuditTrail: AuditTrailLog[] = (auditRows || []).map((entry) => {
    const actorRole: AuditTrailLog["actorRole"] = ["CLIENT_PROMOTER", "CLIENT_ACCOUNTANT"].includes(entry.actor_role)
      ? "CLIENT"
      : entry.actor_role === "PAID_CA_MANAGER"
        ? "MANAGER"
        : entry.actor_role === "ARTICLE_TRAINEE"
          ? "ARTICLE"
          : entry.actor_role === "SYSTEM"
            ? "SYSTEM"
            : "PARTNER";
    const allowedCategories: AuditTrailLog["category"][] = [
      "COMPLIANCE", "DOCUMENT", "INVOICE", "UDIN", "WHATSAPP", "SECURITY", "PEER_REVIEW", "PAY_RELEASE", "SYSTEM",
    ];
    const category = allowedCategories.includes(entry.category as AuditTrailLog["category"])
      ? entry.category as AuditTrailLog["category"]
      : "SECURITY";
    return {
      id: entry.id,
      timestamp: entry.created_at,
      actorName: entry.actor_name,
      actorRole,
      entityName: entry.entity_name,
      action: entry.action,
      details: entry.details,
      category,
    };
  });
  const snapshotAuditTrail = Array.isArray(row.data.auditTrail) ? row.data.auditTrail : [];
  const auditById = new Map<string, AuditTrailLog>();
  for (const entry of [...snapshotAuditTrail, ...normalizedAuditTrail]) auditById.set(entry.id, entry);
  const auditTrail = [...auditById.values()]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 500);

  return { ...row.data, auditTrail, revision: Number(row.revision) } as DatabaseSchema;
}

export async function ensureDatabase(): Promise<DatabaseSchema> {
  return process.env.NODE_ENV === "production" ? ensurePersistentDatabase() : ensureLocalDatabase();
}
