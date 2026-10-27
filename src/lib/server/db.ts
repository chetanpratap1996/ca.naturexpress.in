import fs from "fs";
import path from "path";
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
  PartnerRealizationMetrics
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
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

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

/**
 * Ensure database file and uploads directory exist
 */
export function ensureDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const createDefaultData = (): DatabaseSchema => ({
    firmMetrics: FIRM_METRICS,
    groups: INITIAL_GROUPS,
    clients: INITIAL_CLIENTS,
    tasks: INITIAL_TASKS,
    notices: INITIAL_NOTICES,
    invoices: INITIAL_INVOICES,
    dscTokens: INITIAL_DSC_TOKENS,
    documents: INITIAL_DOCUMENTS,
    auditTrail: INITIAL_AUDIT_TRAIL,
    passwordVaults: INITIAL_PASSWORD_VAULTS,
    parsedStatements: INITIAL_PARSED_STATEMENTS as any,
    payToReleaseConfigs: INITIAL_PAY_TO_RELEASE_CONFIGS as any,
    portalSyncProfiles: INITIAL_PORTAL_SYNC_PROFILES as any,
    msmeRecords: INITIAL_MSME_43BH_RECORDS as any,
    section40a2bSamples: INITIAL_SECTION_40A2B_SAMPLES as any,
    staffSecurityLogs: INITIAL_STAFF_SECURITY_LOGS as any,
    partnerMetrics: INITIAL_PARTNER_METRICS as any,
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
  await acquireLock();
  try {
    data.lastUpdated = new Date().toISOString();
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
  actorRole: "PARTNER" | "ARTICLE" | "CLIENT" | "SYSTEM",
  entityName: string,
  action: string,
  details: string,
  category: AuditTrailLog["category"]
): Promise<AuditTrailLog> {
  const db = ensureDatabase();
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
  await saveDatabase(db);
  return newLog;
}
