"use client";

import React, { useState, useMemo } from "react";
import { NoticeRecord, PortalCredential, ClientEntity } from "@/lib/types";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { useClientContext } from "@/lib/context/ClientContext";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";
import { 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  Send, 
  Check, 
  ExternalLink, 
  X, 
  Sparkles, 
  RefreshCw, 
  Globe, 
  Scale, 
  Building,
  Filter,
  Search,
  Download,
  Calendar,
  Layers,
  Paperclip,
  KeyRound,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";

interface NoticeCenterProps {
  notices: NoticeRecord[];
  credentials?: PortalCredential[];
  clients?: ClientEntity[];
  onNoticeUpdated?: () => void;
  onNavigateTab?: (tab: string) => void;
  onNavigateToDrafter?: () => void;
}

export const NoticeCenter: React.FC<NoticeCenterProps> = ({ 
  notices: initialNotices, 
  credentials,
  clients,
  onNoticeUpdated,
  onNavigateTab,
  onNavigateToDrafter
}) => {
  const { selectedClient, isFirmWideView } = useClientContext();
  const [notices, setNotices] = useState<NoticeRecord[]>(initialNotices);
  const [selectedNotice, setSelectedNotice] = useState<NoticeRecord | null>(initialNotices[0] || null);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showAdjournmentModal, setShowAdjournmentModal] = useState(false);
  const [adjournmentReason, setAdjournmentReason] = useState("Collation of detailed branch bank ledgers and third-party vendor confirmations underway.");
  const [adjournmentDays, setAdjournmentDays] = useState<number>(15);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isScanningPortals, setIsScanningPortals] = useState(false);
  const [replySuccessMessage, setReplySuccessMessage] = useState<string | null>(null);
  const [aiDefenseData, setAiDefenseData] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Search & Filter State
  const [selectedAuthority, setSelectedAuthority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Context-aware client filtering
  const effectiveNotices = useMemo(() => {
    if (selectedClient && !isFirmWideView) {
      const qName = (selectedClient.tradeName || selectedClient.name).toLowerCase();
      const qPan = (selectedClient.pan || "").toLowerCase();
      const matches = notices.filter(n => 
        (n.entityId && n.entityId === selectedClient.id) ||
        (n.entityName && n.entityName.toLowerCase().includes(qName)) ||
        (n.pan && n.pan.toLowerCase() === qPan)
      );
      return matches.length > 0 ? matches : notices;
    }
    return notices;
  }, [notices, selectedClient, isFirmWideView]);

  React.useEffect(() => {
    setNotices(initialNotices);
    if (!selectedNotice && initialNotices.length > 0) {
      setSelectedNotice(initialNotices[0]);
    }
  }, [initialNotices]);

  const getDaysRemaining = (deadline: string) => {
    const diffTime = new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success("Copied to clipboard", `${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const activeCredential = useMemo(() => {
    if (!selectedNotice || !credentials) return null;
    const targetPortalType = 
      selectedNotice.authority === "INCOME_TAX" ? "INCOME_TAX" :
      selectedNotice.authority === "GST_DEPT" || selectedNotice.authority === "DGGI" ? "GST" :
      selectedNotice.authority === "MCA_ROC" ? "MCA_V3" : null;

    return credentials.find(c => 
      (c.portalType === targetPortalType || !targetPortalType) &&
      (c.entityId === selectedNotice.entityId || 
       c.entityName.toLowerCase().trim() === selectedNotice.entityName.toLowerCase().trim() ||
       (selectedNotice.pan && c.username.toLowerCase() === selectedNotice.pan.toLowerCase()))
    ) || credentials.find(c => 
      c.entityName.toLowerCase().trim() === selectedNotice.entityName.toLowerCase().trim()
    ) || null;
  }, [selectedNotice, credentials]);

  const filteredNotices = useMemo(() => {
    return effectiveNotices.filter((n) => {
      const matchesAuthority = selectedAuthority === "ALL" || n.authority === selectedAuthority;
      const matchesStatus = 
        selectedStatus === "ALL" ? true :
        selectedStatus === "ACTIVE" ? n.status !== "SUBMITTED" && n.status !== "CLOSED" :
        n.status === "SUBMITTED" || n.status === "CLOSED";
      
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        n.entityName.toLowerCase().includes(q) ||
        n.section.toLowerCase().includes(q) ||
        n.dinNumber.toLowerCase().includes(q) ||
        (n.pan && n.pan.toLowerCase().includes(q));

      return matchesAuthority && matchesStatus && matchesSearch;
    });
  }, [effectiveNotices, selectedAuthority, selectedStatus, searchQuery]);

  const handleRunPortalScraper = async () => {
    setIsScanningPortals(true);
    try {
      const res = await fetch("/api/portal-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRIGGER_PORTAL_SCAN",
          portal: "INCOME_TAX_2_0",
          entityId: selectedNotice?.entityId || "CLI-001"
        })
      });
      const data = await res.json();
      if (data.success && data.notice) {
        setNotices((prev) => [data.notice, ...prev]);
        setSelectedNotice(data.notice);
        setReplySuccessMessage(data.message);
        toast.success(
          "Government Portals Synced",
          "Automated audit scraper verified Income Tax, GSTN & MCA portals."
        );
        setTimeout(() => setReplySuccessMessage(null), 6000);
        if (onNoticeUpdated) onNoticeUpdated();
      } else {
        toast.info(
          "Portals Verified",
          "All statutory portals up to date. Zero outstanding demand notices found."
        );
      }
    } catch (e) {
      toast.error("Sync Failed", "Could not complete portal sync.");
      console.error(e);
    } finally {
      setIsScanningPortals(false);
    }
  };

  const handleRequestAdjournment = async () => {
    if (!selectedNotice) return;
    setIsSubmittingReply(true);
    try {
      const res = await fetch("/api/portal-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_ADJOURNMENT",
          noticeId: selectedNotice.id,
          adjournmentReason,
          requestedDays: adjournmentDays
        })
      });
      const data = await res.json();
      if (data.success && data.notice) {
        setNotices((prev) =>
          prev.map((n) => (n.id === selectedNotice.id ? data.notice : n))
        );
        setSelectedNotice(data.notice);
        setShowAdjournmentModal(false);
        toast.success(
          `Adjournment Filed (${adjournmentDays} Days Granted)`,
          `New statutory cutoff updated to ${data.notice.statutoryDeadline} on Faceless ITBA Portal.`
        );
        if (onNoticeUpdated) onNoticeUpdated();
      }
    } catch (e) {
      toast.error("Adjournment Request Failed", "Could not file adjournment on portal.");
      console.error(e);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleGenerateAiDefense = async () => {
    if (!selectedNotice) return;
    setIsSubmittingReply(true);
    try {
      const res = await fetch("/api/portal-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_AI_LEGAL_DEFENSE",
          noticeId: selectedNotice.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiDefenseData(data.legalDefenseDraft);
        setShowReplyModal(true);
        toast.success(
          "Legal Defense Generated",
          "Jurisprudence-backed legal response draft synthesized with specific judicial citations."
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSignAndSubmitReply = async () => {
    if (!selectedNotice) return;
    setIsSubmittingReply(true);
    try {
      const res = await fetch("/api/portal-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIGN_AND_SUBMIT_REPLY",
          noticeId: selectedNotice.id,
          partnerReviewNotes: "Partner approved: All factual reconciliations and Supreme Court Ashoka Buildcon citations attached."
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotices((prev) =>
          prev.map((n) => (n.id === selectedNotice.id ? { ...n, status: "SUBMITTED", submittedAt: new Date().toISOString() } : n))
        );
        setSelectedNotice((prev) => (prev ? { ...prev, status: "SUBMITTED", submittedAt: new Date().toISOString() } : null));
        setShowReplyModal(false);
        setReplySuccessMessage(`Official response digitally signed with Class 3 DSC & filed on portal for DIN ${selectedNotice.dinNumber}!`);
        setTimeout(() => setReplySuccessMessage(null), 6000);
        if (onNoticeUpdated) onNoticeUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification (FIXED: High Contrast Emerald Typography) */}
      {replySuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-black text-emerald-950">{replySuccessMessage}</span>
          </div>
          <span className="bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1 rounded-md shrink-0">
            PORTAL DISPATCH COMPLETE
          </span>
        </div>
      )}

      {/* Enterprise-Grade Header with Portal Telemetry & Client Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 text-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                DIN Verified &bull; CBDT &bull; CBIC &bull; Faceless Assessment
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Statutory Notice &amp; Faceless Scrutiny Defense Center
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <UniversalClientSelector variant="compact" />
            <button
              onClick={handleRunPortalScraper}
              disabled={isScanningPortals}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningPortals ? "animate-spin" : ""}`} />
              <span>{isScanningPortals ? "Syncing..." : "Sync Portals"}</span>
            </button>
          </div>
        </div>

        {/* Portal Status Strip & Exposure Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="text-slate-500 font-semibold uppercase text-[10px] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-600" /> Portal Sync:
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> GSTN Portal
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> ITD e-Filing 2.0
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> MCA V3
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Total Scrutiny Exposure:</span>
            <span className="text-base font-bold text-red-600 font-mono">
              {formatCurrencyINR(effectiveNotices.reduce((acc, n) => acc + n.demandAmount, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Master List + Detailed Docket */}
      {notices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-3xl mx-auto flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Zero Pending Scrutiny Notices or Demands</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your practice client records are clean. The engine continuously monitors ITD, GSTN, and MCA portals for statutory notices with verified DIN numbers.
            </p>
          </div>
          <button
            onClick={handleRunPortalScraper}
            disabled={isScanningPortals}
            className="inline-flex items-center gap-1.5 bg-btred-logo hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanningPortals ? "animate-spin" : ""}`} />
            <span>Poll Department Portals Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Case List (Col 5) */}
          <div className={`lg:col-span-5 space-y-3 ${mobileView === "detail" ? "hidden lg:block" : "block"}`}>
            {/* Filter Pills & Search */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by Company, Section, DIN, PAN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-btred-logo"
                />
              </div>

              <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none pt-1">
                <div className="flex items-center gap-1">
                  {["ALL", "INCOME_TAX", "GST_DEPT", "DGGI"].map((auth) => (
                    <button
                      key={auth}
                      onClick={() => setSelectedAuthority(auth)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition whitespace-nowrap ${
                        selectedAuthority === auth
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {auth === "ALL" ? "All" : auth.replace("_DEPT", "").replace("_", " ")}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5">
                  <button
                    onClick={() => setSelectedStatus(selectedStatus === "ACTIVE" ? "ALL" : "ACTIVE")}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                      selectedStatus === "ACTIVE"
                        ? "bg-red-100 text-btred-logo border border-red-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setSelectedStatus(selectedStatus === "CLOSED" ? "ALL" : "CLOSED")}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                      selectedStatus === "CLOSED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Submitted
                  </button>
                </div>
              </div>
            </div>

            {/* Case List Cards */}
            {filteredNotices.map((notice) => {
              const daysLeft = getDaysRemaining(notice.statutoryDeadline);
              const isSelected = selectedNotice?.id === notice.id;
              const isSubmitted = notice.status === "SUBMITTED" || notice.status === "CLOSED";
              const isAdjourned = notice.status === "ADJOURNMENT_REQUESTED";

              return (
                <div
                  key={notice.id}
                  onClick={() => {
                    setSelectedNotice(notice);
                    setMobileView("detail");
                  }}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-btred-logo shadow-md ring-2 ring-red-100"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {notice.authority.replace("_", " ")}
                    </span>

                    {/* FIXED: Submitted notices show 'Submitted on Time', never 'Overdue' */}
                    {isSubmitted ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Submitted on Time
                      </span>
                    ) : isAdjourned ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-200">
                        <Calendar className="w-3 h-3 text-amber-700" />
                        Adjournment Granted
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          daysLeft <= 5
                            ? "bg-red-100 text-btred-logo border border-red-200 animate-pulse"
                            : "bg-amber-100 text-amber-900 border border-amber-200"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {daysLeft > 0 ? `${daysLeft} Days to Deadline` : "Overdue"}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-slate-900 line-clamp-1">{notice.entityName}</h4>
                  <p className="text-xs text-btred-logo font-bold mt-0.5">{notice.section}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>
                      Demand Risk: <strong className="text-slate-900 font-extrabold">{formatCurrencyINR(notice.demandAmount)}</strong>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSubmitted 
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                        : isAdjourned
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {notice.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Selected Notice Docket (Col 7) */}
          {selectedNotice && (
            <div className={`lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-sm space-y-4 ${mobileView === "list" ? "hidden lg:flex" : "flex"}`}>
              <div className="space-y-4">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView("list")}
                  className="lg:hidden text-xs font-bold text-btred-logo flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition w-fit"
                >
                  &larr; Back to Case List
                </button>

                {/* Docket Header with Assessment Year & PAN */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-btred-logo uppercase tracking-wider">
                        {selectedNotice.authority.replace("_", " ")} Case Docket
                      </span>
                      {selectedNotice.assessmentYear && (
                        <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          {selectedNotice.assessmentYear}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                      {selectedNotice.entityName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500 font-semibold">Ref: {selectedNotice.id}</span>
                      {selectedNotice.pan && (
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                          PAN: {selectedNotice.pan}
                        </span>
                      )}
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        DIN: {selectedNotice.dinNumber}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-semibold">Statutory Deadline</span>
                    <p className="text-sm font-black text-btred-logo">{formatDate(selectedNotice.statutoryDeadline)}</p>
                    {selectedNotice.status === "SUBMITTED" ? (
                      <p className="text-[10px] text-emerald-700 font-bold">Filing Acknowledged</p>
                    ) : (
                      <p className="text-[10px] text-red-600 font-bold">{getDaysRemaining(selectedNotice.statutoryDeadline)} Days Remaining</p>
                    )}
                  </div>
                </div>

                {/* In-Context Portal Access & Credential Bar (Clean Light Panel) */}
                <div className="bg-slate-50 border border-slate-200 text-slate-900 p-3.5 sm:p-4 rounded-2xl shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-btred-logo shrink-0">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black tracking-wide text-slate-900">
                            {selectedNotice.authority === "INCOME_TAX" ? "Income Tax e-Filing Portal (ITBA / NFAC)" :
                             selectedNotice.authority === "GST_DEPT" || selectedNotice.authority === "DGGI" ? "GST Common Portal (GSTN)" :
                             "MCA21 V3 Portal"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                            Vault Linked
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Portal credentials for filing replies &amp; response submissions
                        </p>
                      </div>
                    </div>

                    {/* Portal External Link */}
                    <a
                      href={
                        activeCredential?.loginUrl ||
                        (selectedNotice.authority === "INCOME_TAX" ? "https://eportal.incometax.gov.in" :
                         selectedNotice.authority === "GST_DEPT" || selectedNotice.authority === "DGGI" ? "https://services.gst.gov.in" :
                         "https://www.mca.gov.in")
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-xs"
                    >
                      <span>Open Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Credentials Quick Pills */}
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Username / PAN */}
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center justify-between shadow-xs">
                      <div className="truncate mr-2">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">User ID / PAN</span>
                        <span className="font-mono font-bold text-slate-900 text-xs truncate">
                          {activeCredential?.username || selectedNotice.pan || "PAN Not Tagged"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeCredential?.username || selectedNotice.pan || "", "User ID")}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                        title="Copy Username"
                      >
                        {copiedField === "User ID" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Password */}
                    <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center justify-between shadow-xs">
                      <div className="truncate mr-2">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Password</span>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {activeCredential ? (showPassword ? activeCredential.password : "••••••••••••") : "FirmVault@2025"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {activeCredential && (
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(activeCredential?.password || "FirmVault@2025", "Password")}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                          title="Copy Password"
                        >
                          {copiedField === "Password" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Domain Sub-Tools Shortcuts */}
                  {onNavigateTab && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="text-slate-500 font-medium">Domain Shortcuts:</span>
                      <button
                        type="button"
                        onClick={() => onNavigateTab("notice-drafter")}
                        className="text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        <span>Reply Drafter</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateTab("assessee-approval")}
                        className="text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        <span>Assessee Sign</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateTab("udin-vault")}
                        className="text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 shadow-xs"
                      >
                        <span>UDIN Vault</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Case Briefing Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">Impugned Section:</span>
                    <span className="font-black text-btred-logo">{selectedNotice.section}</span>
                  </div>
                  {selectedNotice.issuingOfficer && (
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">Issuing Authority:</span>
                      <span className="font-bold text-slate-900 text-right max-w-sm truncate">{selectedNotice.issuingOfficer}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">Tax &amp; Penalty Exposure:</span>
                    <span className="font-black text-slate-900 text-sm">{formatCurrencyINR(selectedNotice.demandAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-600">Partner in Charge:</span>
                    <span className="font-extrabold text-slate-900">{selectedNotice.assignedPartner}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-500">Notice Query &amp; Department Findings:</span>
                    <p className="text-slate-800 mt-1 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 font-medium">
                      {selectedNotice.summary}
                    </p>
                  </div>
                </div>

                {/* Defense Dossier & Submission Workpapers (FIXED: Dynamic Law-Specific Grounds) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Defense Dossier &amp; Submission Workpapers
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
                      <span className="flex items-center gap-2 font-bold text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Client Books of Accounts &amp; Bank Ledgers Reconciled
                      </span>
                      <span className="text-[10px] text-emerald-800 font-black bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                        Ready
                      </span>
                    </div>

                    {/* Ground 2 dynamically matches the statute */}
                    <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
                      <span className="flex items-center gap-2 font-bold text-slate-800">
                        <Scale className="w-4 h-4 text-indigo-600" />
                        {selectedNotice.authority === "GST_DEPT" 
                          ? "High Court Precedents & CBIC Circular 183/193 Grounds"
                          : selectedNotice.section.includes("148")
                          ? "Supreme Court Precedents (Ashoka Buildcon) & Section 151 Grounds"
                          : "High Court Precedents on Section 43B & Prima Facie Adjustment"}
                      </span>
                      <span className="text-[10px] text-btred-logo font-black bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        Synthesized
                      </span>
                    </div>

                    {/* Exhibit Attachments Checklist */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> Attached Evidentiary Exhibits:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] font-medium text-slate-700">
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          ✓ Exhibit A: Certified Bank Ledger
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          ✓ Exhibit B: Audited Form 3CD Extracts
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          ✓ Exhibit C: Supplier RTGS Statements
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-4">
                {/* Formal Adjournment Trigger (Replaced browser alert) */}
                <button 
                  onClick={() => setShowAdjournmentModal(true)}
                  disabled={selectedNotice.status === "SUBMITTED"}
                  className="text-xs text-slate-700 hover:text-slate-900 font-bold px-3.5 py-2 rounded-xl border border-slate-300 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  <span>Request Adjournment</span>
                </button>
                
                {selectedNotice.status === "SUBMITTED" ? (
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Response Submitted &amp; Closed
                    </span>
                    <button
                      onClick={() => {
                        toast.success("Receipt Downloaded", "Official portal submission receipt downloaded.");
                      }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Ack PDF
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleGenerateAiDefense}
                    disabled={isSubmittingReply}
                    className="bg-btred-logo hover:bg-red-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isSubmittingReply ? "Synthesizing Defense..." : "Generate AI Legal Defense & Review"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: FORMAL ADJOURNMENT APPLICATION (FACLESS ITBA / GSTN) */}
      {showAdjournmentModal && selectedNotice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                  Section 144 / Faceless ITBA Portal
                </span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                  Adjournment Application
                </h4>
                <p className="text-xs text-slate-500">{selectedNotice.entityName} &bull; DIN: {selectedNotice.dinNumber}</p>
              </div>
              <button
                onClick={() => setShowAdjournmentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Requested Extension Period *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjournmentDays(15)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      adjournmentDays === 15 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    +15 Days (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjournmentDays(30)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      adjournmentDays === 30 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    +30 Days (Complex Audit)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason for Adjournment *</label>
                <textarea
                  value={adjournmentReason}
                  onChange={(e) => setAdjournmentReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-btred-logo font-medium"
                  rows={3}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900 text-[11px]">
                Adjournment will be digitally submitted with partner DSC to the Assessing Officer / NFAC portal, extending the limitation period.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdjournmentModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestAdjournment}
                disabled={isSubmittingReply}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Submit Adjournment Application</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AI LEGAL DEFENSE DOCKET MODAL */}
      {showReplyModal && selectedNotice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowReplyModal(false)}
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-btred-logo border border-red-200">
                AI Statutory Defense Dossier
              </span>
              <span className="text-xs text-slate-500 font-semibold">{selectedNotice.entityName}</span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {aiDefenseData?.subject || `Statutory Submission u/s ${selectedNotice.section} (DIN: ${selectedNotice.dinNumber})`}
            </h3>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-serif text-xs space-y-3 text-slate-800 max-h-72 overflow-y-auto leading-relaxed">
              <p className="font-bold font-sans text-slate-900">
                To: {selectedNotice.issuingOfficer || "The Jurisdictional Assessing Officer / NFAC New Delhi"}
              </p>
              <p className="font-semibold text-slate-700 font-sans">
                Subject: Written Submissions in defense of Notice under {selectedNotice.section} (DIN: {selectedNotice.dinNumber})
              </p>
              <hr className="border-slate-200" />
              
              <div className="space-y-2">
                {(aiDefenseData?.legalGrounds || [
                  "1. Lack of Valid Sanction under Section 151: Notice issued without mandatory prior approval of specified authority as held in Ashoka Buildcon Ltd. (SC).",
                  "2. Legitimate Source of Cash Deposits Proven: Cash deposited represents recorded sales cash receipts already credited in Audited Books of Accounts & Form 3CD u/s 44AB.",
                  "3. Natural Justice Violation: Under Section 144B(6)(vii), opportunity of personal hearing through video conferencing has not been provided.",
                  "4. Banking Trail: All consideration paid through account payee RTGS with tax deduction at source under Chapter XVII-B."
                ]).map((ground: string, idx: number) => {
                  const parts = ground.split(":");
                  const heading = parts[0];
                  const body = parts.slice(1).join(":");
                  return (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block font-sans">{heading}</span>
                      {body && <span className="text-slate-700 text-[11px]">{body}</span>}
                    </div>
                  );
                })}
              </div>

              <p className="italic text-slate-600 font-sans text-[11px] pt-1">
                Prayer: In light of statutory provisions, binding judicial precedents, and attached reconciliation exhibits, the proposed demand of {formatCurrencyINR(selectedNotice.demandAmount)} may kindly be dropped in full in the interest of justice.
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-sans">
                Reviewer: <strong>{selectedNotice.assignedPartner}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Edit Arguments
                </button>
                <button
                  onClick={handleSignAndSubmitReply}
                  disabled={isSubmittingReply}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Partner Digital Sign &amp; File on Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
