"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ComplianceTask, 
  DocumentItem, 
  InvoiceItem, 
  NoticeRecord, 
  DscRecord, 
  ClientEntity, 
  ClientGroup, 
  AuditTrailLog,
  PayToReleaseConfig
} from "@/lib/types";
import { 
  INITIAL_TASKS, 
  INITIAL_DOCUMENTS, 
  INITIAL_INVOICES, 
  INITIAL_NOTICES, 
  INITIAL_DSC_TOKENS, 
  INITIAL_CLIENTS, 
  INITIAL_GROUPS,
  INITIAL_AUDIT_TRAIL,
  INITIAL_PAY_TO_RELEASE_CONFIGS
} from "@/lib/data/mockData";

const isDemoBuild = process.env.NODE_ENV !== "production";

async function requestMutation(path: string, body: unknown, method: "POST" | "PATCH" = "POST") {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || "The change could not be saved. Refresh and try again.");
  }
  return result;
}

export function useTaxoData(options: { clientPortal?: boolean; enabled?: boolean } = {}) {
  const dataEndpoint = options.clientPortal ? "/api/client-portal" : "/api/data";
  const documentUploadEndpoint = options.clientPortal ? "/api/client-portal/documents" : "/api/documents";
  const enabled = options.enabled ?? true;
  const [tasks, setTasks] = useState<ComplianceTask[]>(isDemoBuild ? INITIAL_TASKS : []);
  const [documents, setDocuments] = useState<DocumentItem[]>(isDemoBuild ? INITIAL_DOCUMENTS : []);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(isDemoBuild ? INITIAL_INVOICES : []);
  const [notices, setNotices] = useState<NoticeRecord[]>(isDemoBuild ? INITIAL_NOTICES : []);
  const [dscTokens, setDscTokens] = useState<DscRecord[]>(isDemoBuild ? INITIAL_DSC_TOKENS : []);
  const [clients, setClients] = useState<ClientEntity[]>(isDemoBuild ? INITIAL_CLIENTS : []);
  const [groups, setGroups] = useState<ClientGroup[]>(isDemoBuild ? INITIAL_GROUPS : []);
  const [auditTrail, setAuditTrail] = useState<AuditTrailLog[]>(isDemoBuild ? INITIAL_AUDIT_TRAIL : []);
  const [payConfigs, setPayConfigs] = useState<PayToReleaseConfig[]>(isDemoBuild ? INITIAL_PAY_TO_RELEASE_CONFIGS as any : []);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Fetch initial data from persistent backend
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch(dataEndpoint, { cache: "no-store" });
      if (!res.ok) {
        setDataError("Firm data is temporarily unavailable. Your changes may not be saved.");
        if (!isDemoBuild) {
          setTasks([]); setDocuments([]); setInvoices([]); setNotices([]); setDscTokens([]);
          setClients([]); setGroups([]); setAuditTrail([]); setPayConfigs([]);
        }
      } else {
        const json = await res.json();
        if (json.success && json.data) {
          setDataError(null);
          setTasks(json.data.tasks || (isDemoBuild ? INITIAL_TASKS : []));
          setDocuments(json.data.documents || (isDemoBuild ? INITIAL_DOCUMENTS : []));
          setInvoices(json.data.invoices || (isDemoBuild ? INITIAL_INVOICES : []));
          setNotices(json.data.notices || (isDemoBuild ? INITIAL_NOTICES : []));
          setDscTokens(json.data.dscTokens || (isDemoBuild ? INITIAL_DSC_TOKENS : []));
          setClients(json.data.clients || (isDemoBuild ? INITIAL_CLIENTS : []));
          setGroups(json.data.groups || (isDemoBuild ? INITIAL_GROUPS : []));
          setAuditTrail(json.data.auditTrail || (isDemoBuild ? INITIAL_AUDIT_TRAIL : []));
          if (json.data.payToReleaseConfigs) {
            setPayConfigs(json.data.payToReleaseConfigs);
          } else if (!isDemoBuild) {
            setPayConfigs([]);
          }
        }
      }
    } catch (err) {
      console.warn("Using local cached state, backend offline:", err);
      setDataError("Firm data is temporarily unavailable. Your changes may not be saved.");
      if (!isDemoBuild) {
        setTasks([]); setDocuments([]); setInvoices([]); setNotices([]); setDscTokens([]);
        setClients([]); setGroups([]); setAuditTrail([]); setPayConfigs([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [dataEndpoint]);

  useEffect(() => {
    if (enabled) void refreshData();
    else setIsLoading(false);
  }, [refreshData, enabled]);

  // Create Task
  const createTask = async (taskData: Partial<ComplianceTask>) => {
    try {
      const result = await requestMutation("/api/tasks", taskData);
      await refreshData();
      return result.task;
    } catch (err) {
      console.error("Failed to create task", err);
      throw err;
    }
  };

  // Update Task (status, UDIN, chase)
  const updateTask = async (taskId: string, updates: Partial<ComplianceTask>) => {
    try {
      const result = await requestMutation("/api/tasks", { taskId, ...updates }, "PATCH");
      await refreshData();
      return result.task;
    } catch (err) {
      console.error("Failed to update task", err);
      throw err;
    }
  };

  const recordReminderDraft = async (taskId: string) => {
    try {
      const result = await requestMutation("/api/tasks", { taskId, action: "PREPARE_WHATSAPP_DRAFT" }, "PATCH");
      await refreshData();
      return result.task;
    } catch (err) {
      console.error("Failed to record reminder draft", err);
      throw err;
    }
  };

  // Upload Document
  const uploadDocument = async (docData: {
    entityId: string;
    category: DocumentItem["category"];
    financialYear: string;
    taskId?: string;
    file: File;
  }) => {
    try {
      const body = new FormData();
      body.set("entityId", docData.entityId);
      body.set("category", docData.category);
      body.set("financialYear", docData.financialYear);
      if (docData.taskId) body.set("taskId", docData.taskId);
      body.set("file", docData.file);
      const response = await fetch(documentUploadEndpoint, { method: "POST", body, cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "The document could not be stored.");
      await refreshData();
      return result.document;
    } catch (err) {
      console.error("Failed to upload document", err);
      throw err;
    }
  };

  // Review Document
  const reviewDocument = async (docId: string, reviewStatus: DocumentItem["reviewStatus"], reviewNotes?: string) => {
    try {
      const result = await requestMutation("/api/documents", { docId, reviewStatus, reviewNotes }, "PATCH");
      await refreshData();
      return result.document;
    } catch (err) {
      console.error("Failed to review document", err);
      throw err;
    }
  };

  // Submit Client UTR
  const submitClientUtr = async (
    invoiceId: string, 
    clientUtrNumber: string, 
    clientPaymentMode: InvoiceItem["clientPaymentMode"], 
    clientPayerNote?: string,
    actorName?: string
  ) => {
    try {
      const result = await requestMutation("/api/invoices", {
          invoiceId,
          action: "SUBMIT_UTR",
          clientUtrNumber,
          clientPaymentMode,
          clientPayerNote,
          actorName: actorName || "Client Accounts Desk",
      }, "PATCH");
      await refreshData();
      return result.invoice;
    } catch (err) {
      console.error("Failed to submit UTR", err);
      throw err;
    }
  };

  // Reconcile Invoice (Firm Partner/Article marks as Paid)
  const reconcileInvoice = async (invoiceId: string, reconciledBy?: string) => {
    try {
      const result = await requestMutation("/api/invoices", {
          invoiceId,
          action: "RECONCILE",
          reconciledBy: reconciledBy || "CA Gunjan Jain (Partner)",
      }, "PATCH");
      await refreshData();
      return result.invoice;
    } catch (err) {
      console.error("Failed to reconcile invoice", err);
      throw err;
    }
  };

  // DSC Checkout & Return
  const checkoutDscToken = async (tokenId: string, staffName: string, purpose: string) => {
    try {
      await requestMutation("/api/dsc", {
          tokenId,
          action: "CHECKOUT",
          staffName,
          purpose,
      }, "PATCH");
      await refreshData();
    } catch (err) {
      console.error("Failed to checkout DSC token", err);
      throw err;
    }
  };

  const returnDscToken = async (tokenId: string) => {
    try {
      await requestMutation("/api/dsc", {
          tokenId,
          action: "RETURN",
      }, "PATCH");
      await refreshData();
    } catch (err) {
      console.error("Failed to return DSC token", err);
      throw err;
    }
  };

  // Pay-To-Release Gatekeeper
  const instantUpiUnlock = async (entityId: string, amount: number) => {
    try {
      const result = await requestMutation("/api/pay-to-release", {
          action: "INSTANT_PAYMENT_RELEASE",
          entityId,
          amountPaid: amount,
          paymentMode: "UPI_DYNAMIC",
          utrRef: `UPI-${Date.now().toString().slice(-8)}`,
      });
      await refreshData();
      return result;
    } catch (err) {
      console.error("Failed to instant unlock", err);
      throw err;
    }
  };

  // Create Client
  const createClient = async (clientData: Partial<ClientEntity>) => {
    try {
      const result = await requestMutation("/api/clients", clientData);
      await refreshData();
      return result.client;
    } catch (err) {
      console.error("Failed to create client", err);
      throw err;
    }
  };

  return {
    tasks,
    documents,
    invoices,
    notices,
    dscTokens,
    clients,
    groups,
    auditTrail,
    payConfigs,
    isLoading,
    dataError,
    refreshData,
    createClient,
    createTask,
    updateTask,
    recordReminderDraft,
    uploadDocument,
    reviewDocument,
    submitClientUtr,
    reconcileInvoice,
    checkoutDscToken,
    returnDscToken,
    instantUpiUnlock,
  };
}
