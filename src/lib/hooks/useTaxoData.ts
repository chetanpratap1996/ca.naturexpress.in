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
  PayToReleaseConfig,
  PortalCredential
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
  INITIAL_PAY_TO_RELEASE_CONFIGS,
  INITIAL_PORTAL_CREDENTIALS
} from "@/lib/data/firmDefaults";
import {
  SANDBOX_TASKS,
  SANDBOX_DOCUMENTS,
  SANDBOX_INVOICES,
  SANDBOX_NOTICES,
  SANDBOX_DSC_TOKENS,
  SANDBOX_CLIENTS,
  SANDBOX_GROUPS,
  SANDBOX_AUDIT_TRAIL,
  SANDBOX_PAY_TO_RELEASE_CONFIGS,
  SANDBOX_PORTAL_CREDENTIALS
} from "@/lib/data/sandboxData";
import { toast } from "@/components/shared/ToastNotification";
import { generateStatutoryTasksForClient } from "@/lib/statutoryTasks";

const OFFLINE_QUEUE_KEY = "bt_offline_mutation_queue";
const SWR_CACHE_KEY = "bt_taxodata_swr_v1";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("bt_enterprise_session_v4") || localStorage.getItem("bt_auth_user");
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
  const [portalCredentials, setPortalCredentials] = useState<PortalCredential[]>(isSandbox ? SANDBOX_PORTAL_CREDENTIALS : INITIAL_PORTAL_CREDENTIALS);
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

      const remainingQueue: Array<{ url: string; method: string; body: any }> = [];
      let syncedCount = 0;
      for (const item of queue) {
        try {
          const res = await fetch(item.url, {
            method: item.method,
            headers: getAuthHeaders(),
            credentials: "include",
            body: JSON.stringify(item.body),
          });
          if (res.ok) syncedCount++;
          else remainingQueue.push(item);
        } catch {
          remainingQueue.push(item);
        }
      }

      if (remainingQueue.length === 0) {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
        toast.success("Synchronized", `All ${syncedCount} offline changes saved to practice database.`);
      } else {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
        toast.warning("Partial Sync", `Synced ${syncedCount} items; ${remainingQueue.length} failed and remain queued.`);
      }
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
      if (res.status === 401) {
        setTasks([]);
        setDocuments([]);
        setInvoices([]);
        setNotices([]);
        setDscTokens([]);
        setPortalCredentials([]);
        setClients([]);
        setGroups([]);
        setAuditTrail([]);
        setPayConfigs([]);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTasks(json.data.tasks || []);
          setDocuments(json.data.documents || []);
          setInvoices(json.data.invoices || []);
          setNotices(json.data.notices || []);
          setDscTokens(json.data.dscTokens || []);
          setPortalCredentials(json.data.portalCredentials || []);
          setClients(json.data.clients || []);
          setGroups(json.data.groups || []);
          setAuditTrail(json.data.auditTrail || []);
          setPayConfigs(json.data.payToReleaseConfigs || []);
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem(SWR_CACHE_KEY, JSON.stringify(json.data));
            }
          } catch {}
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
      setPortalCredentials(SANDBOX_PORTAL_CREDENTIALS);
      setClients(SANDBOX_CLIENTS);
      setGroups(SANDBOX_GROUPS);
      setAuditTrail(SANDBOX_AUDIT_TRAIL);
      setPayConfigs(SANDBOX_PAY_TO_RELEASE_CONFIGS as any);
      setIsLoading(false);
    } else {
      // Instant Stale-While-Revalidate (SWR) hydration from local cache in <1ms
      try {
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(SWR_CACHE_KEY);
          if (cached) {
            const d = JSON.parse(cached);
            if (Array.isArray(d.tasks)) setTasks(d.tasks);
            if (Array.isArray(d.documents)) setDocuments(d.documents);
            if (Array.isArray(d.invoices)) setInvoices(d.invoices);
            if (Array.isArray(d.notices)) setNotices(d.notices);
            if (Array.isArray(d.dscTokens)) setDscTokens(d.dscTokens);
            if (Array.isArray(d.portalCredentials)) setPortalCredentials(d.portalCredentials);
            if (Array.isArray(d.clients)) setClients(d.clients);
            if (Array.isArray(d.groups)) setGroups(d.groups);
            if (Array.isArray(d.auditTrail)) setAuditTrail(d.auditTrail);
            if (Array.isArray(d.payToReleaseConfigs)) setPayConfigs(d.payToReleaseConfigs);
            setIsLoading(false);
          }
        }
      } catch {}
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
        entityId: taskData.entityId || "ddd33056-b6dc-46ca-b145-cd111045aff7",
        entityName: taskData.entityName || "Pratwi Solutions Private Limited",
        groupId: taskData.groupId || "157e58d9-cc53-4e5d-9497-ec6d2ecbf59a",
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
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Task Creation Failed", json.error || `HTTP ${res.status}`);
        throw new Error(json.error || "Failed to create task");
      }
      setTasks((prev) => [json.task, ...prev]);
      refreshData();
      return json.task;
    } catch (err) {
      console.error("Failed to create task", err);
      throw err;
    }
  };

  // Update Task (status, UDIN, chase)
  const updateTask = async (taskId: string, updates: Partial<ComplianceTask>) => {
    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    if (isSandbox) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queueOfflineAction("/api/tasks", "PATCH", { taskId, ...updates });
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ taskId, ...updates }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setTasks(previous);
        toast.error("Task Update Rejected", json.error || `HTTP ${res.status}`);
        return;
      }
      refreshData();
    } catch (err) {
      setTasks(previous);
      console.error("Failed to update task", err);
      toast.error("Task Update Failed", "Network error updating task.");
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        toast.error("Upload Rejected", json.error || `HTTP ${res.status}`);
        return undefined;
      }
      setDocuments((prev) => [json.document, ...prev]);
      refreshData();
      return json.document;
    } catch (err) {
      console.error("Failed to upload document", err);
      toast.error("Upload Failed", "Network error uploading document.");
    }
  };

  // Review Document
  const reviewDocument = async (docId: string, reviewStatus: DocumentItem["reviewStatus"], reviewNotes?: string) => {
    const previous = documents;
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, reviewStatus, reviewNotes } : d))
    );

    if (isSandbox) return;

    try {
      const res = await fetch("/api/documents", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ docId, reviewStatus, reviewNotes }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setDocuments(previous);
        toast.error("Document Review Rejected", json.error || `HTTP ${res.status}`);
        return;
      }
      refreshData();
    } catch (err) {
      setDocuments(previous);
      console.error("Failed to review document", err);
      toast.error("Review Failed", "Network error updating document review status.");
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
    const previous = invoices;
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
      const res = await fetch("/api/invoices", {
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setInvoices(previous);
        toast.error("UTR Submission Failed", json.error || `HTTP ${res.status}`);
        throw new Error(json.error || "Failed to submit UTR");
      }
      refreshData();
    } catch (err) {
      setInvoices(previous);
      console.error("Failed to submit client UTR", err);
      throw err;
    }
  };

  // Create Invoice (Partner action)
  const createInvoice = async (payload: Partial<InvoiceItem>): Promise<{ success: boolean; invoice?: InvoiceItem; error?: string }> => {
    if (isSandbox) {
      const mockInv: InvoiceItem = {
        id: `INV-${Date.now()}`,
        invoiceNo: payload.invoiceNo || `BT/2026-27/${invoices.length + 101}`,
        entityId: payload.entityId || clients[0]?.id || "",
        entityName: payload.entityName || clients[0]?.name || "Client Entity",
        groupId: payload.groupId || "",
        serviceDescription: payload.serviceDescription || "Professional Fee",
        taxableAmount: Number(payload.taxableAmount || 0),
        gstRate: Number(payload.gstRate || 18),
        gstAmount: Number(payload.gstAmount || 0),
        amount: Number(payload.amount || 0),
        dueDate: payload.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
        status: "PENDING",
        sacCode: payload.sacCode || "998231",
        financialYear: payload.financialYear,
      };
      setInvoices((prev) => [mockInv, ...prev]);
      return { success: true, invoice: mockInv };
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to create invoice (HTTP ${res.status}).` };
      }
      if (json.invoice) {
        setInvoices((prev) => [json.invoice, ...prev]);
      }
      refreshData();
      return { success: true, invoice: json.invoice };
    } catch (err: any) {
      console.error("Failed to create invoice", err);
      return { success: false, error: err?.message || "Network error creating invoice." };
    }
  };

  // Reconcile Invoice (Partner action)
  const reconcileInvoice = async (
    invoiceId: string,
    optionsOrBy?: string | { utr?: string; mode?: InvoiceItem["clientPaymentMode"]; note?: string; reconciledBy?: string }
  ) => {
    const opts = typeof optionsOrBy === "string" ? { reconciledBy: optionsOrBy } : optionsOrBy || {};
    const previous = invoices;
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: "PAID",
              clientUtrNumber: opts.utr || inv.clientUtrNumber,
              clientPaymentMode: opts.mode || inv.clientPaymentMode,
              clientPayerNote: opts.note || inv.clientPayerNote,
              reconciledBy: opts.reconciledBy || "Managing Partner",
              reconciledAt: new Date().toISOString()
            }
          : inv
      )
    );

    if (isSandbox) return;

    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          invoiceId,
          action: "RECONCILE",
          clientUtrNumber: opts.utr,
          clientPaymentMode: opts.mode,
          clientPayerNote: opts.note,
          reconciledBy: opts.reconciledBy
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setInvoices(previous);
        toast.error("Reconciliation Denied", json.error || `Only Managing Partners can mark invoices PAID (HTTP ${res.status}).`);
        return;
      }
      refreshData();
    } catch (err) {
      setInvoices(previous);
      console.error("Failed to reconcile invoice", err);
      toast.error("Reconciliation Failed", "Network error reconciling invoice.");
    }
  };

  // Checkout DSC Token
  const checkoutDscToken = async (tokenId: string, staffName: string, purpose: string) => {
    const previous = dscTokens;
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
      const res = await fetch("/api/dsc", {
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setDscTokens(previous);
        toast.error("DSC Checkout Failed", json.error || `HTTP ${res.status}`);
        return;
      }
      refreshData();
    } catch (err) {
      setDscTokens(previous);
      console.error("Failed to checkout DSC token", err);
    }
  };

  // Return DSC Token to Safe
  const returnDscToken = async (tokenId: string) => {
    const previous = dscTokens;
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
      const res = await fetch("/api/dsc", {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          tokenId,
          action: "RETURN"
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setDscTokens(previous);
        toast.error("DSC Return Failed", json.error || `HTTP ${res.status}`);
        return;
      }
      refreshData();
    } catch (err) {
      setDscTokens(previous);
      console.error("Failed to return DSC token", err);
    }
  };

  // Submit Client UTR for Partner Bank Verification (never self-marks PAID)
  const instantUpiUnlock = async (entityId: string, arg2?: string | number, arg3?: number) => {
    const utrRef = typeof arg2 === "string" && arg2.trim() ? arg2.trim() : "";
    const amount = typeof arg2 === "number" ? arg2 : (typeof arg3 === "number" ? arg3 : 0);

    if (!utrRef || !/^[A-Za-z0-9-]{6,40}$/.test(utrRef)) {
      throw new Error("A valid 6-40 character UPI/NEFT UTR reference is required for bank verification.");
    }

    if (isSandbox) return;

    const res = await fetch("/api/pay-to-release", {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        action: "SUBMIT_CLIENT_UTR",
        entityId,
        utrRef,
        amountPaid: amount,
        paymentMode: "UPI",
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Failed to submit payment UTR for verification.");
    }
    refreshData();
    return json;
  };

  // Create Client
  const createClient = async (clientData: Partial<ClientEntity> & Record<string, any>) => {
    if (isSandbox) {
      const newClient: ClientEntity = {
        id: `CLI-${Date.now().toString().slice(-4)}`,
        groupId: clientData.groupId || "GRP-NEW",
        groupName: clientData.groupName || `${clientData.name} Group`,
        name: clientData.name || "New Client Entity",
        tradeName: clientData.tradeName,
        type: clientData.type || "PVT_LTD",
        pan: clientData.pan || "AAACA1294F",
        gstin: clientData.gstin,
        gstFilingFrequency: clientData.gstFilingFrequency,
        onboardingMode: clientData.onboardingMode,
        onboardingChecklist: clientData.onboardingChecklist,
        gstHistory: clientData.gstHistory,
        cin: clientData.cin,
        tan: clientData.tan,
        turnoverCr: clientData.turnoverCr || 5.0,
        partnerInCharge: clientData.partnerInCharge || "CA Gunjan Jain",
        assignedArticle: clientData.assignedArticle || "Kriti Jain (Article)",
        incorporationYear: clientData.incorporationYear || 2024,
        penaltyRiskAccrued: 0,
        primaryContact: {
          name: clientData.primaryContact?.name || "Promoter",
          phone: clientData.primaryContact?.phone || "+91 98000 00000",
          email: clientData.primaryContact?.email || "director@client.com",
          designation: clientData.primaryContact?.designation || "Director"
        }
      };
      setClients((prev) => [newClient, ...prev]);
      const clientTasks = generateStatutoryTasksForClient(newClient);
      setTasks((prev) => [...clientTasks, ...prev]);
      return newClient;
    }

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(clientData),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success || !json.client) {
        throw new Error(json.error || `Failed to create client (HTTP ${res.status})`);
      }
      setClients((prev) => [json.client, ...prev]);
      refreshData();
      return json.client;
    } catch (err) {
      console.error("Failed to create client", err);
      throw err;
    }
  };

  // Update Client
  const updateClient = async (clientId: string, clientData: Partial<ClientEntity>) => {
    const previous = clients;
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success || !json.client) {
        setClients(previous);
        throw new Error(json.error || `Failed to update client (HTTP ${res.status})`);
      }
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? json.client : c))
      );
      return json.client;
    } catch (err) {
      setClients(previous);
      console.error("Failed to update client", err);
      throw err;
    }
  };

  // Delete / Archive Client
  const deleteClient = async (clientId: string) => {
    const previous = clients;
    setClients((prev) => prev.filter((c) => c.id !== clientId));

    try {
      const res = await fetch(`/api/clients?id=${clientId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include"
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setClients(previous);
        throw new Error(json.error || `Failed to delete client (HTTP ${res.status})`);
      }
    } catch (err) {
      setClients(previous);
      console.error("Failed to delete client", err);
      throw err;
    }
  };

  // Portal Credentials Management
  const createPortalCredential = async (credData: Partial<PortalCredential>) => {
    const tempId = `CRED-${Date.now()}`;
    const newCred: PortalCredential = {
      id: tempId,
      entityId: credData.entityId || "ENT-01",
      entityName: credData.entityName || "Practice Client",
      portalType: credData.portalType || "OTHER",
      portalName: credData.portalName || "Portal",
      loginUrl: credData.loginUrl,
      username: credData.username || "",
      password: credData.password || "",
      secondaryIdentifier: credData.secondaryIdentifier,
      registeredMobile: credData.registeredMobile,
      registeredEmail: credData.registeredEmail,
      tokenPin: credData.tokenPin,
      notes: credData.notes,
      lastVerifiedAt: new Date().toISOString(),
      lastChangedDate: new Date().toISOString().split("T")[0],
    };
    setPortalCredentials((prev) => [newCred, ...prev]);

    if (isSandbox) return newCred;

    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(credData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setPortalCredentials((prev) => prev.filter((c) => c.id !== tempId));
        toast.error("Save Credential Failed", data.error || `HTTP ${res.status}`);
        throw new Error(data.error || "Failed to save credential");
      }
      if (data.credential) {
        setPortalCredentials((prev) => prev.map((c) => (c.id === tempId ? data.credential : c)));
      }
      refreshData();
      return data.credential || newCred;
    } catch (err) {
      setPortalCredentials((prev) => prev.filter((c) => c.id !== tempId));
      console.error("Failed to create portal credential", err);
      throw err;
    }
  };

  const updatePortalCredential = async (credData: Partial<PortalCredential> & { id: string }) => {
    const previous = portalCredentials;
    setPortalCredentials((prev) =>
      prev.map((c) => (c.id === credData.id ? { ...c, ...credData, lastChangedDate: new Date().toISOString().split("T")[0] } : c))
    );

    if (isSandbox) return;

    try {
      const res = await fetch("/api/credentials", {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(credData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setPortalCredentials(previous);
        toast.error("Update Credential Failed", data.error || `HTTP ${res.status}`);
        return;
      }
      refreshData();
    } catch (err) {
      setPortalCredentials(previous);
      console.error("Failed to update credential", err);
    }
  };

  const deletePortalCredential = async (id: string) => {
    const previous = portalCredentials;
    setPortalCredentials((prev) => prev.filter((c) => c.id !== id));

    if (isSandbox) return;

    try {
      const res = await fetch(`/api/credentials?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setPortalCredentials(previous);
        toast.error("Delete Credential Failed", data.error || `HTTP ${res.status}`);
        return;
      }
      refreshData();
    } catch (err) {
      setPortalCredentials(previous);
      console.error("Failed to delete credential", err);
    }
  };

  const bulkImportCredentials = async (items: Partial<PortalCredential>[]) => {
    if (isSandbox) {
      const mapped = items.map((item, idx) => ({
        id: `SANDBOX-BULK-${Date.now()}-${idx}`,
        entityId: item.entityId || "ddd33056-b6dc-46ca-b145-cd111045aff7",
        entityName: item.entityName || "Pratwi Solutions Private Limited",
        portalType: item.portalType || "OTHER",
        portalName: item.portalName || "Govt Portal",
        loginUrl: item.loginUrl,
        username: item.username || "",
        password: item.password || "",
        secondaryIdentifier: item.secondaryIdentifier,
        registeredMobile: item.registeredMobile,
        registeredEmail: item.registeredEmail,
        tokenPin: item.tokenPin,
        notes: item.notes || "Imported batch",
        lastVerifiedAt: new Date().toISOString(),
        lastChangedDate: new Date().toISOString().split("T")[0],
      })) as PortalCredential[];
      setPortalCredentials((prev) => [...mapped, ...prev]);
      return { success: true, count: mapped.length };
    }

    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ bulk: true, items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Bulk import failed (HTTP ${res.status})`);
      }
      refreshData();
      return data;
    } catch (err) {
      console.error("Failed to bulk import credentials", err);
      throw err;
    }
  };

  const createDscToken = async (tokenData: Partial<DscRecord>) => {
    const tempId = `DSC-${Date.now()}`;
    const newToken: DscRecord = {
      id: tempId,
      entityId: tokenData.entityId || "ENT-01",
      entityName: tokenData.entityName || "Practice Client",
      groupId: tokenData.groupId || "GRP-001",
      holderName: tokenData.holderName || "Signatory",
      pan: tokenData.pan || "",
      serialNumber: tokenData.serialNumber || `USB-${Math.floor(1000 + Math.random() * 9000)}`,
      tokenType: tokenData.tokenType || "ePass2003",
      validTill: tokenData.validTill || new Date(Date.now() + 365*24*60*60*1000).toISOString().split("T")[0],
      daysToExpiry: 365,
      expiryStatus: "ACTIVE",
      currentCustodian: "Firm Master Safe",
      vaultSlot: tokenData.vaultSlot || "Cabinet A - Locker 01",
      tokenPin: tokenData.tokenPin,
    };
    setDscTokens((prev) => [newToken, ...prev]);

    if (isSandbox) return newToken;

    try {
      const res = await fetch("/api/dsc", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(tokenData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setDscTokens((prev) => prev.filter((t) => t.id !== tempId));
        toast.error("DSC Registration Failed", data.error || `HTTP ${res.status}`);
        throw new Error(data.error || "Failed to create DSC token");
      }
      refreshData();
      return data.token || newToken;
    } catch (err) {
      setDscTokens((prev) => prev.filter((t) => t.id !== tempId));
      console.error("Failed to create DSC token", err);
      throw err;
    }
  };

  const deleteDscToken = async (id: string) => {
    const previous = dscTokens;
    setDscTokens((prev) => prev.filter((t) => t.id !== id));

    if (isSandbox) return;

    try {
      const res = await fetch(`/api/dsc?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setDscTokens(previous);
        toast.error("DSC Delete Failed", data.error || `HTTP ${res.status}`);
        return;
      }
      refreshData();
    } catch (err) {
      setDscTokens(previous);
      console.error("Failed to delete DSC token", err);
    }
  };

  return {
    tasks,
    documents,
    invoices,
    notices,
    dscTokens,
    portalCredentials,
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
    createInvoice,
    reconcileInvoice,
    checkoutDscToken,
    returnDscToken,
    instantUpiUnlock,
    createPortalCredential,
    updatePortalCredential,
    deletePortalCredential,
    bulkImportCredentials,
    createDscToken,
    deleteDscToken,
  };
}
