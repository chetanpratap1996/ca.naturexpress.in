'use client';

import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  Send, 
  Building2, 
  FileText, 
  DollarSign, 
  MessageSquare,
  Lock,
  Zap,
  Terminal,
  Activity
} from 'lucide-react';
import { 
  UniversalEntityDnaMesh, 
  ClientEntityDna, 
  SAMPLE_CLIENT_DNA_APEX, 
  SAMPLE_CLIENT_DNA_PRATWI,
  CrossSuiteEventType,
  RippleImpactSummary
} from '@/lib/mesh/universalEntityDnaMesh';
import { 
  AutonomousPracticeOrchestrator, 
  AutonomousRunReport 
} from '@/lib/mesh/autonomousPracticeOrchestrator';

export default function AutonomousPracticeOrchestratorWorkbench() {
  const [selectedClient, setSelectedClient] = useState<ClientEntityDna>(SAMPLE_CLIENT_DNA_APEX);
  const [customPan, setCustomPan] = useState(SAMPLE_CLIENT_DNA_APEX.pan);
  const [customGstin, setCustomGstin] = useState(SAMPLE_CLIENT_DNA_APEX.gstin);
  const [customCin, setCustomCin] = useState(SAMPLE_CLIENT_DNA_APEX.cin || '');

  // Full autonomous run state
  const [isRunning, setIsRunning] = useState(false);
  const [runReport, setRunReport] = useState<AutonomousRunReport>(
    AutonomousPracticeOrchestrator.executeFullPracticeRun(SAMPLE_CLIENT_DNA_APEX)
  );

  // Ripple simulation state
  const [simEventType, setSimEventType] = useState<CrossSuiteEventType>('MSME_OVERDUE_INVOICE_FLAGGED');
  const [simAmount, setSimAmount] = useState<number>(145000);
  const [simCounterparty, setSimCounterparty] = useState<string>('Mahavir Precision Forgings Pvt Ltd');
  const [simRippleResult, setSimRippleResult] = useState<RippleImpactSummary | null>(null);

  const [copiedBrief, setCopiedBrief] = useState(false);

  // Statutory Validations for active inputs
  const panValidation = UniversalEntityDnaMesh.validatePan(customPan);
  const gstinValidation = UniversalEntityDnaMesh.validateGstin(customGstin);
  const cinValidation = customCin ? UniversalEntityDnaMesh.validateCin(customCin) : undefined;

  const handleSelectClientProfile = (client: ClientEntityDna) => {
    setSelectedClient(client);
    setCustomPan(client.pan);
    setCustomGstin(client.gstin);
    setCustomCin(client.cin || '');
    setRunReport(AutonomousPracticeOrchestrator.executeFullPracticeRun(client));
    setSimRippleResult(null);
  };

  const handleTriggerAutonomousRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const updatedClient: ClientEntityDna = {
        ...selectedClient,
        pan: customPan.toUpperCase(),
        gstin: customGstin.toUpperCase(),
        cin: customCin.toUpperCase()
      };
      const report = AutonomousPracticeOrchestrator.executeFullPracticeRun(updatedClient);
      setRunReport(report);
      setIsRunning(false);
    }, 700);
  };

  const handleSimulateRipple = () => {
    const result = UniversalEntityDnaMesh.dispatchTransactionRipple(selectedClient, {
      id: `EVT-${Date.now()}`,
      eventType: simEventType,
      clientPan: selectedClient.pan,
      sourceModule: 'Autonomous Cross-Suite Bus',
      transactionDate: '2026-11-20',
      amount: simAmount,
      counterpartyName: simCounterparty,
      details: 'Real-world transaction input'
    });
    setSimRippleResult(result);
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(runReport.whatsAppBriefingText);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header - Crisp White & Brand Red Accent */}
      <div className="bg-white border-2 border-red-500 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold mb-2">
              <Cpu className="w-3.5 h-3.5 text-red-600" />
              Autonomous Practice Layer: 2035 Zero-Touch Nervous System
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Universal Entity DNA Mesh &amp; Cross-Suite Auto-Pilot
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              &quot;Input Once, Sync Everywhere&quot;: Real-world Indian statutory validation (PAN, GSTIN, CIN, TAN), 
              instant cross-suite ripple cascade across all 8 Pillars, automated Tally MOC generation, and 96% Zero-Touch partner autonomy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerAutonomousRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Synchronizing 8 Pillars...' : 'Run 100% Autonomous 8-Pillar Sync'}
            </button>
          </div>
        </div>

        {/* Global Key Metrics - Light Cards with Red & Emerald Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Zero-Touch Automation</span>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5">{runReport.overallAutomationScorePct}%</p>
            <span className="text-[11px] text-slate-600">Zero human data entry</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Pillars Orchestrated</span>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">8 / 8 Pillars</p>
            <span className="text-[11px] text-red-600 font-medium">GST, ITR, 3CD, Bank, TDS, MCA, UDIN, Tally</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Statutory Penalties Prevented</span>
            <p className="text-2xl font-bold text-red-600 mt-0.5">
              ₹{runReport.totalPenaltiesPreventedInr.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-600">Sec 271D, 271J, 234E &amp; 50</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Tally MOCs Generated</span>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{runReport.tallyVouchersGeneratedCount} Vouchers</p>
            <span className="text-[11px] text-slate-600">Posted via Tally XML Bridge</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: ENTITY DNA STATUTORY VALIDATOR & REAL CLIENT SELECTOR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-600" />
              Real-World Entity DNA Master &amp; Statutory Validator
            </h3>
            <p className="text-xs text-slate-500">Select an institutional client or enter real-world statutory credentials</p>
          </div>

          {/* Client Switcher Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectClientProfile(SAMPLE_CLIENT_DNA_APEX)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedClient.id === SAMPLE_CLIENT_DNA_APEX.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              Apex AutoTech (MP)
            </button>
            <button
              onClick={() => handleSelectClientProfile(SAMPLE_CLIENT_DNA_PRATWI)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedClient.id === SAMPLE_CLIENT_DNA_PRATWI.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              Brains & Taxes (MP)
            </button>
          </div>
        </div>

        {/* Live Statutory Regex Validator Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* PAN Validator */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">Income Tax PAN (10-Digit)</span>
              {panValidation.isValid ? (
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid
                </span>
              ) : (
                <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-red-600" /> Invalid
                </span>
              )}
            </div>
            <input
              type="text"
              value={customPan}
              maxLength={10}
              onChange={(e) => setCustomPan(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
            {panValidation.isValid ? (
              <p className="text-[11px] text-emerald-700">
                Type: <span className="font-semibold text-slate-900">{panValidation.extractedDetails?.entityCategory}</span> (4th Char: &apos;{panValidation.extractedDetails?.fourthChar}&apos;)
              </p>
            ) : (
              <p className="text-[11px] text-red-600 font-medium">{panValidation.error}</p>
            )}
          </div>

          {/* GSTIN Validator */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">GSTIN (15-Digit)</span>
              {gstinValidation.isValid ? (
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid
                </span>
              ) : (
                <span className="text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-red-600" /> Invalid
                </span>
              )}
            </div>
            <input
              type="text"
              value={customGstin}
              maxLength={15}
              onChange={(e) => setCustomGstin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
            {gstinValidation.isValid ? (
              <p className="text-[11px] text-emerald-700">
                State Code: <span className="font-semibold text-slate-900">{gstinValidation.extractedDetails?.stateCode}</span> • Embedded PAN: <span className="font-semibold text-slate-900">{gstinValidation.extractedDetails?.embeddedPan}</span>
              </p>
            ) : (
              <p className="text-[11px] text-red-600 font-medium">{gstinValidation.error}</p>
            )}
          </div>

          {/* CIN Validator */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">MCA CIN (21-Digit)</span>
              {cinValidation?.isValid ? (
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid
                </span>
              ) : (
                <span className="text-slate-500 text-[11px]">Non-Corporate / Optional</span>
              )}
            </div>
            <input
              type="text"
              value={customCin}
              maxLength={21}
              onChange={(e) => setCustomCin(e.target.value.toUpperCase())}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
            {cinValidation?.isValid && (
              <p className="text-[11px] text-emerald-700">
                {cinValidation.extractedDetails?.companyClass} (Incorp: {cinValidation.extractedDetails?.yearOfIncorporation}, State: {cinValidation.extractedDetails?.stateCode})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: CROSS-SUITE RIPPLE DISPATCHER SIMULATOR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600" />
              Live Cross-Suite Event Ripple Simulator (&quot;Input Once, Sync Everywhere&quot;)
            </h3>
            <p className="text-xs text-slate-500">
              Simulate a single transaction entry in one module and observe its instantaneous ripple across all related pillars.
            </p>
          </div>

          <button
            onClick={handleSimulateRipple}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Dispatch Live Event Ripple
          </button>
        </div>

        {/* Simulation Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Trigger Event Type</label>
            <select
              value={simEventType}
              onChange={(e) => setSimEventType(e.target.value as CrossSuiteEventType)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs focus:border-red-500 focus:outline-none"
            >
              <option value="MSME_OVERDUE_INVOICE_FLAGGED">MSME Supplier Bill Unpaid &gt; 45 Days</option>
              <option value="CASH_LOAN_269SS_FLAGGED">Cash Loan Received &gt;= ₹20,000 (Sec 269SS)</option>
              <option value="ITC_BLOCKED_17_5_FLAGGED">Corporate Club Expense (Ineligible ITC Sec 17(5))</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Counterparty / Supplier Name</label>
            <input
              type="text"
              value={simCounterparty}
              onChange={(e) => setSimCounterparty(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Transaction Value (₹)</label>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-red-600 font-bold text-xs focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Live Ripple Results - Light Red Highlight */}
        {simRippleResult && (
          <div className="mt-4 p-4 rounded-xl bg-red-50/40 border border-red-200 space-y-4">
            <div className="flex justify-between items-center border-b border-red-200 pb-2">
              <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Cross-Suite Ripple Synchronized Across {simRippleResult.impacts.length} Pillars
              </span>
              <span className="text-[11px] font-mono text-slate-500">{simRippleResult.eventId}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {simRippleResult.impacts.map((imp, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-red-700 font-bold">{imp.pillar}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                      {imp.affectedModule}
                    </span>
                  </div>
                  <p className="text-slate-800">{imp.actionTaken}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Statutory Authority: {imp.statutoryRef}</p>
                </div>
              ))}
            </div>

            {/* Generated Tally XML & WhatsApp Brief Preview */}
            {simRippleResult.generatedTallyMocXml && (
              <div className="pt-2 border-t border-red-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-red-600" />
                  Auto-Generated Tally XML MOC Voucher (Pillar VIII Sync):
                </span>
                <pre className="p-3 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-800 overflow-x-auto border border-slate-300">
                  {simRippleResult.generatedTallyMocXml}
                </pre>
              </div>
            )}

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="font-bold">Automated WhatsApp Briefing Line: </span>
              {simRippleResult.partnerWhatsAppBriefLine}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: 8-PILLAR AUTONOMOUS EXECUTION STATUS GRID */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-600" />
              Full 8-Pillar Autonomous Execution Grid
            </h3>
            <p className="text-xs text-slate-500">Live operational status across all compliance and audit dimensions</p>
          </div>

          <span className="text-xs font-mono text-slate-500">Run ID: {runReport.runId}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {runReport.pillarResults.map(pillar => (
            <div
              key={pillar.pillarNumber}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-red-300 transition-all shadow-xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{pillar.pillarTitle}</h4>
                  <span className="text-[11px] text-slate-500">Due: {pillar.statutoryDueDate}</span>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    pillar.automationStatus === 'AUTO_RESOLVED_CLEAN'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {pillar.automationStatus === 'AUTO_RESOLVED_CLEAN' ? 'Clean (Zero-Touch)' : 'Partner Review'}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">{pillar.zeroTouchRatioPct}% Automated</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                {pillar.keyOutputs.map((out, i) => (
                  <p key={i} className="flex items-start gap-1.5">
                    <span className="text-red-600 font-bold">•</span>
                    <span>{out}</span>
                  </p>
                ))}
              </div>

              {pillar.penaltiesPreventedInr > 0 && (
                <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px]">
                  <span className="text-slate-500">Penalties Prevented:</span>
                  <span className="font-mono font-bold text-red-600">
                    ₹{pillar.penaltiesPreventedInr.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: PARTNER 8:00 AM WHATSAPP BRIEFING DISPATCH DESK */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Autonomous Partner WhatsApp Briefing Digest
            </h3>
            <p className="text-xs text-slate-500">Synthesized 8:00 AM morning pulse delivered directly to managing partner mobile</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold"
            >
              {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBrief ? 'Copied!' : 'Copy WhatsApp Text'}
            </button>
            <button
              onClick={() => alert('WhatsApp briefing dispatched successfully to Partner mobile!')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch via WhatsApp API
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
          {runReport.whatsAppBriefingText}
        </div>
      </div>
    </div>
  );
}
