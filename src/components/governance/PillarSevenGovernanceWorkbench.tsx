'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileCheck2, 
  Users, 
  KeyRound, 
  QrCode, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Download, 
  RefreshCw, 
  Send,
  Building,
  Lock,
  Unlock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  BulkUdinEngine, 
  SAMPLE_UDIN_ITEMS, 
  UdinCertificateItem, 
  UdinDocumentType 
} from '@/lib/governance/bulkUdinEngine';
import { 
  Sqc1PeerReviewEngine, 
  SAMPLE_WORKPAPERS, 
  SAMPLE_DECLARATIONS, 
  AuditWorkpaperItem, 
  IndependenceDeclaration 
} from '@/lib/governance/sqc1PeerReviewEngine';
import { 
  ArticleTrainingEngine, 
  SAMPLE_ARTICLES, 
  ArticleTraineeProfile 
} from '@/lib/governance/articleTrainingEngine';
import { 
  DscLockerEngine, 
  SAMPLE_DSC_TOKENS, 
  DscTokenItem 
} from '@/lib/governance/dscLockerEngine';

type ActiveTab = 'UDIN_GENERATOR' | 'SQC1_PEER_REVIEW' | 'ARTICLE_TRAINEE_DIARY' | 'DSC_SAFE_VAULT';

export default function PillarSevenGovernanceWorkbench() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('UDIN_GENERATOR');

  // UDIN state
  const [udinItems, setUdinItems] = useState<UdinCertificateItem[]>(SAMPLE_UDIN_ITEMS);
  const [selectedUdin, setSelectedUdin] = useState<UdinCertificateItem>(SAMPLE_UDIN_ITEMS[0]);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // SQC-1 Workpapers state
  const [workpapers, setWorkpapers] = useState<AuditWorkpaperItem[]>(SAMPLE_WORKPAPERS);
  const [declarations, setDeclarations] = useState<IndependenceDeclaration[]>(SAMPLE_DECLARATIONS);
  const [isPieClient, setIsPieClient] = useState(false);

  // Article state
  const [articles, setArticles] = useState<ArticleTraineeProfile[]>(SAMPLE_ARTICLES);
  const [selectedArticle, setSelectedArticle] = useState<ArticleTraineeProfile>(SAMPLE_ARTICLES[0]);

  // DSC Vault state
  const [tokens, setTokens] = useState<DscTokenItem[]>(SAMPLE_DSC_TOKENS);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedTokenForCheckout, setSelectedTokenForCheckout] = useState<DscTokenItem | null>(null);
  const [checkoutPurpose, setCheckoutPurpose] = useState('MCA V3 Form AOC-4 Filing');
  const [checkoutStaff, setCheckoutStaff] = useState('Rohit Sharma (Article)');

  // Handlers
  const handleBulkGenerateUdin = () => {
    setBulkGenerating(true);
    setTimeout(() => {
      const updated = udinItems.map(item => {
        if (!item.isUdinGenerated) {
          const udin = BulkUdinEngine.generateUdinNumber(item.caMemberRegNo, item.signingDate, item.documentType);
          return {
            ...item,
            udinNumber: udin,
            isUdinGenerated: true,
            generatedTimestamp: new Date().toISOString(),
            qrCodeVerificationPayload: `https://udin.icai.org/verify-udin?udin=${udin}&signDate=${item.signingDate}`,
            watermarkText: `CERTIFIED UNDER ICAI UDIN: ${udin} | DATED: ${item.signingDate}`
          };
        }
        return item;
      });
      setUdinItems(updated);
      setSelectedUdin(updated[1]);
      setBulkGenerating(false);
    }, 600);
  };

  const handleCheckoutSubmit = () => {
    if (!selectedTokenForCheckout) return;
    DscLockerEngine.checkoutToken(selectedTokenForCheckout, checkoutStaff, checkoutPurpose);
    setTokens([...tokens]);
    setCheckoutModalOpen(false);
    setSelectedTokenForCheckout(null);
  };

  const handleCheckin = (token: DscTokenItem) => {
    DscLockerEngine.checkinToken(token);
    setTokens([...tokens]);
  };

  // Computations
  const udinStats = BulkUdinEngine.evaluateUdinDeadlines(udinItems);
  const sqc1Health = Sqc1PeerReviewEngine.evaluateEngagementCompliance(workpapers, declarations, isPieClient);
  const articleForm108 = ArticleTrainingEngine.compileForm108Summary(selectedArticle);
  const dscVaultStats = DscLockerEngine.evaluateVaultStatus(tokens);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Pillar VII: Institutional Governance & Regulatory Shield
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              ICAI SQC-1 Peer Review, Bulk UDIN & Article Management
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              18-digit UDIN generator with 60-day statutory countdown & QR watermarking, SQC-1 Permanent & Current Audit Workpapers, 
              Regulation 48 Stipend & Reg 59 1/6th Leave Form 108 Diary, and 2-Factor Physical DSC Vault.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ICAI Gazette 192/2019 Certified
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('UDIN_GENERATOR')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'UDIN_GENERATOR'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Bulk UDIN & Watermarker ({udinStats.pendingCount} Pending)
          </button>

          <button
            onClick={() => setActiveTab('SQC1_PEER_REVIEW')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'SQC1_PEER_REVIEW'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            ICAI SQC-1 Peer Review Workpapers ({sqc1Health.completionPercentage}%)
          </button>

          <button
            onClick={() => setActiveTab('ARTICLE_TRAINEE_DIARY')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'ARTICLE_TRAINEE_DIARY'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Article Biometric, Stipend & Form 108
          </button>

          <button
            onClick={() => setActiveTab('DSC_SAFE_VAULT')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'DSC_SAFE_VAULT'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Physical DSC Token Vault ({dscVaultStats.checkedOut} Checked Out)
          </button>
        </div>
      </div>

      {/* TAB 1: BULK UDIN GENERATOR & WATERMARKER */}
      {activeTab === 'UDIN_GENERATOR' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-slate-400">Total Attest Documents</span>
              <p className="text-2xl font-bold text-white mt-1">{udinStats.totalItems}</p>
              <span className="text-xs text-slate-400">Statutory audit reports & certificates</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-emerald-400">UDINs Active & Generated</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{udinStats.generatedCount}</p>
              <span className="text-xs text-slate-400">ICAI 18-digit verified hash</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-amber-400">Pending 60-Day Countdown</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{udinStats.pendingCount}</p>
              <span className="text-xs text-slate-400">Within statutory window</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-rose-400">Deadline Breached</span>
              <p className="text-2xl font-bold text-rose-400 mt-1">{udinStats.breachedCount}</p>
              <span className="text-xs text-slate-400">&gt; 60 days from signing</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: UDIN List & Bulk Action */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">Attest Documents & UDIN Status</h3>
                  <p className="text-xs text-slate-400">Track 60-day deadline from signing date u/s ICAI Mandate</p>
                </div>
                {udinStats.pendingCount > 0 && (
                  <button
                    onClick={handleBulkGenerateUdin}
                    disabled={bulkGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${bulkGenerating ? 'animate-spin' : ''}`} />
                    {bulkGenerating ? 'Generating...' : 'Batch Generate UDINs'}
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-800 overflow-hidden">
                {udinItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedUdin(item)}
                    className={`p-3.5 rounded-lg cursor-pointer transition-all ${
                      selectedUdin.id === item.id 
                        ? 'bg-indigo-950/40 border border-indigo-500/40' 
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {item.id} • {item.documentType}
                        </span>
                        <h4 className="text-sm font-semibold text-white mt-1">{item.documentTitle}</h4>
                        <p className="text-xs text-slate-400">{item.clientName} ({item.clientPan})</p>
                      </div>

                      <div className="text-right">
                        {item.isUdinGenerated ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            <CheckCircle2 className="w-3 h-3" />
                            {item.udinNumber}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            <Clock className="w-3 h-3" />
                            {item.daysRemainingToGenerateUdin} Days Left
                          </span>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1">Signed: {item.signingDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Selected UDIN Watermark & Official Stamp Simulator */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  ICAI QR & Document Watermark Stamp
                </h3>
                <span className="text-xs font-mono text-slate-400">{selectedUdin.id}</span>
              </div>

              {selectedUdin.isUdinGenerated ? (
                <div className="space-y-4">
                  {/* Official Watermark Preview */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-700/80 relative overflow-hidden text-center space-y-3">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none rotate-[-25deg]">
                      <span className="text-3xl font-extrabold text-white tracking-widest uppercase">
                        ICAI UDIN VERIFIED
                      </span>
                    </div>

                    <div className="inline-block p-3 rounded-lg bg-white shadow-md mx-auto">
                      <div className="w-24 h-24 bg-slate-100 flex flex-col items-center justify-center border border-slate-300 rounded">
                        <QrCode className="w-16 h-16 text-slate-900" />
                        <span className="text-[8px] font-mono text-slate-600 mt-0.5">SCAN TO VERIFY</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">18-Digit Mandatory UDIN</span>
                      <p className="font-mono text-base font-bold text-indigo-400 tracking-wider">
                        {selectedUdin.udinNumber}
                      </p>
                      <p className="text-xs text-slate-300">
                        CA Member Reg No: <span className="font-semibold text-white">{selectedUdin.caMemberRegNo}</span>
                      </p>
                    </div>

                    <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded p-2 text-left">
                      {selectedUdin.watermarkText}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Signing Date:</span>
                      <span className="font-mono text-white">{selectedUdin.signingDate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">ICAI Portal URL:</span>
                      <a 
                        href={selectedUdin.qrCodeVerificationPayload} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline truncate max-w-[220px]"
                      >
                        {selectedUdin.qrCodeVerificationPayload}
                      </a>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Revocation Status:</span>
                      <span className="text-emerald-400 font-semibold">Active & Valid</span>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all">
                    <Download className="w-3.5 h-3.5" />
                    Download Watermarked Audit Report PDF
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">UDIN Not Yet Generated</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {selectedUdin.daysRemainingToGenerateUdin} days remaining out of statutory 60-day window under ICAI guidelines.
                  </p>
                  <button
                    onClick={() => {
                      const udin = BulkUdinEngine.generateUdinNumber(selectedUdin.caMemberRegNo, selectedUdin.signingDate, selectedUdin.documentType);
                      const updated = udinItems.map(item => item.id === selectedUdin.id ? {
                        ...item,
                        udinNumber: udin,
                        isUdinGenerated: true,
                        generatedTimestamp: new Date().toISOString(),
                        qrCodeVerificationPayload: `https://udin.icai.org/verify-udin?udin=${udin}&signDate=${item.signingDate}`,
                        watermarkText: `CERTIFIED UNDER ICAI UDIN: ${udin} | DATED: ${item.signingDate}`
                      } : item);
                      setUdinItems(updated);
                      setSelectedUdin(updated.find(u => u.id === selectedUdin.id)!);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate UDIN Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ICAI SQC-1 PEER REVIEW WORKPAPERS */}
      {activeTab === 'SQC1_PEER_REVIEW' && (
        <div className="space-y-6">
          {/* Peer Review Health Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs uppercase font-semibold text-indigo-400 tracking-wider">
                  SQC-1 Peer Review Readiness Score
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-3xl font-bold text-white">{sqc1Health.completionPercentage}%</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    sqc1Health.sqc1Compliant 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {sqc1Health.sqc1Compliant ? 'Peer Review Grade 1 Ready' : 'Incomplete Documentation'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Permanent Audit File (PAF): {sqc1Health.pafCompleteness}% • Current Audit File (CAF): {sqc1Health.cafCompleteness}%
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={isPieClient}
                    onChange={(e) => setIsPieClient(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Public Interest Entity (Mandatory EQCR)</span>
                </label>
              </div>
            </div>

            {sqc1Health.deficiencies.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                <span className="font-semibold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Actionable Deficiencies Before Signing Audit Report:
                </span>
                {sqc1Health.deficiencies.map((def, idx) => (
                  <p key={idx} className="text-slate-300 pl-5 list-disc">• {def}</p>
                ))}
              </div>
            )}
          </div>

          {/* Workpapers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Workpapers Table */}
            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Standardized Audit Workpapers Index (SA 230 Compliant)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Ref & Category</th>
                      <th className="py-2.5 px-3">Workpaper Name</th>
                      <th className="py-2.5 px-3">Standard</th>
                      <th className="py-2.5 px-3">Preparer / Reviewer</th>
                      <th className="py-2.5 px-3">EQCR</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {workpapers.map(wp => (
                      <tr key={wp.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            wp.category === 'PERMANENT_AUDIT_FILE' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {wp.code}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-white">{wp.title}</p>
                          {wp.documentEvidenceRef && (
                            <span className="text-[10px] text-slate-400 font-mono">Evidence: {wp.documentEvidenceRef}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-indigo-400">{wp.standardReference}</td>
                        <td className="py-2.5 px-3">
                          <p className="text-[11px] text-slate-300">{wp.preparer}</p>
                          <p className="text-[10px] text-slate-500">{wp.reviewer}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          {wp.eqcrSignOffRequired ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                              {wp.eqcrSignOffStatus}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300">
                            {wp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Code of Ethics Independence Declarations (Form 3 & 4) */}
            <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Independence Declarations (Form 3/4)
              </h3>
              <p className="text-xs text-slate-400">Section 141(3) Disqualification Safeguards</p>

              <div className="space-y-3">
                {declarations.map(dec => (
                  <div key={dec.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-semibold text-white">{dec.partnerOrStaffName}</h4>
                        <p className="text-[11px] text-slate-400">{dec.designation} • {dec.membershipOrRegistrationNo}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        {dec.declarationType}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>No direct/indirect securities held</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Indebtedness &lt; ₹5 Lakhs threshold</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>No prohibited business relations</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-400">
                      <span>Signed: {dec.signedDate}</span>
                      <span className="text-emerald-400 font-semibold">VERIFIED</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ARTICLE TRAINEE BIOMETRIC, STIPEND & FORM 108 */}
      {activeTab === 'ARTICLE_TRAINEE_DIARY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Article Roster */}
            <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Articled Assistants Directory
              </h3>

              <div className="divide-y divide-slate-800">
                {articles.map(art => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedArticle.id === art.id 
                        ? 'bg-indigo-950/40 border border-indigo-500/40' 
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{art.fullName}</h4>
                        <p className="text-xs text-slate-400">{art.registrationNumber}</p>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                        Year {art.currentYearOfTraining}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                      <span>Stipend: ₹{art.monthlyStipendPaid.toLocaleString('en-IN')}/m</span>
                      <span>Leaves: {art.totalLeaveTakenDays} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Selected Article Form 108 Training Audit */}
            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedArticle.fullName}</h3>
                  <p className="text-xs text-slate-400">
                    Reg No: {selectedArticle.registrationNumber} • Principal: {selectedArticle.principalName} ({selectedArticle.principalMemberNo})
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  {selectedArticle.articleshipScheme}
                </span>
              </div>

              {/* Regulation 48 & 59 Verification Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Regulation 48 Stipend */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-400">ICAI Reg 48 Stipend</span>
                    {articleForm108.stipendCompliance.isCompliant ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Deficit
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      ₹{selectedArticle.monthlyStipendPaid.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400">
                      / month (Min: ₹{articleForm108.stipendCompliance.mandatedMinimumStipend.toLocaleString('en-IN')})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{articleForm108.stipendCompliance.explanation}</p>
                </div>

                {/* Regulation 59 Leave Rule */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-slate-400">ICAI Reg 59 1/6th Leave Rule</span>
                    {articleForm108.leaveCompliance.isExcessLeave ? (
                      <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Extension Req.
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Within Limits
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {selectedArticle.totalLeaveTakenDays} Days
                    </span>
                    <span className="text-xs text-slate-400">
                      taken (Max allowed: {articleForm108.leaveCompliance.maxPermissibleLeaveDays} days)
                    </span>
                  </div>
                  {articleForm108.leaveCompliance.isExcessLeave ? (
                    <p className="text-[11px] text-rose-400 font-medium">
                      Excess leave: {articleForm108.leaveCompliance.excessLeaveDays} days. Training extended to {articleForm108.leaveCompliance.extendedCompletionDate}.
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-400 font-medium">
                      {articleForm108.leaveCompliance.maxPermissibleLeaveDays - selectedArticle.totalLeaveTakenDays} days remaining leave entitlement.
                    </p>
                  )}
                </div>
              </div>

              {/* Form 108 Work Experience Hours Log */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-white">Form 108 Practical Experience Distribution</h4>
                  <span className="text-xs font-mono text-indigo-400">Total: {articleForm108.totalHoursLogged} Hours</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 text-[10px]">Statutory Audit</span>
                    <p className="font-semibold text-white">{selectedArticle.workHoursBreakdown.statutoryAudit} hrs</p>
                    <span className="text-[10px] text-indigo-400">{articleForm108.categoryDistributionPct.statutoryAudit}% of total</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 text-[10px]">Tax Audit (44AB)</span>
                    <p className="font-semibold text-white">{selectedArticle.workHoursBreakdown.taxAudit44AB} hrs</p>
                    <span className="text-[10px] text-indigo-400">{articleForm108.categoryDistributionPct.taxAudit44AB}% of total</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 text-[10px]">GST Audit & Returns</span>
                    <p className="font-semibold text-white">{selectedArticle.workHoursBreakdown.gstComplianceAndAudit} hrs</p>
                    <span className="text-[10px] text-indigo-400">{articleForm108.categoryDistributionPct.gstComplianceAndAudit}% of total</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 text-[10px]">Direct Tax & ITRs</span>
                    <p className="font-semibold text-white">{selectedArticle.workHoursBreakdown.incomeTaxReturns} hrs</p>
                    <span className="text-[10px] text-indigo-400">{articleForm108.categoryDistributionPct.incomeTaxReturns}% of total</span>
                  </div>
                </div>
              </div>

              {/* Form 108 Discharge Action */}
              <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-300">Form 108 Discharge Status: </span>
                  {articleForm108.form108EligibleForDischarge ? (
                    <span className="text-xs font-semibold text-emerald-400">Ready for Principal Sign-off</span>
                  ) : (
                    <span className="text-xs font-semibold text-rose-400">Action Required Before Discharge</span>
                  )}
                </div>

                <button
                  disabled={!articleForm108.form108EligibleForDischarge}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-40"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Generate Form 108 Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PHYSICAL DSC USB TOKEN VAULT */}
      {activeTab === 'DSC_SAFE_VAULT' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-slate-400">Physical Tokens in Vault</span>
              <p className="text-2xl font-bold text-white mt-1">{dscVaultStats.inVault} / {dscVaultStats.totalTokens}</p>
              <span className="text-xs text-slate-400">In dual-key safe storage</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-blue-400">Checked Out (Active Signing)</span>
              <p className="text-2xl font-bold text-blue-400 mt-1">{dscVaultStats.checkedOut}</p>
              <span className="text-xs text-slate-400">Within 120-min window</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-rose-400">Return Overdue Tokens</span>
              <p className="text-2xl font-bold text-rose-400 mt-1">{dscVaultStats.overdue}</p>
              <span className="text-xs text-rose-400 font-semibold">&gt; 120 mins elapsed</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold uppercase text-amber-400">Expiring Soon (&lt; 30 Days)</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{dscVaultStats.expiringSoonCount}</p>
              <span className="text-xs text-slate-400">Renewal alert dispatched</span>
            </div>
          </div>

          {/* Tokens Locker Grid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  USB Cryptographic DSC Custody Ledger
                </h3>
                <p className="text-xs text-slate-400">Two-factor OTP verified checkout • Auto-overdue alert tracker</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tokens.map(tok => (
                <div
                  key={tok.id}
                  className={`p-4 rounded-xl border transition-all ${
                    tok.status === 'RETURN_OVERDUE'
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
                      : tok.status === 'CHECKED_OUT_FOR_SIGNING'
                      ? 'bg-blue-950/20 border-blue-500/40'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {tok.vaultSlot} • {tok.hardwareType}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{tok.ownerName}</h4>
                      <p className="text-xs text-slate-400">{tok.ownerDesignation} • {tok.entityName} ({tok.entityPan})</p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      tok.status === 'IN_SAFE_VAULT' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : tok.status === 'CHECKED_OUT_FOR_SIGNING'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        : tok.status === 'RETURN_OVERDUE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {tok.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Token S/N:</span>
                      <span className="font-mono text-white">{tok.tokenSerialNo}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Certificate Expiry:</span>
                      <span className={tok.daysToExpiry <= 30 ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                        {tok.certificateExpiryDate} ({tok.daysToExpiry} days left)
                      </span>
                    </div>

                    {tok.currentCheckout && (
                      <div className="p-2.5 rounded bg-slate-900/80 border border-slate-700/60 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Checked Out By:</span>
                          <span className="text-indigo-300 font-semibold">{tok.currentCheckout.checkedOutBy}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Statutory Purpose:</span>
                          <span className="text-slate-200">{tok.currentCheckout.purpose}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">OTP Sent To:</span>
                          <span className="font-mono text-emerald-400">{tok.currentCheckout.otpMobileNumberMasked}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-2 flex justify-end gap-2">
                    {tok.status === 'IN_SAFE_VAULT' ? (
                      <button
                        onClick={() => {
                          setSelectedTokenForCheckout(tok);
                          setCheckoutModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Authorize Checkout
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckin(tok)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Check Back into Vault
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Modal */}
          {checkoutModalOpen && selectedTokenForCheckout && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-indigo-400" />
                    DSC Token Checkout Authorization
                  </h3>
                  <button 
                    onClick={() => setCheckoutModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <p className="text-sm font-semibold text-white">{selectedTokenForCheckout.ownerName}</p>
                  <p className="text-xs text-slate-400">{selectedTokenForCheckout.entityName} • {selectedTokenForCheckout.vaultSlot}</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Staff / Article Handled By</label>
                    <input
                      type="text"
                      value={checkoutStaff}
                      onChange={(e) => setCheckoutStaff(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Statutory Portal Purpose</label>
                    <input
                      type="text"
                      value={checkoutPurpose}
                      onChange={(e) => setCheckoutPurpose(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 space-y-1">
                    <span className="font-semibold text-indigo-400">Two-Factor OTP Safeguard</span>
                    <p className="text-[11px] text-slate-300">
                      An automated 6-digit one-time password has been dispatched to the signatory registered mobile (+91 98*** **412).
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckoutSubmit}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Verify & Release Token
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
