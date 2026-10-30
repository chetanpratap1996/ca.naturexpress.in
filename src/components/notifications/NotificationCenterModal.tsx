"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  Settings, 
  Clock, 
  DollarSign, 
  FileText, 
  ShieldAlert, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  X,
  CheckCheck,
  AlertCircle,
  HelpCircle,
  Info
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
  currentUserRole?: string;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  currentUserRole = "PARTNER",
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"ALL" | NotificationCategory>("ALL");
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(getStoredPreferences());
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
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
    }
  }, [isOpen]);

  useEffect(() => {
    const handleReceived = (e: any) => {
      if (e.detail) {
        setNotifications((prev) => [e.detail, ...prev]);
      }
    };
    window.addEventListener("bt_notification_received", handleReceived);
    return () => window.removeEventListener("bt_notification_received", handleReceived);
  }, []);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeCategoryFilter === "ALL") return true;
    return n.category === activeCategoryFilter;
  });

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_READ", id }),
      });
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All Caught Up", "Marked all notifications as read.");
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_ALL_READ" }),
      });
    } catch {}
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", id }),
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

  const handleTestAlert = async () => {
    const perm = await requestBrowserNotificationPermission();
    playNotificationChime();

    const testItem: NotificationItem = {
      id: `TEST-${Date.now()}`,
      title: "Statutory Filing Verification Alert",
      message: "GSTR-3B filed successfully. Ack ARN: AA081026019284F verified under ICAI seal.",
      category: "COMPLIANCE",
      priority: "HIGH",
      targetTab: "calendar",
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    dispatchClientNotification(testItem);
    toast.success(
      "Test Notification Fired",
      perm === "granted"
        ? "Audio chime played + Native browser notification triggered!"
        : "Audio chime played! (Grant browser notification permission for system popups)"
    );
  };

  const handleSavePref = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    savePreferences(updated);
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "COMPLIANCE":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "BILLING":
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case "DOCUMENT":
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case "NOTICE":
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-btred-logo flex items-center justify-center relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-btred-logo text-white font-mono text-[9px] font-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Compliance Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-red-50 text-btred-logo border border-red-200 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} New
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Real-time alerts &bull; 100% Free Web Push</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition border ${
                showSettings
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title="Notification Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition border border-slate-200"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Sub-Panel */}
        {showSettings && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                <span>Zero-Cost Alert Preferences</span>
              </span>
              <button
                onClick={handleTestAlert}
                className="px-2.5 py-1 bg-btred-logo hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>Test Chime &amp; Push</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <span className="text-[11px] font-bold text-slate-700">Browser Web Push</span>
                <input
                  type="checkbox"
                  checked={preferences.browserPushEnabled}
                  onChange={(e) => handleSavePref("browserPushEnabled", e.target.checked)}
                  className="rounded text-btred-logo focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <span className="text-[11px] font-bold text-slate-700">Audio Chime</span>
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={(e) => handleSavePref("soundEnabled", e.target.checked)}
                  className="rounded text-btred-logo focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <span className="text-[11px] font-bold text-slate-700">Tax Deadlines</span>
                <input
                  type="checkbox"
                  checked={preferences.notifyDeadlines}
                  onChange={(e) => handleSavePref("notifyDeadlines", e.target.checked)}
                  className="rounded text-btred-logo focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <span className="text-[11px] font-bold text-slate-700">Fee Payments &amp; UTR</span>
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

        {/* Filter Bar & Fast Actions */}
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1 shrink-0">
            {(["ALL", "COMPLIANCE", "BILLING", "DOCUMENT", "NOTICE"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                  activeCategoryFilter === cat
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {cat === "ALL" ? "All" : cat === "COMPLIANCE" ? "Deadlines" : cat === "BILLING" ? "Payments" : cat === "DOCUMENT" ? "Docs" : "Notices"}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 shrink-0"
            >
              <CheckCheck className="w-3 h-3 text-emerald-600" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notification Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3 space-y-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Check className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-slate-700">You&apos;re completely up to date!</p>
              <p className="text-[11px] text-slate-600">No new alerts in this category.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3 rounded-2xl transition cursor-pointer flex items-start gap-3 text-xs group relative ${
                  item.isRead ? "bg-white hover:bg-slate-50 text-slate-700" : "bg-red-50/40 hover:bg-red-50/70 border border-red-100 text-slate-900 font-medium"
                }`}
              >
                <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 shadow-xs mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold truncate text-slate-900">{item.title}</span>
                    <span className="text-[9px] font-mono text-slate-600 shrink-0">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  {item.targetTab && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-btred-logo mt-1.5 hover:underline">
                      <span>View in {item.targetTab}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="absolute top-3 right-3 text-slate-600 hover:text-slate-800 p-1 transition"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">Realtime Push Active</span>
          </div>
          <button
            onClick={handleTestAlert}
            className="text-btred-logo hover:text-red-700 font-bold"
          >
            Send Test Alert
          </button>
        </div>
      </div>
    </div>
  );
};
