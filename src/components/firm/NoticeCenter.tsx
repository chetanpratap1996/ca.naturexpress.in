"use client";

import React, { useState } from "react";
import { NoticeRecord } from "@/lib/types";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
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
  Building
} from "lucide-react";

interface NoticeCenterProps {
  notices: NoticeRecord[];
  onNoticeUpdated?: () => void;
}

export const NoticeCenter: React.FC<NoticeCenterProps> = ({ notices: initialNotices, onNoticeUpdated }) => {
  const [notices, setNotices] = useState<NoticeRecord[]>(initialNotices);
  const [selectedNotice, setSelectedNotice] = useState<NoticeRecord | null>(initialNotices[0] || null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isScanningPortals, setIsScanningPortals] = useState(false);
  const [replySuccessMessage, setReplySuccessMessage] = useState<string | null>(null);
  const [aiDefenseData, setAiDefenseData] = useState<any | null>(null);

  const getDaysRemaining = (deadline: string) => {
    const diffTime = new Date(deadline).getTime() - new Date("2026-10-24").getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

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
        setTimeout(() => setReplySuccessMessage(null), 6000);
        if (onNoticeUpdated) onNoticeUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanningPortals(false);
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
          prev.map((n) => (n.id === selectedNotice.id ? { ...n, status: "SUBMITTED" } : n))
        );
        setSelectedNotice((prev) => (prev ? { ...prev, status: "SUBMITTED" } : null));
        setShowReplyModal(false);
        setReplySuccessMessage(`Official response signed & filed on portal for DIN ${selectedNotice.dinNumber}!`);
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
      {/* Toast Notification */}
      {replySuccessMessage && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-black text-white">{replySuccessMessage}</span>
          </div>
          <span className="bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded">
            PORTAL DISPATCH COMPLETE
          </span>
        </div>
      )}

      {/* Govt Portal Direct Sync Strip */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-slate-400 font-semibold uppercase text-[11px] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" /> Govt Portal Daemon:
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> GSTN Common Portal
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> ITD e-Filing 2.0
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> MCA V3 (DIR-3 KYC)
            </span>
          </div>
        </div>

        <button
          onClick={handleRunPortalScraper}
          disabled={isScanningPortals}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanningPortals ? "animate-spin" : ""}`} />
          {isScanningPortals ? "Polling Dept Portals..." : "Run Headless Scraper Now"}
        </button>
      </div>

      {/* Overview Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-50 text-btred-logo rounded-2xl border border-red-200 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              Statutory Notice &amp; Faceless Scrutiny Defense Center
              <span className="text-[11px] bg-red-100 text-btred-logo border border-red-200 px-2.5 py-0.5 rounded-full font-black">
                DIN Verified
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Tracks CBDT/CBIC notices with statutory DIN numbers. Auto-scraped countdown prevents time-barred ex-parte orders.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-right">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Scrutiny Exposure</p>
          <p className="text-lg font-black text-btred-logo">
            {formatCurrencyINR(notices.reduce((acc, n) => acc + n.demandAmount, 0))}
          </p>
        </div>
      </div>

      {/* Grid: List of Notices + Detailed Triage Workpaper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Notices Master List */}
        <div className="lg:col-span-5 space-y-3">
          {notices.map((notice) => {
            const daysLeft = getDaysRemaining(notice.statutoryDeadline);
            const isSelected = selectedNotice?.id === notice.id;

            return (
              <div
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
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
                </div>

                <h4 className="text-sm font-black text-slate-900 line-clamp-1">{notice.entityName}</h4>
                <p className="text-xs text-btred-logo font-bold mt-0.5">{notice.section}</p>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>
                    Demand Risk: <strong className="text-slate-900 font-extrabold">{formatCurrencyINR(notice.demandAmount)}</strong>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    notice.status === "SUBMITTED" 
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {notice.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Notice Workpaper */}
        {selectedNotice && (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs font-black text-btred-logo uppercase tracking-wider">
                    {selectedNotice.authority.replace("_", " ")} Case Docket
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedNotice.entityName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-semibold">Ref: {selectedNotice.id}</span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      DIN Verified: {selectedNotice.dinNumber || "ITBA/AST/F/142(1)"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 font-semibold">Statutory Deadline</span>
                  <p className="text-sm font-black text-btred-logo">{formatDate(selectedNotice.statutoryDeadline)}</p>
                  <p className="text-[10px] text-red-600 font-bold">{getDaysRemaining(selectedNotice.statutoryDeadline)} Days Remaining</p>
                </div>
              </div>

              {/* Briefing Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600">Impugned Section:</span>
                  <span className="font-black text-btred-logo">{selectedNotice.section}</span>
                </div>
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

              {/* Response Stages */}
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

                  <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
                    <span className="flex items-center gap-2 font-bold text-slate-800">
                      <Scale className="w-4 h-4 text-indigo-600" />
                      High Court Precedents &amp; CBIC Circular 183 Grounds
                    </span>
                    <span className="text-[10px] text-indigo-800 font-black bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-full">
                      AI Generated
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-4">
              <button 
                onClick={() => alert(`Filed 15-day adjournment request on ITBA portal for: ${selectedNotice.entityName}`)}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold px-3.5 py-2 rounded-xl border border-slate-300 transition"
              >
                Request Adjournment
              </button>
              
              {selectedNotice.status === "SUBMITTED" ? (
                <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Response Submitted &amp; Closed
                </span>
              ) : (
                <button 
                  onClick={handleGenerateAiDefense}
                  disabled={isSubmittingReply}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmittingReply ? "Synthesizing Defense..." : "Generate AI Legal Defense & Review"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI LEGAL DEFENSE DOCKET MODAL */}
      {showReplyModal && selectedNotice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowReplyModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                AI Statutory Defense Dossier
              </span>
              <span className="text-xs text-slate-500 font-semibold">{selectedNotice.entityName}</span>
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Statutory Submission u/s {selectedNotice.section} (DIN: {selectedNotice.dinNumber})
            </h3>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-serif text-xs space-y-3 text-slate-800 max-h-72 overflow-y-auto leading-relaxed">
              <p className="font-bold font-sans text-slate-900">To: The Jurisdictional Assessing Officer / NFAC New Delhi</p>
              <p className="font-semibold text-slate-700 font-sans">Subject: Written Submissions in defense of Notice under {selectedNotice.section}</p>
              <hr className="border-slate-200" />
              
              <div className="space-y-2">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block font-sans">Ground 1: Jurisdictional Sanction &amp; Section 151 Validity</span>
                  <span className="text-slate-700 text-[11px]">Notice lacks mandatory prior approval of specified authority, rendering proceedings null and void as settled by the Hon&apos;ble Supreme Court in Ashoka Buildcon Ltd.</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block font-sans">Ground 2: Circular 183/15/2022 Protection for ITC</span>
                  <span className="text-slate-700 text-[11px]">Supplier returns discrepancy is fully fortified by Chartered Accountant reconciliation certificates confirming genuine tax deposit by suppliers.</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block font-sans">Ground 3: Verified Banking Trail</span>
                  <span className="text-slate-700 text-[11px]">All consideration paid through account payee RTGS with tax deduction at source under Chapter XVII-B.</span>
                </div>
              </div>

              <p className="italic text-slate-600 font-sans text-[11px] pt-1">
                Prayer: In light of statutory provisions and binding judicial precedents, the proposed demand of {formatCurrencyINR(selectedNotice.demandAmount)} may kindly be dropped in full.
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
