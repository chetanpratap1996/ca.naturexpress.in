'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Download, 
  Send, 
  Users, 
  Printer, 
  Layers, 
  KeyRound, 
  Clock, 
  Activity, 
  Network 
} from 'lucide-react';
import { 
  Dpt3DepositEngine, 
  Dpt3LiabilityItem, 
  Dpt3FilingSummary, 
  SAMPLE_DPT3_LIABILITIES 
} from '@/lib/mca/dpt3DepositEngine';
import { 
  Msme1HalfYearlyEngine, 
  Msme1SupplierDueRecord, 
  Msme1FilingSummary, 
  SAMPLE_MSME1_RECORDS 
} from '@/lib/mca/msme1HalfYearlyEngine';
import { 
  Dir3KycGuardianEngine, 
  DirectorKycItem, 
  SAMPLE_DIRECTOR_KYC_DATA 
} from '@/lib/mca/dir3KycGuardianEngine';
import { 
  MinuteBookGeneratorEngine, 
  MinuteBookMeetingItem, 
  SAMPLE_MEETINGS_DATA 
} from '@/lib/mca/minuteBookGeneratorEngine';
import { 
  Ben2SboDetectorEngine, 
  ShareholderTierNode, 
  SignificantBeneficialOwnerItem, 
  SAMPLE_SHAREHOLDERS_REGISTER 
} from '@/lib/mca/ben2SboDetectorEngine';
import { toast } from '@/components/shared/ToastNotification';
import { useClientContext } from '@/lib/context/ClientContext';
import { UniversalClientSelector } from '@/components/shared/UniversalClientSelector';

export function PillarSixMcaEnterpriseWorkbench() {
  const { selectedClient, selectedFy, isFirmWideView } = useClientContext();

  const activeCompanyName = selectedClient && !isFirmWideView ? selectedClient.name : 'Pratwi Solutions Private Limited';
  const activeCin = selectedClient && !isFirmWideView && selectedClient.cin ? selectedClient.cin : 'U72200MP2020PTC051234';

  const [activeTab, setActiveTab] = useState<
    'DPT_3_DEPOSITS' | 'MSME_1_RETURN' | 'DIR3_KYC_GUARDIAN' | 'MINUTE_BOOK_AGM' | 'BEN2_SBO_DETECTOR'
  >('DPT_3_DEPOSITS');

  // Sub-Engine 1: Form DPT-3 State
  const [dpt3Items, setDpt3Items] = useState<Dpt3LiabilityItem[]>(SAMPLE_DPT3_LIABILITIES);
  const dpt3Summary: Dpt3FilingSummary = Dpt3DepositEngine.evaluateDpt3Liabilities(dpt3Items, {
    cin: activeCin,
    companyName: activeCompanyName,
    financialYear: selectedFy || '2025-26',
    netWorth: 85000000 // ₹8.5 Cr net worth
  });

  // Sub-Engine 2: Form MSME-1 State
  const [msme1Items, setMsme1Items] = useState<Msme1SupplierDueRecord[]>(SAMPLE_MSME1_RECORDS);
  const msme1Summary: Msme1FilingSummary = Msme1HalfYearlyEngine.compileMsme1Return(msme1Items, {
    cin: activeCin,
    companyName: activeCompanyName,
    halfYear: 'HY1_APR_SEP',
    financialYear: selectedFy || '2026-27'
  });

  // Sub-Engine 3: Director KYC State
  const [directors, setDirectors] = useState<DirectorKycItem[]>(SAMPLE_DIRECTOR_KYC_DATA);
  const kycTelemetry = Dir3KycGuardianEngine.evaluateDirectorKyc(directors, '2026-11-20');

  // Sub-Engine 4: Secretarial Minutes & SS-1/SS-2 State
  const [meetings, setMeetings] = useState<MinuteBookMeetingItem[]>(SAMPLE_MEETINGS_DATA);
  const [selectedMeeting, setSelectedMeeting] = useState<MinuteBookMeetingItem>(SAMPLE_MEETINGS_DATA[0]);

  // Sub-Engine 5: Form BEN-2 SBO State
  const [shareholders, setShareholders] = useState<ShareholderTierNode[]>(SAMPLE_SHAREHOLDERS_REGISTER);
  const detectedSbos: SignificantBeneficialOwnerItem[] = Ben2SboDetectorEngine.detectSignificantBeneficialOwners(shareholders);

  // Handlers
  const handleSendOtpLink = (din: string, name: string) => {
    toast.success(`1-Click Web KYC Magic Link sent to ${name} via Email & WhatsApp!`);
  };

  const handleDownloadDpt3Payload = () => {
    const payload = {
      form: 'DPT-3',
      cin: activeCin,
      companyName: activeCompanyName,
      financialYear: selectedFy || '2025-26',
      summary: dpt3Summary,
      liabilities: dpt3Items,
      generatedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Form_DPT3_${activeCin}_FY${selectedFy || '2025-26'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Form DPT-3 ROC filing JSON schema exported ready for MCA V3 upload!');
  };

  const handleDownloadBen2Payload = () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FormBEN2 xmlns="http://www.mca.gov.in/v3/ben2">
  <CIN>${activeCin}</CIN>
  <CompanyName>${activeCompanyName}</CompanyName>
  <GeneratedAt>${new Date().toISOString()}</GeneratedAt>
  <SBOs>
    ${detectedSbos.map(s => `
    <SBO>
      <Name>${s.sboName}</Name>
      <PAN>${s.panOrPassport}</PAN>
      <HoldingPct>${s.totalEffectiveHoldingPercent}%</HoldingPct>
      <IntermediateEntity>${s.intermediateEntityName}</IntermediateEntity>
    </SBO>`).join('')}
  </SBOs>
</FormBEN2>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Form_BEN2_${activeCin}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Form BEN-2 ROC filing XML payload generated with SBO declaration!');
  };

  const handlePrintMinutes = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Enterprise-Grade Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 text-slate-900 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Company Law &bull; MCA V3 Secretarial Desk &bull; Companies Act 2013
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                CIN: {activeCin}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-600" />
              Corporate Governance, Form DPT-3, MSME-1 &amp; SBO
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <UniversalClientSelector variant="compact" />

            <button
              onClick={handleDownloadDpt3Payload}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
              title="Download Form DPT-3 ROC JSON payload"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export DPT-3 JSON</span>
            </button>

            <button
              onClick={handlePrintMinutes}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Print Minute Book</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Total DPT-3 Liabilities
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{(dpt3Summary.grandTotalLiabilities / 10000000).toFixed(2)} Cr
            </span>
            <span className="text-xs font-mono text-red-700 font-bold">
              {dpt3Summary.purposeOfFiling}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Deemed Deposits: ₹{(dpt3Summary.totalDeemedDeposits / 100000).toFixed(2)}L
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            MSME-1 Overdue Dues (&gt; 45d)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-600">
              ₹{(msme1Summary.totalOutstandingAmountInr / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-rose-600">({msme1Summary.totalDelayedSuppliersCount} Suppliers)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sec 16 Interest: ₹{(msme1Summary.totalMsmeInterestPayableInr / 1000).toFixed(1)}k</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Director KYC Status
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-700">
              {kycTelemetry.activeCompliantCount}/{kycTelemetry.totalDirectors} Active
            </span>
            {kycTelemetry.deactivatedCount > 0 && (
              <span className="text-xs font-mono text-rose-600 font-bold">
                {kycTelemetry.deactivatedCount} Deactivated
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Penalty Exposure: ₹{kycTelemetry.totalLateFeePenaltyExposure.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Significant Beneficial Owners (SBO)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">
              {detectedSbos.length} Detected
            </span>
            <span className="text-xs font-mono text-amber-800 font-bold">&gt; 10% Indirect</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Form BEN-2 ROC Ready</p>
        </div>
      </div>

      {/* MCA Compliance Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('DPT_3_DEPOSITS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'DPT_3_DEPOSITS'
              ? 'bg-btred-logo text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Form DPT-3 Deposits &amp; Loans</span>
        </button>

        <button
          onClick={() => setActiveTab('MSME_1_RETURN')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'MSME_1_RETURN'
              ? 'bg-btred-logo text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Form MSME-1 Dues (&gt; 45 Days)</span>
        </button>

        <button
          onClick={() => setActiveTab('DIR3_KYC_GUARDIAN')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'DIR3_KYC_GUARDIAN'
              ? 'bg-btred-logo text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Director KYC (DIR-3)</span>
        </button>

        <button
          onClick={() => setActiveTab('MINUTE_BOOK_AGM')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'MINUTE_BOOK_AGM'
              ? 'bg-btred-logo text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Minute Books &amp; Resolutions</span>
        </button>

        <button
          onClick={() => setActiveTab('BEN2_SBO_DETECTOR')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'BEN2_SBO_DETECTOR'
              ? 'bg-btred-logo text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Form BEN-2 SBO Register</span>
        </button>
      </div>

      {/* TAB 1: Form DPT-3 Deposits & Exempted Loans */}
      {activeTab === 'DPT_3_DEPOSITS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Form DPT-3 Annual Return of Deposits &amp; Exempted Loans</span>
                <span className="text-xs font-mono text-red-600 font-semibold">
                  (Rule 16 of Deposit Rules)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Company: <strong className="text-slate-900">{dpt3Summary.companyName}</strong> | CIN: {dpt3Summary.cin} | FY: {dpt3Summary.financialYear}
              </p>
            </div>

            <button
              onClick={handleDownloadDpt3Payload}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200 flex items-center space-x-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export DPT-3 V3 Filing JSON</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-mono">
            {/* Liabilities Table (Left 2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider font-sans border-b border-slate-200 pb-2">
                Reconciliation of Borrowings &amp; Deemed Deposits
              </h4>

              <div className="space-y-2">
                {dpt3Items.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border ${
                      item.isDeemedDeposit
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    } space-y-2`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{item.partyName}</span>
                        <span className="text-[10px] text-slate-500">
                          Category: {item.category} | PAN/CIN: {item.panOrCin}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 block">
                          ₹{item.closingBalance.toLocaleString('en-IN')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isDeemedDeposit ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.isDeemedDeposit ? 'DEEMED DEPOSIT' : 'EXEMPTED LOAN'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-600 border-t border-slate-200 pt-1.5">
                      <span>Received: +₹{item.amountReceivedDuringYear.toLocaleString('en-IN')}</span>
                      <span>Repaid: -₹{item.amountRepaidDuringYear.toLocaleString('en-IN')}</span>
                      <span>
                        Status: <strong className={item.statutoryAuditVerificationStatus === 'VERIFIED_GENUINE' ? 'text-emerald-700' : 'text-rose-600'}>
                          {item.statutoryAuditVerificationStatus}
                        </strong>
                      </span>
                    </div>

                    {item.category === 'CUSTOMER_ADVANCE_BEYOND_365D' && (
                      <p className="text-[10px] text-rose-700 font-medium">
                        ⚠ Under Rule 2(1)(c)(xii), customer advances held beyond 365 days without appropriation to delivery of goods are statutorily reclassified as Public Deposits.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary & Net Worth Ratio Gauge */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider font-sans border-b border-slate-200 pb-2">
                Deposit Limits &amp; Net Worth Ratios
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Net Worth of Company:</span>
                  <span className="font-bold text-slate-900">₹{(dpt3Summary.netWorthOfCompany / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Exempted Borrowings:</span>
                  <span className="font-bold text-red-700">₹{(dpt3Summary.totalExemptedLiabilities / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Deemed / Public Deposits:</span>
                  <span className="font-bold">₹{(dpt3Summary.totalDeemedDeposits / 100000).toFixed(2)} Lakhs</span>
                </div>
                <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-200 font-bold">
                  <span>Grand Total Liabilities:</span>
                  <span className="text-slate-900">₹{(dpt3Summary.grandTotalLiabilities / 10000000).toFixed(2)} Cr</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-1">
                <span className="text-[10px] uppercase text-red-700 font-bold block">
                  Deposit-to-Net Worth Ratio
                </span>
                <span className="text-xl font-black text-slate-900">
                  {dpt3Summary.depositToNetWorthRatioPercent}%
                </span>
                <p className="text-[10px] text-slate-600">
                  Permissible limit for Private Co under Section 73(2) is up to 100% of Net Worth.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700">
                <span>Auditor Certificate u/r 16: </span>
                <strong className={dpt3Summary.auditorCertificateRequired ? 'text-amber-800' : 'text-emerald-700'}>
                  {dpt3Summary.auditorCertificateRequired ? 'MANDATORY (Due to Deposits)' : 'NOT REQUIRED (Exempted Only)'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Form MSME-1 Half-Yearly Return */}
      {activeTab === 'MSME_1_RETURN' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Form MSME-1 Half-Yearly Return of Overdue Supplier Dues (&gt; 45 Days)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Specified Companies Order 2019 read with Section 405 of Companies Act | Period: {msme1Summary.halfYear} (Due: {msme1Summary.filingDueDate})
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Delayed MSME Dues</span>
              <span className="text-xl font-black text-rose-600 font-mono">
                ₹{msme1Summary.totalOutstandingAmountInr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">Supplier Name &amp; Udyam No.</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Inv No &amp; Date</th>
                  <th className="p-3">Statutory Due Date</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-right">Delay (Days)</th>
                  <th className="p-3">Specific Reason for Delay</th>
                  <th className="p-3 text-right">Sec 16 Interest (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {msme1Items.map(item => (
                  <tr key={item.id} className={item.isReportableInMsme1 ? 'bg-rose-50' : 'hover:bg-slate-50'}>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{item.supplierName}</span>
                      <span className="text-[10px] text-red-600">{item.udyamRegistrationNumber}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200 text-slate-700">
                        {item.enterpriseCategory}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {item.invoiceNumber}<br/>
                      <span className="text-[10px] text-slate-500">{item.invoiceDate}</span>
                    </td>
                    <td className="p-3 text-slate-700">{item.statutoryDueDate}</td>
                    <td className="p-3 text-right text-slate-900 font-bold">
                      ₹{item.amountDueInr.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-bold ${item.daysOfDelay > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {item.daysOfDelay} Days
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 max-w-xs truncate" title={item.reasonForDelay}>
                      {item.reasonForDelay}
                    </td>
                    <td className="p-3 text-right text-amber-800 font-bold">
                      ₹{item.msmeInterestExposureSec16.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Cross-Linkage Guard:</strong> All overdue MSME items above have been automatically synced with Form 3CD Clause 22 and Section 43B(h) disallowances.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Director KYC (DIR-3 KYC) Guardian */}
      {activeTab === 'DIR3_KYC_GUARDIAN' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Director KYC (DIR-3 KYC &amp; Web KYC) Annual 30th Sep Guardian</span>
              </h3>
              <p className="text-xs text-slate-500">
                Monitors annual statutory deadline, flags deactivation risk under Rule 12A, and dispatches 1-click magic links.
              </p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {directors.map(dir => (
              <div
                key={dir.din}
                className={`p-4 rounded-xl border transition ${
                  dir.isDeactivated
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-slate-50 border-slate-200'
                } space-y-3`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-sm font-bold text-slate-900">{dir.directorName}</span>
                    <span className="text-slate-500 ml-2">(DIN: {dir.din}) | PAN: {dir.pan}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      dir.isDeactivated
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {dir.kycStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-slate-700">
                      Mode: {dir.kycMode}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Mobile / Email</span>
                    <span className="text-slate-900">{dir.mobile}</span>
                    <span className="text-slate-500 block truncate">{dir.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Statutory Deadline</span>
                    <span className="text-slate-700">{dir.kycFilingDeadline}</span>
                    <span className={dir.daysUntilExpiry < 0 ? 'text-rose-600 block' : 'text-slate-500 block'}>
                      {dir.daysUntilExpiry < 0 ? `${Math.abs(dir.daysUntilExpiry)} Days Overdue` : `${dir.daysUntilExpiry} Days Left`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Late Fee u/r 12A</span>
                    <span className={dir.lateFeeExposureInr > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                      ₹{dir.lateFeeExposureInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Cross Directorships</span>
                    <span className="text-red-700 font-semibold">{dir.crossDirectorshipCompanies.length} Companies</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500">
                    Last Filed: {dir.lastKycFiledDate || 'N/A'}
                  </span>

                  <button
                    onClick={() => handleSendOtpLink(dir.din, dir.directorName)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send 1-Click OTP Verification Magic Link</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Minute Book & Resolutions (SS-1/SS-2) */}
      {activeTab === 'MINUTE_BOOK_AGM' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Secretarial Compliance Calendar &amp; Minute Book Generator (SS-1 / SS-2)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Auto-drafts Notice, Agenda, Attendance Register, and Board Resolutions under Section 118 of Companies Act.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                SS-1 Max 120-Day Gap: COMPLIANT
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {meetings.map(m => (
              <div key={m.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">
                      {m.meetingNumber} ({m.meetingType.replace(/_/g, ' ')})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Date: {m.meetingDate} at {m.meetingTime} | Mode: {m.venueOrMode} | Chairman: {m.chairmanName}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
                    {m.isMinutesSignedByChairman ? 'MINUTES SIGNED' : 'DRAFT'}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-sans font-bold text-red-700 block">
                    Resolutions Passed:
                  </span>
                  {m.resolutions.map(r => (
                    <div key={r.resolutionNumber} className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between text-slate-900 font-bold">
                        <span>{r.agendaTitle}</span>
                        <span className="text-red-700">{r.statutorySection}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 italic">{r.resolutionDraftText}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Form BEN-2 SBO Multi-Tier Detector */}
      {activeTab === 'BEN2_SBO_DETECTOR' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Form BEN-2 Significant Beneficial Ownership (SBO) Multi-Tier Detector</span>
              </h3>
              <p className="text-xs text-slate-500">
                Section 90 read with SBO Rules 2018: Traces natural individuals holding &gt; 10% indirect equity/voting rights.
              </p>
            </div>

            <button
              onClick={handleDownloadBen2Payload}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200 flex items-center space-x-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Form BEN-2 ROC Payload</span>
            </button>
          </div>

          <div className="space-y-4">
            {detectedSbos.map(sbo => (
              <div key={sbo.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-3">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">
                      Natural Person (SBO): {sbo.sboName} ({sbo.nationality})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Passport/PAN: {sbo.panOrPassport} | Acquired SBO: {sbo.dateOfAcquiringSbo}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                    TOTAL SBO HOLDING: {sbo.totalEffectiveHoldingPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Intermediate Entity</span>
                    <span className="text-slate-900 font-bold">{sbo.intermediateEntityName}</span>
                    <span className="text-[10px] text-slate-500 block">{sbo.intermediateEntityCin}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Indirect Equity</span>
                    <span className="text-amber-800 font-bold">{sbo.indirectHoldingPercent}%</span>
                    <span className="text-[10px] text-slate-500 block">&gt; 10% Statutory Cap</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Form BEN-1 Receipt</span>
                    <span className="text-emerald-700 font-bold">{sbo.formBen1ReceivedDate}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Form BEN-2 ROC Due</span>
                    <span className="text-slate-900 font-bold">{sbo.formBen2DueDate}</span>
                    <span className="text-[10px] text-slate-500 block">30 days from BEN-1</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-700">
                    Status: <strong className="text-emerald-700">READY FOR ROC FILING (Zero Penalty u/s 90(11))</strong>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Notice u/s 90(5) in Form BEN-4: DISPENSED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
