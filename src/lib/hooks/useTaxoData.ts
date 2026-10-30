"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import {
  SANDBOX_TASKS,
  SANDBOX_DOCUMENTS,
  SANDBOX_INVOICES,
  SANDBOX_NOTICES,
  SANDBOX_DSC_TOKENS,
  SANDBOX_CLIENTS,
  SANDBOX_GROUPS,
  SANDBOX_AUDIT_TRAIL,
  SANDBOX_PAY_TO_RELEASE_CONFIGS
} from "@/lib/data/sandboxData";
import { toast } from "@/components/shared/ToastNotification";

const OFFLINE_QUEUE_KEY = "bt_offline_mutation_queue";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("bt_auth_user");
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

export function useTaxoData(isSandbox: boolean = false) {
  const [tasks, setTasks] = useState<ComplianceTask[]>(isSandbox ? SANDBOX_TASKS : INITIAL_TASKS);
  const [documents, setDocuments] = useState<DocumentItem[]>(isSandbox ? SANDBOX_DOCUMENTS : INITIAL_DOCUMENTS);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(isSandbox ? SANDBOX_INVOICES : INITIAL_INVOICES);
  const [notices, setNotices] = useState<NoticeRecord[]>(isSandbox ? SANDBOX_NOTICES : INITIAL_NOTICES);
  const [dscTokens, setDscTokens] = useState<DscRecord[]>(isSandbox ? SANDBOX_DSC_TOKENS : INITIAL_DSC_TOKENS);
  const [clients, setClients] = useState<ClientEntity[]>(isSandbox ? SANDBOX_CLIENTS : INITIAL_CLIENTS);
  const [groups, setGroups] = useState<ClientGroup[]>(isSandbox ? SANDBOX_GROUPS : INITIAL_GROUPS);
  const [auditTrail, setAuditTrail] = useState<AuditTrailLog[]>(isSandbox ? SANDBOX_AUDIT_TRAIL : INITIAL_AUDIT_TRAIL);
  const [payConfigs, setPayConfigs] = useState<PayToReleaseConfig[]>((isSandbox ? SANDBOX_PAY_TO_RELEASE_CONFIGS : INITIAL_PAY_TO_RELEASE_CONFIGS) as any);
  const [isLoading, setIsLoading] = useState(!isSandbox);

  // Offline queue flusher
  const flushOfflineQueue = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return;
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return;
      const queue: Array<{ url: string; method: string; body: any }> = JSON.parse(raw);
      if (queue.length === 0) return;

      toast.info("Offline Sync", `Reconnecting: Syncing ${queue.length} pending mutations...`);

      for (const item of queue) {
        await fetch(item.url, {
          method: item.method,
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(item.body),
        }).catch(() => {});
      }

      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      toast.success("Synchronized", "All offline changes have been saved to practice database.");
      refreshData();
    } catch (e) {
      console.warn("Error flushing offline queue:", e);
    }
  }, []);

  const queueOfflineAction = (url: string, method: string, body: any) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]";
      const queue = JSON.parse(raw);
      queue.push({ url, method, body, timestamp: Date.now() });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      toast.warning("Working Offline", "Action queued locally and will sync when network is restored.");
    } catch (e) {
      console.warn("Failed to queue offline action:", e);
    }
  };

  // Fetch initial data from persistent backend
  const refreshData = useCallback(async () => {
    if (isSandbox) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/data", {
        headers: getAuthHeaders(),
        credentials: "include"
      });
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
  }, [isSandbox]);

  useEffect(() => {
    if (isSandbox) {
      setTasks(SANDBOX_TASKS);
      setDocuments(SANDBOX_DOCUMENTS);
      setInvoices(SANDBOX_INVOICES);
      setNotices(SANDBOX_NOTICES);
      setDscTokens(SANDBOX_DSC_TOKENS);
      setClients(SANDBOX_CLIENTS);
      setGroups(SANDBOX_GROUPS);
      setAuditTrail(SANDBOX_AUDIT_TRAIL);
      setPayConfigs(SANDBOX_PAY_TO_RELEASE_CONFIGS as any);
      setIsLoading(false);
    } else {
      refreshData();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("online", flushOfflineQueue);
      return () => window.removeEventListener("online", flushOfflineQueue);
    }
  }, [isSandbox, refreshData, flushOfflineQueue]);

  // Create Task
  const createTask = async (taskData: Partial<ComplianceTask>) => {
    if (isSandbox) {
      const newTask: ComplianceTask = {
        id: `TSK-${Date.now().toString().slice(-4)}`,
        entityId: taskData.entityId || "CLI-APEX-01",
        entityName: taskData.entityName || "Apex AutoTech Private Limited",
        groupId: taskData.groupId || "GRP-APEX",
        category: taskData.category || "GST",
        title: taskData.title || "Statutory Return Filing",
        period: taskData.period || "Current Month",
        dueDate: taskData.dueDate || new Date().toISOString().split("T")[0],
        status: taskData.status || "IN_PREPARATION",
        assignedTo: taskData.assignedTo || "Kriti Jain (Article)",
        reviewedBy: taskData.reviewedBy || "CA Gunjan Jain",
        priority: taskData.priority || "HIGH",
        penaltyRisk: taskData.penaltyRisk || 5000,
        accruingDailyPenalty: taskData.accruingDailyPenalty || 50,
        missingDocumentsCount: 0,
        chaseCount: 0
      };
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queueOfflineAction("/api/tasks", "POST", taskData);
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
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
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    if (isSandbox) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queueOfflineAction("/api/tasks", "PATCH", { taskId, ...updates });
      return;
    }

    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
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
    actorName?: string;
  }) => {
    if (isSandbox) {
      const newDoc: DocumentItem = {
        id: `DOC-${Date.now().toString().slice(-4)}`,
        entityId: docData.entityId,
        entityName: docData.entityName,
        category: docData.category,
        fileName: docData.fileName,
        fileSize: docData.fileSize,
        financialYear: docData.financialYear,
        taskId: docData.taskId,
        uploadedAt: new Date().toISOString(),
        uploadedBy: docData.uploadedBy,
        isPasswordProtected: false,
        isUnlocked: true,
        reviewStatus: "PENDING_REVIEW"
      };
      setDocuments((prev) => [newDoc, ...prev]);
      return newDoc;
    }

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(docData),
      });
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
    }
  };

  // Review Document
  const reviewDocument = async (docId: string, reviewStatus: DocumentItem["reviewStatus"], reviewNotes?: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, reviewStatus, reviewNotes } : d))
    );

    if (isSandbox) return;

    try {
      await fetch("/api/documents", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
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
              clientPaymentMode: clientPaymentMode || "NEFT_RTGS",
              clientPaymentDate: new Date().toISOString().split("T")[0],
              clientPayerNote
            }
          : inv
      )
    );

    if (isSandbox) return;

    try {
      await fetch("/api/invoices", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          invoiceId,
          action: "SUBMIT_UTR",
          clientUtrNumber,
          clientPaymentMode,
          clientPayerNote,
          actorName
        }),
      });
      refreshData();
    } catch (err) {
      console.error("Failed to submit client UTR", err);
    }
  };

  // Reconcile Invoice (Partner action)
  const reconcileInvoice = async (invoiceId: string, reconciledBy?: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: "PAID",
              reconciledBy: reconciledBy || "CA Gunjan Jain (Partner)",
              reconciledAt: new Date().toISOString()
            }
          : inv
      )
    );

    if (isSandbox) return;

    try {
      await fetch("/api/invoices", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          invoiceId,
          action: "RECONCILE",
          reconciledBy
        }),
      });
      refreshData();
    } catch (err) {
      console.error("Failed to reconcile invoice", err);
    }
  };

  // Checkout DSC Token
  const checkoutDscToken = async (tokenId: string, staffName: string, purpose: string) => {
    setDscTokens((prev) =>
      prev.map((tok) =>
        tok.id === tokenId
          ? {
              ...tok,
              currentCustodian: staffName,
              checkedOutAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              checkedOutPurpose: purpose
            }
          : tok
      )
    );

    if (isSandbox) return;

    try {
      await fetch("/api/dsc", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          tokenId,
          action: "CHECKOUT",
          staffName,
          purpose
        }),
      });
      refreshData();
    } catch (err) {
      console.error("Failed to checkout DSC token", err);
    }
  };

  // Return DSC Token to Safe
  const returnDscToken = async (tokenId: string) => {
    setDscTokens((prev) =>
      prev.map((tok) =>
        tok.id === tokenId
          ? {
              ...tok,
              currentCustodian: "Firm Master Safe",
              checkedOutAt: undefined,
              checkedOutPurpose: undefined
            }
          : tok
      )
    );

    if (isSandbox) return;

    try {
      await fetch("/api/dsc", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          tokenId,
          action: "RETURN"
        }),
      });
      refreshData();
    } catch (err) {
      console.error("Failed to return DSC token", err);
    }
  };

  // Instant UPI Unlock (Pay-to-Release)
  const instantUpiUnlock = async (entityId: string, arg2?: string | number, arg3?: number) => {
    const utrRef = typeof arg2 === "string" ? arg2 : `UPI-${Date.now().toString().slice(-8)}`;
    const amount = typeof arg2 === "number" ? arg2 : (typeof arg3 === "number" ? arg3 : 0);

    setPayConfigs((prev) =>
      prev.map((c) =>
        c.entityId === entityId
          ? {
              ...c,
              isLocked: false,
              totalOutstandingAmount: Math.max(0, c.totalOutstandingAmount - amount),
              lockReason: `Fee cleared via UPI ${utrRef}`
            }
          : c
      )
    );

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.entityId === entityId && inv.status !== "PAID"
          ? { ...inv, status: "PAID", clientUtrNumber: utrRef }
          : inv
      )
    );

    if (isSandbox) return;

    try {
      await fetch("/api/pay-to-release", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          action: "INSTANT_PAYMENT_RELEASE",
          entityId,
          utrRef,
          amountPaid: amount,
          paymentMode: "UPI"
        })
      });
      refreshData();
    } catch (err) {
      console.error("Failed to process instant UPI unlock", err);
    }
  };

  // Create Client
  const createClient = async (clientData: Partial<ClientEntity>) => {
    if (isSandbox) {
      const newClient: ClientEntity = {
        id: `CLI-${Date.now().toString().slice(-4)}`,
        groupId: clientData.groupId || "GRP-NEW",
        groupName: clientData.groupName || `${clientData.name} Group`,
        name: clientData.name || "New Client Entity",
        type: clientData.type || "PVT_LTD",
        pan: clientData.pan || "AAACA1294F",
        turnoverCr: clientData.turnoverCr || 5.0,
        partnerInCharge: "CA Gunjan Jain",
        assignedArticle: "Kriti Jain (Article)",
        incorporationYear: 2024,
        penaltyRiskAccrued: 0,
        primaryContact: {
          name: clientData.primaryContact?.name || "Promoter",
          phone: clientData.primaryContact?.phone || "+91 98000 00000",
          email: clientData.primaryContact?.email || "director@client.com",
          designation: clientData.primaryContact?.designation || "Director"
        }
      };
      setClients((prev) => [newClient, ...prev]);
      return newClient;
    }

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
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

  // Update Client
  const updateClient = async (clientId: string, clientData: Partial<ClientEntity>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, ...clientData } : c))
    );

    try {
      const res = await fetch("/api/clients", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ id: clientId, ...clientData }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.client) {
          setClients((prev) =>
            prev.map((c) => (c.id === clientId ? json.client : c))
          );
          return json.client;
        }
      }
    } catch (err) {
      console.error("Failed to update client", err);
    }
  };

  // Delete / Archive Client
  const deleteClient = async (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));

    try {
      await fetch(`/api/clients?id=${clientId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include"
      });
    } catch (err) {
      console.error("Failed to delete client", err);
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
    updateClient,
    deleteClient,
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
