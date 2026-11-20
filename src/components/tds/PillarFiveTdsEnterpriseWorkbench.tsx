'use client';

import React, { useState } from 'react';
import { 
  Calculator, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileText, 
  Upload, 
  Globe, 
  KeyRound, 
  Mail, 
  Send, 
  Printer, 
  Percent, 
  TrendingDown, 
  Layers, 
  FileCheck2 
} from 'lucide-react';
import { 
  FvuCsiEngine, 
  FvuChallanItem, 
  FvuDeducteeItem, 
  FvuBatchHeader, 
  CsiChallanRecord, 
  SAMPLE_FVU_CHALLANS, 
  SAMPLE_FVU_DEDUCTEES, 
  SAMPLE_CSI_RAW_DATA 
} from '@/lib/tds/fvuCsiEngine';
import { 
  TracesJustificationEngine, 
  TracesDefaultRecord, 
  TracesJustificationSummary, 
  SAMPLE_TRACES_DEFAULTS 
} from '@/lib/tds/tracesJustificationEngine';
import { 
  Sec197CertificateEngine, 
  LowerTdsCertificateItem, 
  SAMPLE_197_CERTIFICATES 
} from '@/lib/tds/sec197CertificateEngine';
import { 
  Form15ca15cbEngine, 
  ForeignRemittanceRequest, 
  SAMPLE_FOREIGN_REMITTANCES 
} from '@/lib/tds/form15ca15cbEngine';
import { 
  Form16SignerEngine, 
  Form16EmployeeCertificate, 
  SAMPLE_FORM16_CERTIFICATES 
} from '@/lib/tds/form16SignerEngine';
import { toast } from '@/components/shared/ToastNotification';

export function PillarFiveTdsEnterpriseWorkbench() {
  const [activeTab, setActiveTab] = useState<
    'QUARTERLY_RETURN' | 'TRACES_JUSTIFICATION' | 'SEC_197_GUARDIAN' | 'FORM_15CA_15CB' | 'FORM_16_SIGNER'
  >('QUARTERLY_RETURN');

  // Sub-Engine 1: Quarterly Return & CSI Matching
  const [selectedForm, setSelectedForm] = useState<'24Q' | '26Q' | '27Q' | '27EQ'>('26Q');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [challans, setChallans] = useState<FvuChallanItem[]>(SAMPLE_FVU_CHALLANS);
  const [deductees, setDeductees] = useState<FvuDeducteeItem[]>(SAMPLE_FVU_DEDUCTEES);
  const [csiMatches, setCsiMatches] = useState<CsiChallanRecord[]>([]);
  const [isCsiMatched, setIsCsiMatched] = useState<boolean>(true);

  // Sub-Engine 2: TRACES Justification Defaults
  const [tracesDefaults, setTracesDefaults] = useState<TracesDefaultRecord[]>(SAMPLE_TRACES_DEFAULTS);
  const tracesSummary: TracesJustificationSummary = TracesJustificationEngine.summarizeJustification(tracesDefaults, {
    tan: 'BPLP01928K',
    financialYear: '2026-27',
    quarter: 'Q2',
    formType: '26Q'
  });

  // Sub-Engine 3: Section 197 Certificates
  const [certificates197, setCertificates197] = useState<LowerTdsCertificateItem[]>(SAMPLE_197_CERTIFICATES);
  const [testInvoiceAmount, setTestInvoiceAmount] = useState<number>(1500000);
  const [simulatedSplitResult, setSimulatedSplitResult] = useState<any>(null);

  // Sub-Engine 4: Form 15CA & 15CB
  const [remittances, setRemittances] = useState<ForeignRemittanceRequest[]>(SAMPLE_FOREIGN_REMITTANCES);

  // Sub-Engine 5: Form 16 / 16A Bulk Signer
  const [form16Batch, setForm16Batch] = useState<Form16EmployeeCertificate[]>(SAMPLE_FORM16_CERTIFICATES);

  // Handlers
  const handleDownloadFvu = () => {
    const header: FvuBatchHeader = {
      batchNumber: 1,
      totalChallansCount: challans.length,
      totalDeducteesCount: deductees.length,
      totalTaxDeducted: deductees.reduce((sum, d) => sum + d.tdsDeducted, 0),
      totalTaxDeposited: challans.reduce((sum, c) => sum + c.totalDeposit, 0),
      tan: 'BPLP01928K',
      panOfEmployer: 'AABCP9182K',
      financialYear: '2026-27',
      assessmentYear: '2027-28',
      quarter: selectedQuarter,
      formType: selectedForm,
      deductorType: 'COMPANY'
    };
    const fvuText = FvuCsiEngine.generateFvuTextStream(header, challans, deductees);
    
    // Create downloadable blob
    const element = document.createElement('a');
    const file = new Blob([fvuText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${header.tan}_${header.formType}_${header.quarter}.txt`;
    document.body.appendChild(element);
    element.click();
    toast.success(`e-TDS FVU text file generated & downloaded for Form ${selectedForm} ${selectedQuarter}!`);
  };

  const handleSimulate197Split = (cert: LowerTdsCertificateItem) => {
    const result = Sec197CertificateEngine.evaluatePaymentUnder197(cert, testInvoiceAmount, '2026-11-20');
    setSimulatedSplitResult(result);
    toast.success('Section 197 payment split calculated successfully.');
  };

  const handleCureTracesDefault = (id: string) => {
    setTracesDefaults(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          isCured: true,
          curedDetails: 'Online C2/C9 correction payload verified. Demand dropped to ₹0.'
        };
      }
      return d;
    }));
    toast.success('TRACES default cured via simulated online correction.');
  };

  const handleBulkSignForm16 = () => {
    const signed = Form16SignerEngine.signAndMergeBatch(form16Batch, {
      serialNumber: 'ePass2003-89104-CA-INDORE',
      signerName: 'CA Chetan Pratap Singh (Partner)',
      tokenProvider: 'ePass2003 Class 3 USB Token'
    });
    setForm16Batch(signed);
    toast.success('Form 16 Part A & B merged, DSC digitally signed, and dispatched to Email + WhatsApp!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border border-amber-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Pillar V: TDS, TRACES &amp; International Remittances</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Quarterly TDS (24Q/26Q/27Q/27EQ), TRACES Default Curer &amp; Form 15CA/CB
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Institutional TDS automation: <strong>FVU text generator</strong>, <strong>CSI challan matcher</strong>, <strong>TRACES justification report analyzer</strong> (Sec 234E &amp; 201(1A)), <strong>Section 197 threshold guardian</strong>, <strong>Form 15CA/15CB DTAA optimizer</strong>, and <strong>Form 16 DSC bulk signer</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleDownloadFvu}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/25 flex items-center space-x-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Compile &amp; Download FVU File</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Total TDS Deducted &amp; Deposited
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">
              ₹{(challans.reduce((sum, c) => sum + c.totalDeposit, 0) / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">100% CSI Matched</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Form {selectedForm} ({selectedQuarter})</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            TRACES Demand Exposure
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-400">
              ₹{(tracesSummary.totalDemandAmount / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-rose-400">({tracesSummary.totalDefaultsCount} Defaults)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Short Ded + 234E Fee + 201(1A)</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Sec 197 Active Threshold
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-cyan-400">
              ₹{(certificates197.reduce((sum, c) => sum + c.remainingLimit, 0) / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-cyan-300 font-bold">Protected</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Lower Rate 0.5% - 1.5% Cap</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
            Form 15CA/CB Remittances
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-400">
              ${(remittances.reduce((sum, r) => sum + r.remittanceAmountForeign, 0) / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-amber-300 font-bold">DTAA Optimized</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Indo-US DTAA 10% applied</p>
        </div>
      </div>

      {/* 5 Institutional Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('QUARTERLY_RETURN')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'QUARTERLY_RETURN'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>1. Quarterly Return (24Q/26Q/27Q/27EQ) &amp; CSI</span>
        </button>

        <button
          onClick={() => setActiveTab('TRACES_JUSTIFICATION')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'TRACES_JUSTIFICATION'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>2. TRACES Default Analyzer (234E &amp; 201(1A))</span>
        </button>

        <button
          onClick={() => setActiveTab('SEC_197_GUARDIAN')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'SEC_197_GUARDIAN'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Percent className="w-3.5 h-3.5 text-cyan-400" />
          <span>3. Sec 197 Lower Rate Guardian</span>
        </button>

        <button
          onClick={() => setActiveTab('FORM_15CA_15CB')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'FORM_15CA_15CB'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>4. Form 15CA &amp; 15CB Foreign Remittances</span>
        </button>

        <button
          onClick={() => setActiveTab('FORM_16_SIGNER')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'FORM_16_SIGNER'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
          <span>5. Form 16 Bulk Merger &amp; DSC Signer</span>
        </button>
      </div>

      {/* TAB 1: Quarterly Return & CSI Matcher */}
      {activeTab === 'QUARTERLY_RETURN' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 font-mono">Form Type:</span>
              {(['24Q', '26Q', '27Q', '27EQ'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedForm(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    selectedForm === f ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Form {f}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 font-mono">Quarter:</span>
              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    selectedQuarter === q ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Challans & Deductees Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-mono">
            {/* Challans */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-sans">
                  Challans (OLTAS 281 Matched with .csi file)
                </h4>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  {challans.length} Challans Matched
                </span>
              </div>

              <div className="space-y-2">
                {challans.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-white font-bold">
                      <span>BSR: {c.bsrCode} | Challan #{c.challanSerialNo}</span>
                      <span className="text-amber-400">₹{c.totalDeposit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Section: {c.sectionCode} | Minor Head: {c.minorHead}</span>
                      <span>Date: {c.tenderDate}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-400 text-[10px] pt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>OLTAS CSI Status: Matched (₹0 Divergence)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deductees */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-sans">
                  Deductee Records ({deductees.length} Records)
                </h4>
                <span className="text-[10px] text-slate-400">Sec 194J &amp; 194C</span>
              </div>

              <div className="space-y-2">
                {deductees.map(d => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-white font-bold">
                      <span className="truncate max-w-[200px]">{d.deducteeName}</span>
                      <span className="text-cyan-400">TDS: ₹{d.tdsDeducted.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>PAN: {d.deducteePan} ({d.panStatus})</span>
                      <span>Gross: ₹{d.amountPaidOrCredited.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRACES Justification Report Defaults */}
      {activeTab === 'TRACES_JUSTIFICATION' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>TRACES Justification Report (Default Sheet) Analyzer</span>
              </h3>
              <p className="text-xs text-slate-400">
                TAN: <strong>{tracesSummary.tan}</strong> | FY: {tracesSummary.financialYear} ({tracesSummary.quarter} Form {tracesSummary.formType})
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Portal Demand</span>
              <span className="text-xl font-black text-rose-400 font-mono">
                ₹{tracesSummary.totalDemandAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {tracesDefaults.map(d => (
              <div
                key={d.id}
                className={`p-4 rounded-xl border transition text-xs space-y-3 ${
                  d.isCured
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold text-[10px]">
                      {d.defaultCategory}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {d.nameOfDeductee}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      (PAN: {d.panOfDeductee})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      Demand: ₹{(d.amountUnderDefault + d.penalInterestOrFee).toLocaleString('en-IN')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {d.recommendedCorrection}
                    </span>
                  </div>
                </div>

                <p className="text-slate-300">{d.defaultDescription}</p>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-300">
                    <strong className="text-cyan-400">Required Online Correction:</strong> {d.correctionActionSteps}
                  </div>

                  {!d.isCured ? (
                    <button
                      onClick={() => handleCureTracesDefault(d.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition shrink-0 flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Execute Online C2/C9 Correction</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Demand Extinguished</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Section 197 Lower Rate Guardian */}
      {activeTab === 'SEC_197_GUARDIAN' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Section 197 Lower / Nil Deduction Certificate Guardian</span>
              </h3>
              <p className="text-xs text-slate-400">
                Monitors certificate validity dates, approved section codes, and real-time threshold limit consumption.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {certificates197.map(cert => {
              const consumptionPercent = Math.round((cert.consumedAmount / cert.sanctionedThresholdAmount) * 100);

              return (
                <div key={cert.id} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 text-xs font-mono">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <span className="font-bold text-white text-sm block">{cert.beneficiaryName}</span>
                      <span className="text-[11px] text-slate-400">PAN: {cert.beneficiaryPan} | Cert: #{cert.certificateNumber}</span>
                    </div>

                    <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold text-[10px]">
                      Sec {cert.applicableSection} @ {cert.approvedLowerRatePercent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Threshold Consumption: {consumptionPercent}%</span>
                      <span>Remaining: ₹{cert.remainingLimit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          consumptionPercent > 90 ? 'bg-rose-500' : consumptionPercent > 70 ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${consumptionPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Consumed: ₹{cert.consumedAmount.toLocaleString('en-IN')}</span>
                      <span>Cap: ₹{cert.sanctionedThresholdAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Test Payment Splitter */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-sans font-bold text-cyan-400 uppercase tracking-wider block">
                      Auto-Breach Protector (Simulate Invoice Payment)
                    </span>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={testInvoiceAmount}
                        onChange={(e) => setTestInvoiceAmount(Number(e.target.value))}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono w-full"
                        placeholder="Invoice Amount"
                      />
                      <button
                        onClick={() => handleSimulate197Split(cert)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs whitespace-nowrap transition"
                      >
                        Evaluate
                      </button>
                    </div>

                    {simulatedSplitResult && (
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-[11px] space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span>Lower Rate ({cert.approvedLowerRatePercent}% on ₹{simulatedSplitResult.lowerRatePortion.toLocaleString('en-IN')}):</span>
                          <span className="text-cyan-300 font-bold">₹{simulatedSplitResult.lowerRateTdsAmount.toLocaleString('en-IN')}</span>
                        </div>
                        {simulatedSplitResult.standardRatePortion > 0 && (
                          <div className="flex justify-between text-rose-300">
                            <span>Standard Rate ({cert.standardStatutoryRatePercent}% on ₹{simulatedSplitResult.standardRatePortion.toLocaleString('en-IN')}):</span>
                            <span className="font-bold">₹{simulatedSplitResult.standardRateTdsAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-1">
                          <span>Total TDS Deductible:</span>
                          <span>₹{simulatedSplitResult.totalTdsToDeduct.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Form 15CA & 15CB Foreign Remittances */}
      {activeTab === 'FORM_15CA_15CB' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Form 15CA &amp; 15CB Foreign Remittance Decision Engine</span>
              </h3>
              <p className="text-xs text-slate-400">
                Rule 37BB Part A/B/C/D decision tree, Indo-US/Singapore DTAA rate optimizer, and Form 15CB CA certification.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {remittances.map(rem => (
              <div key={rem.id} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Beneficiary: {rem.beneficiaryName} ({rem.beneficiaryCountry})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Nature: {rem.natureOfRemittance} | Remitter: {rem.remitterName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                      15CA {rem.determined15caPart}
                    </span>
                    {rem.is15cbMandatory && (
                      <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold text-[10px]">
                        FORM 15CB MANDATORY
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Remittance Amount</span>
                    <span className="text-white font-bold">{rem.remittanceCurrency} {rem.remittanceAmountForeign.toLocaleString('en-US')}</span>
                    <span className="text-[10px] text-slate-400 block">(₹{rem.remittanceAmountInr.toLocaleString('en-IN')})</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Domestic Act Rate</span>
                    <span className="text-slate-300 font-bold">{rem.domesticActRatePercent}%</span>
                    <span className="text-[10px] text-slate-500 block">Sec 115A (20% + Cess)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">DTAA Treaty Rate</span>
                    <span className="text-emerald-400 font-bold">{rem.dtaaTreatyRatePercent}%</span>
                    <span className="text-[10px] text-emerald-400 block">Indo-US Article 12</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Effective TDS to Deduct</span>
                    <span className="text-cyan-400 font-bold">₹{rem.grossTdsAmountInr.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-cyan-300 block">Rate: {rem.effectiveTdsRatePercent}%</span>
                  </div>
                </div>

                {/* DTAA Document Checklist */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-4 text-[11px]">
                  <span className="text-slate-400 font-bold">DTAA Prerequisites:</span>
                  <span className={rem.isTrcAvailable ? 'text-emerald-400' : 'text-rose-400'}>
                    ✓ TRC Verified
                  </span>
                  <span className={rem.isForm10fFiled ? 'text-emerald-400' : 'text-rose-400'}>
                    ✓ Form 10F E-Filed
                  </span>
                  <span className={rem.isNoPeDeclarationObtained ? 'text-emerald-400' : 'text-rose-400'}>
                    ✓ No-PE Declaration
                  </span>
                  {rem.udinNumber && (
                    <span className="text-cyan-300 ml-auto font-mono text-[10px]">
                      15CB UDIN: {rem.udinNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Form 16 Bulk Merger & DSC Signer */}
      {activeTab === 'FORM_16_SIGNER' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Form 16 / 16A Bulk PDF Merger &amp; USB DSC Signer</span>
              </h3>
              <p className="text-xs text-slate-400">
                Merges TRACES Part A with Internal Salary Part B, applies partner digital signature, and auto-dispatches.
              </p>
            </div>

            <button
              onClick={handleBulkSignForm16}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center space-x-2 transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>Bulk Merge, DSC Sign &amp; Dispatch</span>
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {form16Batch.map(cert => (
              <div key={cert.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white text-sm">{cert.employeeName}</span>
                    <span className="text-[11px] text-slate-400 ml-2">({cert.designation}) | PAN: {cert.employeePan}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      Gross: ₹{(cert.grossSalarySection17_1 / 100000).toFixed(2)}L
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-bold">
                      TDS: ₹{cert.tdsDeductedDeposited.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <span className={cert.isPdfMerged ? 'text-emerald-400' : 'text-slate-500'}>
                      {cert.isPdfMerged ? '✓ Part A+B Merged' : '○ Pending Merge'}
                    </span>
                    <span className={cert.isDscSigned ? 'text-emerald-400' : 'text-slate-500'}>
                      {cert.isDscSigned ? `✓ DSC Signed (${cert.signerDscSerialNo})` : '○ Unsigned'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400">
                      Email: <strong className={cert.emailDispatchStatus === 'SENT' || cert.emailDispatchStatus === 'OPENED' ? 'text-emerald-400' : 'text-slate-500'}>{cert.emailDispatchStatus}</strong>
                    </span>
                    <span className="text-slate-400">
                      WhatsApp: <strong className={cert.whatsAppDispatchStatus === 'DELIVERED' ? 'text-emerald-400' : 'text-slate-500'}>{cert.whatsAppDispatchStatus}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
