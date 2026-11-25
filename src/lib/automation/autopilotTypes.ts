export interface AutopilotPolicyConfig {
  enabled: boolean;
  autoSpawnTasks: boolean;
  autoAssignStaff: boolean;
  autoAdvanceDocs: boolean;
  autoDraftInvoices: boolean;
  autoLockPayToRelease: boolean;
  autoSendDeadlineNotifications: boolean;
  gracePeriodDays: number;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_AUTOPILOT_POLICY: AutopilotPolicyConfig = {
  enabled: true,
  autoSpawnTasks: true,
  autoAssignStaff: true,
  autoAdvanceDocs: true,
  autoDraftInvoices: true,
  autoLockPayToRelease: true,
  autoSendDeadlineNotifications: true,
  gracePeriodDays: 30,
};

export interface AutopilotExecutionSummary {
  timestamp: string;
  triggeredBy: string;
  tasksSpawned: number;
  tasksAutoAssigned?: number;
  totalLateFeeAudited: number;
  openTasksUpdated: number;
  vaultDocsAutoUnlocked: number;
  tasksAutoAdvanced: number;
  msmeOverdueInvoicesDetected: number;
  totalMsmeInterestAccrued: number;
  deliverableGatesActive: number;
  autoInvoicesDrafted: number;
  gstr2bInvoicesAudited?: number;
  missingItcRecoverableInr?: number;
  vendorNoticesDrafted?: number;
  aisSftTransactionsClassified?: number;
  scrutinyNoticeRisksFlagged?: number;
  form3cdDisallowancesAuditedInr?: number;
  caroClausesEvaluated?: number;
  itrDualRegimesOptimized?: number;
  totalClientTaxSavingsIdentifiedInr?: number;
  fatalDinNoticesFlagged?: number;
  demandUnderShieldInr?: number;
  dscTokensAudited?: number;
  form10IeaPendingCount?: number;
  executionDurationMs: number;
  systemHealthScore: number;
  logMessages: string[];
}

export interface PracticePulseEvent {
  id: string;
  timestamp: string;
  moduleCode: string;
  moduleName: string;
  clientName: string;
  eventType: "ZERO_TOUCH_SUCCESS" | "EXCEPTION_FLAGGED" | "PORTAL_SYNC" | "STATUTORY_DEADLINE";
  description: string;
  statutorySection?: string;
  autoActionTaken: string;
}

export interface PracticeExceptionItem {
  id: string;
  moduleCode: "GST" | "TDS" | "MCA" | "LITIGATION" | "GOVERNANCE" | "BILLING";
  moduleName: string;
  clientName: string;
  entityId?: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM";
  title: string;
  discrepancyDetails: string;
  statutoryImpact: string;
  recommendedAction: string;
  quickActionLabel: string;
  status: "PENDING_PARTNER" | "RESOLVED";
  metadata?: Record<string, any>;
}

export interface PracticeHeartbeatState {
  lastSweepTimestamp: string;
  totalActiveClients: number;
  totalAutomatedFilingsToday: number;
  autonomousCompletionRatePcnt: number;
  hoursSavedThisMonth: number;
  realizedRevenueThisMonthInr: number;
  unbilledWipInr: number;
  activeExceptionsCount: number;
  exceptions: PracticeExceptionItem[];
  recentPulseEvents: PracticePulseEvent[];
  moduleHealth: {
    module1Stickiness: { status: "OPTIMAL" | "ATTENTION"; label: string; cleanCount: number };
    module2Accuracy: { status: "OPTIMAL" | "ATTENTION"; label: string; cleanCount: number };
    module3Autonomy: { status: "OPTIMAL" | "ATTENTION"; label: string; cleanCount: number };
  };
}

export const EMPTY_HEARTBEAT_STATE: PracticeHeartbeatState = {
  lastSweepTimestamp: "Unavailable",
  totalActiveClients: 0,
  totalAutomatedFilingsToday: 0,
  autonomousCompletionRatePcnt: 0,
  hoursSavedThisMonth: 0,
  realizedRevenueThisMonthInr: 0,
  unbilledWipInr: 0,
  activeExceptionsCount: 0,
  exceptions: [],
  recentPulseEvents: [],
  moduleHealth: {
    module1Stickiness: { status: "ATTENTION", label: "Entity DNA & Document Vault", cleanCount: 0 },
    module2Accuracy: { status: "ATTENTION", label: "Reconciliation & Tax Audit", cleanCount: 0 },
    module3Autonomy: { status: "ATTENTION", label: "Autonomous Practice Pipeline", cleanCount: 0 },
  },
};
