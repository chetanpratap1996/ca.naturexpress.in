// ============================================================================
// UNIFIED PER-CLIENT + AY TAX & AUDIT AUTOMATION BRIDGE (LOCAL + SERVER SYNC)
// Automatically flows data between:
//   Schedule III (TB/P&L) + Bank Parser + GSTR-2B -> Form 3CD -> AIS -> ITR -> UDIN
// Scoped strictly by (clientId, assessmentYear) with zero dummy data.
// ============================================================================

export interface ClientTaxBridgePayload {
  clientId: string;
  assessmentYear: string;
  // From Schedule III Trial Balance
  tbSyncedAt?: string;
  tbLedgersCount?: number;
  revenueFromOperations?: number;
  netProfitPerBooks?: number;
  penaltyDisallowance37?: number;
  negativeCashCount?: number;
  // From Bank Statement Parser (40A(3) & 269SS/T)
  bankSyncedAt?: string;
  bankCashOver10k40A3?: number;
  bankCashLoans269SS_T?: number;
  // From GSTR-2B / Purchase Register (Clause 44)
  gstSyncedAt?: string;
  gstRegisteredExpense44?: number;
  gstUnregisteredExpense44?: number;
  // From AIS / 26AS
  aisSyncedAt?: string;
  aisTdsTotal?: number;
  aisDividendAndInterest?: number;
  aisSavingsInterest?: number;
  aisStcg111A?: number;
  aisLtcg112A?: number;
  aisUnreportedRiskTotal?: number;
  // From Form 3CD
  form3cdSyncedAt?: string;
  form3cdTotalDisallowances?: number;
  // From ITR
  itrSyncedAt?: string;
  itrTotalIncome?: number;
  itrNetPayableOrRefund?: number;
}

const BRIDGE_STORAGE_PREFIX = "bt_tax_bridge_v1::";
export const TAX_BRIDGE_EVENT = "bt_tax_bridge_updated";

function getBridgeKey(clientId: string, ay: string): string {
  return `${BRIDGE_STORAGE_PREFIX}${clientId}::${ay}`;
}

export function readClientTaxBridge(clientId: string, ay: string): ClientTaxBridgePayload {
  if (typeof window === "undefined" || !clientId) {
    return { clientId, assessmentYear: ay };
  }
  try {
    const raw = localStorage.getItem(getBridgeKey(clientId, ay));
    if (!raw) return { clientId, assessmentYear: ay };
    return { clientId, assessmentYear: ay, ...JSON.parse(raw) };
  } catch {
    return { clientId, assessmentYear: ay };
  }
}

export function writeClientTaxBridge(
  clientId: string,
  ay: string,
  patch: Partial<ClientTaxBridgePayload>
): ClientTaxBridgePayload {
  const existing = readClientTaxBridge(clientId, ay);
  const next: ClientTaxBridgePayload = {
    ...existing,
    ...patch,
    clientId,
    assessmentYear: ay,
  };
  if (typeof window !== "undefined" && clientId) {
    try {
      localStorage.setItem(getBridgeKey(clientId, ay), JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent(TAX_BRIDGE_EVENT, { detail: { clientId, assessmentYear: ay, payload: next } })
      );
      // Persist to server asynchronously for cross-machine Article -> Partner sync
      fetch("/api/tax-audit/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(next),
      }).catch(() => {});
    } catch {}
  }
  return next;
}

export async function syncClientTaxBridgeFromServer(
  clientId: string,
  ay: string
): Promise<ClientTaxBridgePayload> {
  const local = readClientTaxBridge(clientId, ay);
  if (typeof window === "undefined" || !clientId) return local;
  try {
    const res = await fetch(
      `/api/tax-audit/workspace?clientId=${encodeURIComponent(clientId)}&ay=${encodeURIComponent(ay)}`,
      { credentials: "include" }
    );
    if (!res.ok) return local;
    const json = await res.json();
    if (json?.success && json.payload) {
      const merged = { ...local, ...json.payload, clientId, assessmentYear: ay };
      localStorage.setItem(getBridgeKey(clientId, ay), JSON.stringify(merged));
      window.dispatchEvent(
        new CustomEvent(TAX_BRIDGE_EVENT, { detail: { clientId, assessmentYear: ay, payload: merged } })
      );
      return merged;
    }
  } catch {}
  return local;
}
