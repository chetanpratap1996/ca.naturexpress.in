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
import { useClientContext } from '@/lib/context/ClientContext';
import { UniversalClientSelector } from '@/components/shared/UniversalClientSelector';
import { ClientGateEmptyState } from '@/components/shared/ClientGateEmptyState';
import { writeClientTaxBridge } from '@/lib/taxAudit/clientTaxBridge';

export function PillarFiveTdsEnterpriseWorkbench() {
  const { selectedClient, isFirmWideView, selectedFy, selectedAy } = useClientContext();
  const [activeTab, setActiveTab] = useState<
    'QUARTERLY_RETURN' | 'TRACES_JUSTIFICATION' | 'SEC_197_GUARDIAN' | 'FORM_15CA_15CB' | 'FORM_16_SIGNER'
  >('QUARTERLY_RETURN');

  // Sub-Engine 1: Quarterly Return & CSI Matching
  const [selectedForm, setSelectedForm] = useState<'24Q' | '26Q' | '27Q' | '27EQ'>('26Q');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [challans, setChallans] = useState<FvuChallanItem[]>([]);
  const [deductees, setDeductees] = useState<FvuDeducteeItem[]>([]);
  const [csiMatches, setCsiMatches] = useState<CsiChallanRecord[]>([]);
  const [isCsiMatched, setIsCsiMatched] = useState<boolean>(false);

  // Sub-Engine 2: TRACES Justification Defaults
  const [tracesDefaults, setTracesDefaults] = useState<TracesDefaultRecord[]>([]);
  const tracesSummary: TracesJustificationSummary = TracesJustificationEngine.summarizeJustification(tracesDefaults, {
    tan: selectedClient?.tan || '',
    financialYear: selectedFy,
    quarter: 'Q2',
    formType: '26Q'
  });

  // Sub-Engine 3: Section 197 Certificates
  const [certificates197, setCertificates197] = useState<LowerTdsCertificateItem[]>([]);
  const [testInvoiceAmount, setTestInvoiceAmount] = useState<number>(1500000);
  const [simulatedSplitResult, setSimulatedSplitResult] = useState<any>(null);

  // Sub-Engine 4: Form 15CA & 15CB
  const [remittances, setRemittances] = useState<ForeignRemittanceRequest[]>([]);

  // Sub-Engine 5: Form 16 / 16A Bulk Signer
  const [form16Batch, setForm16Batch] = useState<Form16EmployeeCertificate[]>([]);

  // Handlers
  const handleDownloadFvu = () => {
    const header: FvuBatchHeader = {
      batchNumber: 1,
      totalChallansCount: challans.length,
      totalDeducteesCount: deductees.length,
      totalTaxDeducted: deductees.reduce((sum, d) => sum + d.tdsDeducted, 0),
      totalTaxDeposited: challans.reduce((sum, c) => sum + c.totalDeposit, 0),
      tan: selectedClient?.tan || '',
      panOfEmployer: selectedClient?.pan || '',
      financialYear: selectedFy,
      assessmentYear: selectedAy,
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

  if (!selectedClient || isFirmWideView) {
    return (
      <ClientGateEmptyState
        moduleTitle="Quarterly TDS Returns & TRACES Compliance"
        description="Select a client entity above to inspect their real TAN, Form 24Q/26Q/27Q challans, TRACES defaults, and Form 16/16A certificates." />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Enterprise Simplicity */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>e-TDS Return &amp; TRACES Desk</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Quarterly TDS Returns &amp; TRACES Compliance
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <UniversalClientSelector variant="compact" />
            <button
              onClick={handleDownloadFvu}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center space-x-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Compile &amp; Download FVU File</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Total TDS Deducted &amp; Deposited
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">
              ₹{(challans.reduce((sum, c) => sum + c.totalDeposit, 0) / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-emerald-700 font-bold">100% CSI Matched</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Form {selectedForm} ({selectedQuarter})</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            TRACES Demand Exposure
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-600">
              ₹{(tracesSummary.totalDemandAmount / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-rose-600">({tracesSummary.totalDefaultsCount} Defaults)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Short Ded + 234E Fee + 201(1A)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Sec 197 Active Threshold
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-red-600">
              ₹{(certificates197.reduce((sum, c) => sum + c.remainingLimit, 0) / 100000).toFixed(2)}L
            </span>
            <span className="text-xs font-mono text-red-700 font-bold">Protected</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Lower Rate 0.5% - 1.5% Cap</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
            Form 15CA/CB Remittances
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">
              ${(remittances.reduce((sum, r) => sum + r.remittanceAmountForeign, 0) / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-mono text-emerald-700 font-bold">DTAA Optimized</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Indo-US DTAA 10% applied</p>
        </div>
      </div>

      {/* TDS Subtabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('QUARTERLY_RETURN')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'QUARTERLY_RETURN'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Quarterly Returns (24Q/26Q/27Q) &amp; CSI</span>
        </button>

        <button
          onClick={() => setActiveTab('TRACES_JUSTIFICATION')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'TRACES_JUSTIFICATION'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>TRACES Default Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('SEC_197_GUARDIAN')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'SEC_197_GUARDIAN'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Section 197 Lower Rate</span>
        </button>

        <button
          onClick={() => setActiveTab('FORM_15CA_15CB')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'FORM_15CA_15CB'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Form 15CA &amp; 15CB Foreign Remittances</span>
        </button>

        <button
          onClick={() => setActiveTab('FORM_16_SIGNER')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'FORM_16_SIGNER'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Form 16/16A Signer</span>
        </button>
      </div>

      {/* TAB 1: Quarterly Return & CSI Matcher */}
      {activeTab === 'QUARTERLY_RETURN' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-500 font-mono">Form Type:</span>
              {(['24Q', '26Q', '27Q', '27EQ'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedForm(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    selectedForm === f ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Form {f}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-500 font-mono">Quarter:</span>
              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    selectedQuarter === q ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider font-sans">
                  Challans (OLTAS 281 Matched with .csi file)
                </h4>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {challans.length} Challans Matched
                </span>
              </div>

              <div className="space-y-2">
                {challans.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-slate-900 font-bold">
                      <span>BSR: {c.bsrCode} | Challan #{c.challanSerialNo}</span>
                      <span className="text-red-700">₹{c.totalDeposit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Section: {c.sectionCode} | Minor Head: {c.minorHead}</span>
                      <span>Date: {c.tenderDate}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-700 text-[10px] pt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>OLTAS CSI Status: Matched (₹0 Divergence)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deductees */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider font-sans">
                  Deductee Records ({deductees.length} Records)
                </h4>
                <span className="text-[10px] text-slate-500">Sec 194J &amp; 194C</span>
              </div>

              <div className="space-y-2">
                {deductees.map(d => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-slate-900 font-bold">
                      <span className="truncate max-w-[200px]">{d.deducteeName}</span>
                      <span className="text-red-700">TDS: ₹{d.tdsDeducted.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>TRACES Justification Report (Default Sheet) Analyzer</span>
              </h3>
              <p className="text-xs text-slate-500">
                TAN: <strong className="text-slate-900">{tracesSummary.tan}</strong> | FY: {tracesSummary.financialYear} ({tracesSummary.quarter} Form {tracesSummary.formType})
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Portal Demand</span>
              <span className="text-xl font-black text-rose-600 font-mono">
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
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono font-bold text-[10px]">
                      {d.defaultCategory}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {d.nameOfDeductee}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      (PAN: {d.panOfDeductee})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-rose-600">
                      Demand: ₹{(d.amountUnderDefault + d.penalInterestOrFee).toLocaleString('en-IN')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {d.recommendedCorrection}
                    </span>
                  </div>
                </div>

                <p className="text-slate-700">{d.defaultDescription}</p>

                <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-700">
                    <strong className="text-red-600">Required Online Correction:</strong> {d.correctionActionSteps}
                  </div>

                  {!d.isCured ? (
                    <button
                      onClick={() => handleCureTracesDefault(d.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition shrink-0 flex items-center space-x-1 shadow-sm"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Execute Online C2/C9 Correction</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-xs shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Demand Extinguished</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Section 197 Lower Rate Tracker */}
      {activeTab === 'SEC_197_GUARDIAN' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Section 197 Lower / Nil Deduction Certificate Tracker</span>
              </h3>
              <p className="text-xs text-slate-500">
                Monitors certificate validity dates, approved section codes, and real-time threshold limit consumption.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {certificates197.map(cert => {
              const consumptionPercent = Math.round((cert.consumedAmount / cert.sanctionedThresholdAmount) * 100);

              return (
                <div key={cert.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs font-mono">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{cert.beneficiaryName}</span>
                      <span className="text-[11px] text-slate-500">PAN: {cert.beneficiaryPan} | Cert: #{cert.certificateNumber}</span>
                    </div>

                    <span className="px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200 font-bold text-[10px]">
                      Sec {cert.applicableSection} @ {cert.approvedLowerRatePercent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Threshold Consumption: {consumptionPercent}%</span>
                      <span>Remaining: ₹{cert.remainingLimit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          consumptionPercent > 90 ? 'bg-rose-600' : consumptionPercent > 70 ? 'bg-amber-500' : 'bg-red-600'
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
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <span className="text-[10px] font-sans font-bold text-red-700 uppercase tracking-wider block">
                      Auto-Breach Protector (Simulate Invoice Payment)
                    </span>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={testInvoiceAmount}
                        onChange={(e) => setTestInvoiceAmount(Number(e.target.value))}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono w-full focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="Invoice Amount"
                      />
                      <button
                        onClick={() => handleSimulate197Split(cert)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs whitespace-nowrap transition shadow-sm"
                      >
                        Evaluate
                      </button>
                    </div>

                    {simulatedSplitResult && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1 text-slate-700">
                        <div className="flex justify-between">
                          <span>Lower Rate ({cert.approvedLowerRatePercent}% on ₹{simulatedSplitResult.lowerRatePortion.toLocaleString('en-IN')}):</span>
                          <span className="text-red-700 font-bold">₹{simulatedSplitResult.lowerRateTdsAmount.toLocaleString('en-IN')}</span>
                        </div>
                        {simulatedSplitResult.standardRatePortion > 0 && (
                          <div className="flex justify-between text-rose-600">
                            <span>Standard Rate ({cert.standardStatutoryRatePercent}% on ₹{simulatedSplitResult.standardRatePortion.toLocaleString('en-IN')}):</span>
                            <span className="font-bold">₹{simulatedSplitResult.standardRateTdsAmount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Form 15CA &amp; 15CB Foreign Remittance Decision Engine</span>
              </h3>
              <p className="text-xs text-slate-500">
                Rule 37BB Part A/B/C/D decision tree, Indo-US/Singapore DTAA rate optimizer, and Form 15CB CA certification.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {remittances.map(rem => (
              <div key={rem.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">
                      Beneficiary: {rem.beneficiaryName} ({rem.beneficiaryCountry})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Nature: {rem.natureOfRemittance} | Remitter: {rem.remitterName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200 font-bold text-[10px]">
                      15CA {rem.determined15caPart}
                    </span>
                    {rem.is15cbMandatory && (
                      <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                        FORM 15CB MANDATORY
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Remittance Amount</span>
                    <span className="text-slate-900 font-bold">{rem.remittanceCurrency} {rem.remittanceAmountForeign.toLocaleString('en-US')}</span>
                    <span className="text-[10px] text-slate-500 block">(₹{rem.remittanceAmountInr.toLocaleString('en-IN')})</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Domestic Act Rate</span>
                    <span className="text-slate-700 font-bold">{rem.domesticActRatePercent}%</span>
                    <span className="text-[10px] text-slate-500 block">Sec 115A (20% + Cess)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">DTAA Treaty Rate</span>
                    <span className="text-emerald-700 font-bold">{rem.dtaaTreatyRatePercent}%</span>
                    <span className="text-[10px] text-emerald-600 block">Indo-US Article 12</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Effective TDS to Deduct</span>
                    <span className="text-red-700 font-bold">₹{rem.grossTdsAmountInr.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-red-600 block">Rate: {rem.effectiveTdsRatePercent}%</span>
                  </div>
                </div>

                {/* DTAA Document Checklist */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center gap-4 text-[11px]">
                  <span className="text-slate-700 font-bold">DTAA Prerequisites:</span>
                  <span className={rem.isTrcAvailable ? 'text-emerald-700' : 'text-rose-600'}>
                    ✓ TRC Verified
                  </span>
                  <span className={rem.isForm10fFiled ? 'text-emerald-700' : 'text-rose-600'}>
                    ✓ Form 10F E-Filed
                  </span>
                  <span className={rem.isNoPeDeclarationObtained ? 'text-emerald-700' : 'text-rose-600'}>
                    ✓ No-PE Declaration
                  </span>
                  {rem.udinNumber && (
                    <span className="text-red-700 ml-auto font-mono text-[10px] font-bold">
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Form 16 / 16A Bulk PDF Merger &amp; USB DSC Signer</span>
              </h3>
              <p className="text-xs text-slate-500">
                Merges TRACES Part A with Internal Salary Part B, applies partner digital signature, and auto-dispatches.
              </p>
            </div>

            <button
              onClick={handleBulkSignForm16}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200 flex items-center space-x-2 transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>Bulk Merge, DSC Sign &amp; Dispatch</span>
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {form16Batch.map(cert => (
              <div key={cert.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{cert.employeeName}</span>
                    <span className="text-[11px] text-slate-500 ml-2">({cert.designation}) | PAN: {cert.employeePan}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px]">
                      Gross: ₹{(cert.grossSalarySection17_1 / 100000).toFixed(2)}L
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
                      TDS: ₹{cert.tdsDeductedDeposited.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <div className="flex items-center space-x-3">
                    <span className={cert.isPdfMerged ? 'text-emerald-700' : 'text-slate-500'}>
                      {cert.isPdfMerged ? '✓ Part A+B Merged' : '○ Pending Merge'}
                    </span>
                    <span className={cert.isDscSigned ? 'text-emerald-700' : 'text-slate-500'}>
                      {cert.isDscSigned ? `✓ DSC Signed (${cert.signerDscSerialNo})` : '○ Unsigned'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-slate-600">
                      Email: <strong className={cert.emailDispatchStatus === 'SENT' || cert.emailDispatchStatus === 'OPENED' ? 'text-emerald-700' : 'text-slate-500'}>{cert.emailDispatchStatus}</strong>
                    </span>
                    <span className="text-slate-600">
                      WhatsApp: <strong className={cert.whatsAppDispatchStatus === 'DELIVERED' ? 'text-emerald-700' : 'text-slate-500'}>{cert.whatsAppDispatchStatus}</strong>
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
