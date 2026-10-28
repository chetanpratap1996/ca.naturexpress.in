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

export function useTaxoData() {
  const [tasks, setTasks] = useState<ComplianceTask[]>(INITIAL_TASKS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [notices, setNotices] = useState<NoticeRecord[]>(INITIAL_NOTICES);
  const [dscTokens, setDscTokens] = useState<DscRecord[]>(INITIAL_DSC_TOKENS);
  const [clients, setClients] = useState<ClientEntity[]>(INITIAL_CLIENTS);
  const [groups, setGroups] = useState<ClientGroup[]>(INITIAL_GROUPS);
  const [auditTrail, setAuditTrail] = useState<AuditTrailLog[]>(INITIAL_AUDIT_TRAIL);
  const [payConfigs, setPayConfigs] = useState<PayToReleaseConfig[]>(INITIAL_PAY_TO_RELEASE_CONFIGS as any);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from persistent backend
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTasks(json.data.tasks || INITIAL_TASKS);
          setDocuments(json.data.documents || INITIAL_DOCUMENTS);
          setInvoices(json.data.invoices || INITIAL_INVOICES);
          setNotices(json.data.notices || INITIAL_NOTICES);
          setDscTokens(json.data.dscTokens || INITIAL_DSC_TOKENS);
          setClients(json.data.clients || INITIAL_CLIENTS);
          setGroups(json.data.groups || INITIAL_GROUPS);
          setAuditTrail(json.data.auditTrail || INITIAL_AUDIT_TRAIL);
          if (json.data.payToReleaseConfigs) {
            setPayConfigs(json.data.payToReleaseConfigs);
          }
        }
      }
    } catch (err) {
      console.warn("Using local cached state, backend offline:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Create Task
  const createTask = async (taskData: Partial<ComplianceTask>) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTasks((prev) => [json.task, ...prev]);
          refreshData();
          return json.task;
        }
      }
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  // Update Task (status, UDIN, chase)
  const updateTask = async (taskId: string, updates: Partial<ComplianceTask>) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, ...updates }),
      });
      refreshData();
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  // Upload Document
  const uploadDocument = async (docData: {
    entityId: string;
    entityName: string;
    category: DocumentItem["category"];
    fileName: string;
    fileSize: string;
    financialYear: string;
    taskId?: string;
    uploadedBy: DocumentItem["uploadedBy"];
    fileContentBase64?: string;
    storagePath?: string;
    actorName?: string;
  }) => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Document upload was rejected.");
      }
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setDocuments((prev) => [json.document, ...prev]);
          refreshData();
          return json.document;
        }
      }
    } catch (err) {
      console.error("Failed to upload document", err);
      throw err;
    }
  };

  // Review Document
  const reviewDocument = async (docId: string, reviewStatus: DocumentItem["reviewStatus"], reviewNotes?: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, reviewStatus, reviewNotes } : d))
    );
    try {
      await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, reviewStatus, reviewNotes }),
      });
      refreshData();
    } catch (err) {
      console.error("Failed to review document", err);
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
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: "UTR_SUBMITTED",
              clientUtrNumber,
              clientPaymentMode,
              clientPaymentDate: new Date().toISOString().split("T")[0],
              clientPayerNote,
            }
          : inv
      )
    );
    try {
      await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          action: "SUBMIT_UTR",
          clientUtrNumber,
          clientPaymentMode,
          clientPayerNote,
          actorName: actorName || "Client Accounts Desk",
        }),
      });
      refreshData();
    } catch (err) {
      console.error("Failed to submit UTR", err);
    }
  };

  // Reconcile Invoice (Firm Partner/Article marks as Paid)
  const reconcileInvoice = async (invoiceId: string, reconciledBy?: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: "PAID",
              reconciledBy: reconciledBy || "CA Gunjan Jain (Partner)",
              reconciledAt: new Date().toISOString(),
            }
          : inv
      )
    );
    try {
      await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          action: "RECONCILE",
          reconciledBy: reconciledBy || "CA Gunjan Jain (Partner)",
        }),
      });
      refreshData();
    } catch (err) {
      console.error("Failed to reconcile invoice", err);
    }
  };

  // DSC Checkout & Return
  const checkoutDscToken = async (tokenId: string, staffName: string, purpose: string) => {
    setDscTokens((prev) =>
      prev.map((t) =>
        t.id === tokenId
          ? {
              ...t,
              currentCustodian: staffName,
              checkedOutAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              checkedOutPurpose: purpose,
            }
          : t
      )
    );
    try {
      await fetch("/api/dsc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
          action: "CHECKOUT",
          staffName,
          purpose,
        }),
      });
      refreshData();
    } catch (err) {
      console.error("Failed to checkout DSC token", err);
    }
  };

  const returnDscToken = async (tokenId: string) => {
    setDscTokens((prev) =>
      prev.map((t) =>
        t.id === tokenId
          ? {
              ...t,
              currentCustodian: "Firm Master Safe",
              checkedOutAt: undefined,
              checkedOutPurpose: undefined,
            }
          : t
      )
    );
    try {
      await fetch("/api/dsc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId,
          action: "RETURN",
        }),
      });
      refreshData();
    } catch (err) {
      console.error("Failed to return DSC token", err);
    }
  };

  // Pay-To-Release Gatekeeper
  const instantUpiUnlock = async (entityId: string, amount: number) => {
    try {
      const res = await fetch("/api/pay-to-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INSTANT_PAYMENT_RELEASE",
          entityId,
          amountPaid: amount,
          paymentMode: "UPI_DYNAMIC",
          utrRef: `UPI-${Date.now().toString().slice(-8)}`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          refreshData();
          return json;
        }
      }
    } catch (err) {
      console.error("Failed to instant unlock", err);
    }
  };

  // Create Client
  const createClient = async (clientData: Partial<ClientEntity>) => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.client) {
          setClients((prev) => [json.client, ...prev]);
          refreshData();
          return json.client;
        }
      }
    } catch (err) {
      console.error("Failed to create client", err);
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
    refreshData,
    createClient,
    createTask,
    updateTask,
    uploadDocument,
    reviewDocument,
    submitClientUtr,
    reconcileInvoice,
    checkoutDscToken,
    returnDscToken,
    instantUpiUnlock,
  };
}
