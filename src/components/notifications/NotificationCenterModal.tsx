"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  Settings, 
  Clock, 
  DollarSign, 
  FileText, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  X,
  CheckCheck,
  Send,
  Zap,
  Search,
  FileSpreadsheet,
  Lock,
  KeyRound,
  ArrowUpRight,
  MessageSquare,
  ChevronDown
} from "lucide-react";
import { NotificationItem, NotificationCategory, NotificationPreferences } from "@/lib/types";
import { 
  getStoredPreferences, 
  savePreferences, 
  playNotificationChime, 
  requestBrowserNotificationPermission,
  showBrowserNotification,
  dispatchClientNotification
} from "@/lib/notifications";
import { toast } from "@/components/shared/ToastNotification";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenClientBroadcaster?: () => void;
  currentUserRole?: string;
  clientEntityId?: string;
  clientName?: string;
}

type FilterCategory = "ALL" | "COMPLIANCE" | "NOTICE" | "DOCUMENT" | "BILLING" | "UDIN_SECURITY";

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenClientBroadcaster,
  currentUserRole = "PARTNER",
  clientEntityId,
  clientName,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<FilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(getStoredPreferences());
  const [isLoading, setIsLoading] = useState(false);
  const simMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (currentUserRole) params.set("role", currentUserRole);
      if (clientEntityId) params.set("clientEntityId", clientEntityId);
      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/notifications${queryStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch notifications:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      setShowSettings(false);
      setShowSimMenu(false);
      setSearchQuery("");
    }
  }, [isOpen, currentUserRole, clientEntityId]);

  // Real-time custom event listener
  useEffect(() => {
    const handleReceived = (e: any) => {
      if (e.detail) {
        setNotifications((prev) => [e.detail, ...prev]);
      }
    };
    window.addEventListener("bt_notification_received", handleReceived);
    return () => window.removeEventListener("bt_notification_received", handleReceived);
  }, []);

  // Close simulation menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (simMenuRef.current && !simMenuRef.current.contains(e.target as Node)) {
        setShowSimMenu(false);
      }
    };
    if (showSimMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSimMenu]);

  // Counts for clean tab labels
  const counts = useMemo(() => {
    const deadlines = notifications.filter((n) => n.category === "COMPLIANCE" && !n.isRead).length;
    const notices = notifications.filter((n) => n.category === "NOTICE" && !n.isRead).length;
    const docs = notifications.filter((n) => n.category === "DOCUMENT" && !n.isRead).length;
    const payments = notifications.filter((n) => n.category === "BILLING" && !n.isRead).length;
    const security = notifications.filter((n) => (n.category === "UDIN" || n.category === "SECURITY") && !n.isRead).length;
    const totalUnread = notifications.filter((n) => !n.isRead).length;
    return { all: totalUnread, deadlines, notices, docs, payments, security };
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Category filter
      if (activeCategoryFilter !== "ALL") {
        if (activeCategoryFilter === "UDIN_SECURITY") {
          if (n.category !== "UDIN" && n.category !== "SECURITY") return false;
        } else if (n.category !== activeCategoryFilter) {
          return false;
        }
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchMsg = n.message.toLowerCase().includes(q);
        const matchClient = n.metadata?.clientName?.toLowerCase().includes(q);
        const matchAct = n.metadata?.statutoryAct?.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg && !matchClient && !matchAct) return false;
      }
      return true;
    });
  }, [notifications, activeCategoryFilter, searchQuery]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_READ", id, clientEntityId, role: currentUserRole }),
      });
    } catch {}
  };

  const handleToggleRead = async (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    const updatedStatus = !item.isRead;
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: updatedStatus } : n))
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: updatedStatus ? "MARK_READ" : "MARK_UNREAD", 
          id: item.id, 
          clientEntityId, 
          role: currentUserRole 
        }),
      });
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All Read", "Marked all notifications as read.");
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_ALL_READ", clientEntityId, role: currentUserRole }),
      });
    } catch {}
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", id, clientEntityId, role: currentUserRole }),
      });
    } catch {}
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    if (item.targetTab && onNavigateTab) {
      onNavigateTab(item.targetTab);
      onClose();
    }
  };

  const handleSavePref = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    savePreferences(updated);
    if (key === "soundEnabled" && value) {
      playNotificationChime();
    }
  };

  const toggleSound = () => {
    const nextVal = !preferences.soundEnabled;
    handleSavePref("soundEnabled", nextVal);
    toast.info(nextVal ? "Chime On" : "Chime Muted", nextVal ? "Alert sound enabled" : "Alert sound muted");
  };

  // WhatsApp Chase to Client Promoter
  const handleWhatsAppChase = (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    const phone = item.metadata?.clientPhone || "+919820011223";
    const clientEntityName = item.metadata?.clientName || "Client";
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `*STATUTORY COMPLIANCE INTIMATION*\n\nDear ${clientEntityName},\n\nThis is an official communication from *GPA & Co., Chartered Accountants* regarding ${item.title}.\n\n${item.message}\n\nPlease take action or contact our office.\n\nGPA & Co., Chartered Accountants`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  };

  // Live Automated Practice Event Simulations
  const simulateInboundBankPdf = () => {
    playNotificationChime();
    const newNotif: NotificationItem = {
      id: `notif-sim-wa-${Date.now()}`,
      recipientRole: "PARTNER",
      title: "Inbound Bank Statement Decrypted (HDFC)",
      message: "Singhal Logistics uploaded encrypted statement via WhatsApp. Auto-decrypted using Entity DNA password (AABCU9821F); 14 vouchers mapped for Tally sync.",
      category: "DOCUMENT",
      priority: "NORMAL",
      targetTab: "bank-parser",
      actionUrl: "bank-parser",
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        clientName: "Singhal Logistics & Warehousing",
        clientPhone: "+91 98110 44212",
        entityId: "client-singhal",
        statutoryAct: "Bank Parser & Tally",
        actionLabel: "Post to Tally",
        badgeText: "Auto-Decrypted"
      }
    };
    setNotifications((prev) => [newNotif, ...prev]);
    toast.success("Bank Statement Decrypted", "14 bank vouchers generated for Singhal Logistics.");
    setShowSimMenu(false);
  };

  const simulateNfacNotice = () => {
    playNotificationChime();
    const newNotif: NotificationItem = {
      id: `notif-sim-notice-${Date.now()}`,
      recipientRole: "PARTNER",
      title: "Section 148 Reassessment Notice (NFAC)",
      message: "OmniRetail Hypermarkets received reassessment notice from NFAC Delhi. Alleged cash deposit discrepancy of ₹42,50,000. Statutory reply deadline: 19 days.",
      category: "NOTICE",
      priority: "CRITICAL",
      targetTab: "notices",
      actionUrl: "notices",
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        clientName: "OmniRetail Hypermarkets Private Limited",
        clientPhone: "+91 98110 44211",
        entityId: "client-omni",
        statutoryAct: "NFAC Section 148",
        actionLabel: "Open Defense Dossier",
        badgeText: "19 Days Left"
      }
    };
    setNotifications((prev) => [newNotif, ...prev]);
    toast.warning("Scrutiny Notice Detected", "Section 148 notice added for OmniRetail Hypermarkets.");
    setShowSimMenu(false);
  };

  const simulatePaymentReconciled = () => {
    playNotificationChime();
    const newNotif: NotificationItem = {
      id: `notif-sim-pay-${Date.now()}`,
      recipientRole: "PARTNER",
      title: "Payment Reconciled: ₹59,000 (UPI)",
      message: "Pratwi Solutions settled Invoice #GPA/2026-27/098 via UPI (UTR: AUTOUPI982341982). Pay-to-Release fee gate released signed reports.",
      category: "BILLING",
      priority: "HIGH",
      targetTab: "billing-matrix",
      actionUrl: "billing-matrix",
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        clientName: "Pratwi Solutions Private Limited",
        clientPhone: "8077170715",
        entityId: "client-pratwi",
        statutoryAct: "Pay-to-Release",
        actionLabel: "Unlock Deliverables",
        badgeText: "UTR Matched"
      }
    };
    setNotifications((prev) => [newNotif, ...prev]);
    toast.success("Payment Reconciled", "Signed deliverables released for Pratwi Solutions.");
    setShowSimMenu(false);
  };

  const simulateUdinMandate = () => {
    playNotificationChime();
    const newNotif: NotificationItem = {
      id: `notif-sim-udin-${Date.now()}`,
      recipientRole: "PARTNER",
      title: "UDIN 60-Day Mandate (8 Days Left)",
      message: "Form 3CD for Apex AutoTech was signed 52 days ago. Only 8 days remaining to register UDIN on ICAI portal before compliance default.",
      category: "UDIN",
      priority: "HIGH",
      targetTab: "udin-vault",
      actionUrl: "udin-vault",
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        clientName: "Apex AutoTech Private Limited",
        clientPhone: "+91 98200 11223",
        entityId: "client-apex",
        statutoryAct: "ICAI 60-Day Mandate",
        actionLabel: "Generate UDIN",
        badgeText: "Mandate Risk"
      }
    };
    setNotifications((prev) => [newNotif, ...prev]);
    toast.warning("UDIN Mandate Alert", "8 days remaining to register UDIN on ICAI portal.");
    setShowSimMenu(false);
  };

  const getCategoryDetails = (category: NotificationCategory) => {
    switch (category) {
      case "COMPLIANCE":
        return {
          icon: Clock,
          color: "text-amber-700 bg-amber-50 border-amber-200",
          domainLabel: "GST & Tax Deadline",
        };
      case "BILLING":
        return {
          icon: DollarSign,
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          domainLabel: "Fee Payment",
        };
      case "DOCUMENT":
        return {
          icon: FileText,
          color: "text-indigo-700 bg-indigo-50 border-indigo-200",
          domainLabel: "Bank & Vouchers",
        };
      case "NOTICE":
        return {
          icon: ShieldAlert,
          color: "text-rose-700 bg-rose-50 border-rose-200",
          domainLabel: "Department Notice",
        };
      case "UDIN":
        return {
          icon: KeyRound,
          color: "text-purple-700 bg-purple-50 border-purple-200",
          domainLabel: "UDIN Mandate",
        };
      case "SECURITY":
        return {
          icon: Lock,
          color: "text-sky-700 bg-sky-50 border-sky-200",
          domainLabel: "DSC Hardware",
        };
      default:
        return {
          icon: Bell,
          color: "text-slate-700 bg-slate-50 border-slate-200",
          domainLabel: "System",
        };
    }
  };

  const getTargetTabLabel = (targetTab?: string) => {
    if (!targetTab) return null;
    switch (targetTab) {
      case "gst-filing":
        return "Filing Desk";
      case "gstr2b":
        return "2B Matcher";
      case "gst-ims":
        return "IMS Desk";
      case "tasks-matrix":
        return "Task Center";
      case "notices":
        return "Notice Docket";
      case "notice-drafter":
        return "Reply Drafter";
      case "billing-matrix":
      case "billing":
        return "Billing Matrix";
      case "pay-to-release":
        return "Pay-to-Release";
      case "dsc":
        return "DSC Vault";
      case "bank-parser":
        return "Bank Parser";
      case "itr-matrix":
        return "ITR Matrix";
      case "udin-vault":
        return "UDIN Vault";
      case "progress":
        return "Compliance Progress";
      case "director-risk":
        return "Director Profile";
      default:
        return targetTab.replace(/[-_]/g, " ");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-5 lg:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header (Clean, untruncated, no clutter) */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-btred-logo text-white flex items-center justify-center relative shrink-0 shadow-md shadow-red-500/20">
              <Bell className="w-5 h-5" />
              {counts.all > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-btred-logo font-mono text-[9px] font-black flex items-center justify-center ring-2 ring-red-500">
                  {counts.all}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {currentUserRole === "CLIENT" ? "CA Firm Intimations" : "Compliance Notifications"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {currentUserRole === "CLIENT" 
                  ? "Statutory updates delivered by GPA & Co."
                  : "Statutory compliance alerts & practice updates"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Chime Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-xl transition border ${
                preferences.soundEnabled 
                  ? "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200" 
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
              title={preferences.soundEnabled ? "Mute Chime" : "Enable Chime"}
            >
              {preferences.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Event Simulator Dropdown */}
            {currentUserRole !== "CLIENT" && (
              <div className="relative" ref={simMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowSimMenu(!showSimMenu)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                  title="Simulate Real-Time Practice Events"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span className="hidden sm:inline">Simulate Event</span>
                  <ChevronDown className="w-3 h-3 text-amber-700" />
                </button>

                {showSimMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in slide-in-from-top-2 text-xs">
                    <button
                      type="button"
                      onClick={simulateInboundBankPdf}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-start gap-2 text-slate-800"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[11px]">Bank Statement (WhatsApp)</div>
                        <div className="text-[10px] text-slate-500">Auto-decrypts &amp; maps Tally vouchers</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={simulateNfacNotice}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-start gap-2 text-slate-800"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[11px]">Section 148 Notice (NFAC)</div>
                        <div className="text-[10px] text-slate-500">₹42.5L exposure &bull; 19 days remaining</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={simulatePaymentReconciled}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-start gap-2 text-slate-800"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[11px]">UPI Payment Reconciled</div>
                        <div className="text-[10px] text-slate-500">₹59k &bull; Pay-to-Release unlocks reports</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={simulateUdinMandate}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-start gap-2 text-slate-800"
                    >
                      <KeyRound className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[11px]">60-Day UDIN Mandate</div>
                        <div className="text-[10px] text-slate-500">8 days remaining for Form 3CD</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Outbound Dispatch Desk Button */}
            {currentUserRole !== "CLIENT" && onOpenClientBroadcaster && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenClientBroadcaster();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-btred-logo text-xs font-bold flex items-center gap-1.5 transition"
                title="Send Statutory Notice / Broadcast to Clients"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dispatch Desk</span>
              </button>
            )}

            {/* Settings Gear */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition border ${
                showSettings
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title="Alert Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Sub-Panel (Collapsible) */}
        {showSettings && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-3 animate-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                <span>Notification Preferences</span>
              </span>
              <button
                type="button"
                onClick={async () => {
                  const perm = await requestBrowserNotificationPermission();
                  if (perm === "granted") {
                    toast.success("Push Enabled", "Browser notifications are active.");
                  }
                }}
                className="text-[11px] text-btred-logo hover:underline font-bold"
              >
                Enable Browser Push
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-[11px] font-bold text-slate-800">Browser Web Push</div>
                  <div className="text-[10px] text-slate-500">System alerts on statutory triggers</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.browserPushEnabled}
                  onChange={(e) => handleSavePref("browserPushEnabled", e.target.checked)}
                  className="rounded text-btred-logo focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-[11px] font-bold text-slate-800">Audio Chime</div>
                  <div className="text-[10px] text-slate-500">Sound tone on incoming notifications</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={(e) => handleSavePref("soundEnabled", e.target.checked)}
                  className="rounded text-btred-logo focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-[11px] font-bold text-slate-800">Statutory Deadlines (72h)</div>
                  <div className="text-[10px] text-slate-500">GSTR-3B, Advance Tax &amp; ITR</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifyDeadlines}
                  onChange={(e) => handleSavePref("notifyDeadlines", e.target.checked)}
                  className="rounded text-btred-logo focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <div>
                  <div className="text-[11px] font-bold text-slate-800">Fee Payments &amp; UTR</div>
                  <div className="text-[10px] text-slate-500">Instant notification when client settles fee</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifyPayments}
                  onChange={(e) => handleSavePref("notifyPayments", e.target.checked)}
                  className="rounded text-btred-logo focus:ring-0"
                />
              </label>
            </div>
          </div>
        )}

        {/* Clean Filter Bar & Search (No overflowing slider, no duplicate radar bar) */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs shrink-0">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Clean Integrated Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                activeCategoryFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span>All</span>
              {counts.all > 0 && <span className="opacity-75 font-mono">({counts.all})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategoryFilter("COMPLIANCE")}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                activeCategoryFilter === "COMPLIANCE"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span>Deadlines</span>
              {counts.deadlines > 0 && <span className="opacity-75 font-mono">({counts.deadlines})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategoryFilter("NOTICE")}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                activeCategoryFilter === "NOTICE"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span>Notices</span>
              {counts.notices > 0 && <span className="opacity-75 font-mono">({counts.notices})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategoryFilter("DOCUMENT")}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                activeCategoryFilter === "DOCUMENT"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span>Docs</span>
              {counts.docs > 0 && <span className="opacity-75 font-mono">({counts.docs})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategoryFilter("BILLING")}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                activeCategoryFilter === "BILLING"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span>Payments</span>
              {counts.payments > 0 && <span className="opacity-75 font-mono">({counts.payments})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategoryFilter("UDIN_SECURITY")}
              className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 ${
                activeCategoryFilter === "UDIN_SECURITY"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span>UDIN/DSC</span>
              {counts.security > 0 && <span className="opacity-75 font-mono">({counts.security})</span>}
            </button>
          </div>
        </div>

        {/* Notification Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 sm:p-4 space-y-2 bg-slate-50/40">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <Check className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">All caught up!</p>
              <p className="text-[11px] text-slate-500">No unread statutory notifications in this tab.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const catDetails = getCategoryDetails(item.category);
              const tabLabel = getTargetTabLabel(item.targetTab);
              const IconComp = catDetails.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 rounded-2xl transition cursor-pointer border flex flex-col gap-2 relative group ${
                    item.isRead 
                      ? "bg-white border-slate-200/70 text-slate-700 hover:border-slate-300" 
                      : "bg-white border-red-200 shadow-2xs text-slate-900"
                  }`}
                >
                  {/* Card Header (One single clean category pill + timestamp + dismiss) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 shrink-0 ${catDetails.color}`}>
                        <IconComp className="w-3 h-3" />
                        <span>{catDetails.domainLabel}</span>
                      </span>

                      {item.metadata?.statutoryAct && (
                        <span className="text-[10px] text-slate-500 font-medium truncate">
                          &bull; {item.metadata.statutoryAct}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item.id)}
                        className="text-slate-300 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100 transition"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-btred-logo shrink-0" />
                      )}
                      <h3 className="font-bold text-xs text-slate-900 tracking-tight">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* 1-Click Action Footer */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {tabLabel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(item);
                          }}
                          className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 transition shadow-2xs"
                        >
                          <span>{item.metadata?.actionLabel || `Open ${tabLabel}`}</span>
                          <ArrowUpRight className="w-3 h-3 text-slate-300" />
                        </button>
                      )}

                      {currentUserRole !== "CLIENT" && item.metadata?.clientPhone && (
                        <button
                          type="button"
                          onClick={(e) => handleWhatsAppChase(e, item)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition"
                          title={`Chat with ${item.metadata?.clientName || "Client"} promoter`}
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleToggleRead(e, item)}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      title={item.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      <Check className={`w-3 h-3 ${item.isRead ? "text-emerald-500" : "text-slate-400"}`} />
                      <span>{item.isRead ? "Read" : "Mark Read"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Clean Footer (No robotic telemetry jargon) */}
        <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="text-[11px] font-semibold text-slate-600">
            GPA &amp; Co., Chartered Accountants
          </div>

          {counts.all > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
