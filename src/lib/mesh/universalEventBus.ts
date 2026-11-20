/**
 * Universal Event Bus & Cross-Suite Ripple Nervous System
 * 
 * Implements Decoupled Reactive Event Dispatching for Indian CA Practices:
 * - When a tax return or audit is filed -> Ripples to Billing (WIP), Calendar (Task Complete),
 *   WhatsApp (Client Receipt), Tally (MOC Journal), and Audit Trail (SA 230).
 * - When an invoice is paid -> Unlocks deliverables in Pay-to-Release Gatekeeper.
 */

export type FirmEventName =
  | "COMPLIANCE_FILED"
  | "TASK_STATUS_CHANGED"
  | "INVOICE_CREATED"
  | "INVOICE_PAID"
  | "UTR_SUBMITTED"
  | "NOTICE_RECEIVED"
  | "NOTICE_REPLIED"
  | "UDIN_GENERATED"
  | "DSC_CHECKED_OUT"
  | "DSC_RETURNED"
  | "CLIENT_ENTITY_UPDATED";

export interface ComplianceFiledPayload {
  clientId: string;
  clientName: string;
  pan: string;
  gstin?: string;
  complianceType: "GSTR-1" | "GSTR-3B" | "ITR-1" | "ITR-2" | "ITR-3" | "ITR-5" | "ITR-6" | "FORM_3CD" | "FORM_26Q" | "DIR-3_KYC" | "DPT-3";
  period: string; // e.g. "Oct 2026", "AY 2026-27"
  arnOrAckNo: string;
  taxPaidAmount?: number;
  filedBy: string;
  timestamp: string;
}

export interface InvoicePaidPayload {
  invoiceId: string;
  invoiceNo: string;
  clientId: string;
  clientName: string;
  amount: number;
  utrNumber?: string;
  paymentMode: "UPI" | "NEFT_RTGS" | "IMPS" | "CHEQUE";
  timestamp: string;
}

export interface TaskStatusChangedPayload {
  taskId: string;
  clientId: string;
  previousStatus: string;
  newStatus: string;
  updatedBy: string;
  timestamp: string;
}

export interface UniversalEvent<T = any> {
  id: string;
  name: FirmEventName;
  payload: T;
  timestamp: string;
}

type EventListener<T = any> = (event: UniversalEvent<T>) => void | Promise<void>;

class UniversalEventBusSingleton {
  private listeners: Map<FirmEventName, Set<EventListener>> = new Map();
  private eventHistory: UniversalEvent[] = [];
  private maxHistory: number = 100;

  constructor() {
    // Initialize standard event categories
    const allEvents: FirmEventName[] = [
      "COMPLIANCE_FILED",
      "TASK_STATUS_CHANGED",
      "INVOICE_CREATED",
      "INVOICE_PAID",
      "UTR_SUBMITTED",
      "NOTICE_RECEIVED",
      "NOTICE_REPLIED",
      "UDIN_GENERATED",
      "DSC_CHECKED_OUT",
      "DSC_RETURNED",
      "CLIENT_ENTITY_UPDATED",
    ];
    allEvents.forEach((evt) => this.listeners.set(evt, new Set()));
  }

  /**
   * Subscribe to a specific firm event
   */
  public subscribe<T = any>(eventName: FirmEventName, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(listener);

    // Return unbind function
    return () => {
      this.listeners.get(eventName)?.delete(listener);
    };
  }

  /**
   * Emit an event that ripples across the entire suite
   */
  public emit<T = any>(eventName: FirmEventName, payload: T): UniversalEvent<T> {
    const event: UniversalEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: eventName,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Store in history buffer
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    // Trigger all active listeners asynchronously
    const set = this.listeners.get(eventName);
    if (set && set.size > 0) {
      set.forEach((listener) => {
        try {
          const res = listener(event);
          if (res instanceof Promise) {
            res.catch((err) => console.error(`[EventBus] Error in async listener for ${eventName}:`, err));
          }
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${eventName}:`, err);
        }
      });
    }

    // Browser broadcast channel for multi-tab sync if available
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel("ca_firm_sync_channel");
        channel.postMessage({ type: "FIRM_EVENT", event });
        channel.close();
      } catch (e) {
        // BroadcastChannel optional fallback
      }
    }

    return event;
  }

  /**
   * Get recent events log
   */
  public getHistory(limit: number = 20): UniversalEvent[] {
    return this.eventHistory.slice(0, limit);
  }
}

export const universalEventBus = new UniversalEventBusSingleton();
